const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key"; // Change this to a secure key

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static frontend files

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/fileuploads', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const fileSchema = new mongoose.Schema({
    fileName: String,
    mimeType: String,
    uploader: String,
    comments: String,
    filePath: String,
    uuid: { type: String, unique: true, default: uuidv4 },
    createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', fileSchema);

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Please log in.' });
    }
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

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
