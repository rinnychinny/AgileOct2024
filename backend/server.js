const express = require('express');
const path = require('path');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key";

//Promise to Connect to SQLite and use async/await rather than callbacks 
const dbPromise = open({
    filename: path.join(__dirname, './db/db.sqlite'),
    driver: sqlite3.Database
});

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

//Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

//Redirect root ("/") to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uuid = uuidv4(); //Generate UUID
        cb(null, `${uuid}${ext}`); //Save file as UUID.ext
    }
});

const upload = multer({ storage });

//Middleware: authenticate User via cookie
const authenticateUser = async (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

//Fetch Current Logged-in User
app.get('/current-user', authenticateUser, (req, res) => {
    res.json({ username: req.user.username });
});

//User Login Route
app.post('/login', async (req, res) => {
    try {
        const db = await dbPromise;
        const { username, password } = req.body;

        // ✅ Fetch user from SQLite database
        const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username]);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // ✅ Validate password with bcrypt
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // ✅ Generate JWT token
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        // ✅ Set HTTP-only cookie (for security)
        res.cookie('authToken', token, { httpOnly: true, secure: false, maxAge: 3600000 });

        res.status(200).json({ success: true, redirectUrl: '/file_uploader.html' });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Server error. Try again.' });
    }
});

//Upload File with UUID Filename but keep original name in source field
app.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
    const db = await dbPromise;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const filePath = `/uploads/${file.filename}`; //UUID filename for storage

    //Insert into SQLite database
    const result = await db.run(
        `INSERT INTO files (source, fileName, filePath, mimeType, uploader, comments) VALUES (?, ?, ?, ?, ?, ?)`,
        [file.originalname, file.filename, filePath, file.mimetype, req.user.username, req.body.comments || null]
    );

    res.json({ message: "File uploaded successfully!", fileUrl: filePath, fileId: result.lastID });
});

//Fetch All Files
app.get('/files', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const files = await db.all(`SELECT * FROM files ORDER BY createdAt ASC`);
    res.json(files);
});

// ✅ Edit File Metadata
app.put('/edit/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { comments } = req.body;
    const { id } = req.params;

    await db.run(`UPDATE files SET comments = ? WHERE id = ?`, [comments, id]);
    res.json({ message: "File metadata updated successfully" });
});

// ✅ Delete File (Also Remove from File System)
app.delete('/delete/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    // ✅ Fetch file path before deleting
    const file = await db.get(`SELECT filePath FROM files WHERE id = ?`, [id]);
    if (!file) return res.status(404).json({ message: "File not found" });

    // ✅ Delete file from filesystem
    const fullFilePath = path.join(__dirname, '../', file.filePath);
    if (fs.existsSync(fullFilePath)) fs.unlinkSync(fullFilePath);

    // ✅ Remove from database
    await db.run(`DELETE FROM files WHERE id = ?`, [id]);
    res.json({ message: "File deleted successfully" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
