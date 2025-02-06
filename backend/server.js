const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key"; // Change this to a secure key

// SQLite Database Connection
const db = new sqlite3.Database('./backend/db/db.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static frontend files

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.redirect('/login.html');
    }
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        return res.redirect('/login.html');
    }
};

// User Login Route (Using SQLite for Authentication)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Compare hashed password
        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (err || !match) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            res.cookie('authToken', token, { httpOnly: true });
            res.redirect('/upload.html');
        });
    });
});

// User Logout Route
app.get('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/login.html');
});

// Serve login page as default
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original filename
    }
});

const upload = multer({ storage });

// Upload Route (Protected)
app.post('/upload', authenticateUser, upload.single('file'), async (req, res) => {
    const uploader = req.user.username; // Automatically use logged-in user
    const { comments } = req.body;
    const newFile = new File({
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        uploader,
        comments,
        filePath: `/uploads/${req.file.originalname}`,
        uuid: uuidv4(),
        createdAt: new Date()
    });
    await newFile.save();
    res.status(201).send('File uploaded successfully');
});

// Get All Files
app.get('/files', authenticateUser, async (req, res) => {
    const files = await File.find();
    res.json(files);
});

// Edit File Comments (Protected)
app.put('/edit/:id', authenticateUser, async (req, res) => {
    const { comments } = req.body;
    await File.findByIdAndUpdate(req.params.id, { comments });
    res.send('Comments updated');
});

// Delete File Route (Protected)
app.delete('/delete/:id', authenticateUser, async (req, res) => {
    const file = await File.findById(req.params.id);
    if (file) {
        // Remove file from the filesystem
        fs.unlink(path.join(__dirname, file.filePath), (err) => {
            if (err) {
                console.error("File deletion error:", err);
            }
        });
        
        // Remove file record from database
        await File.findByIdAndDelete(req.params.id);
        res.send('File deleted successfully');
    } else {
        res.status(404).send('File not found');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
