const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
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
    summary: String,
    filePath: String,
    uuid: { type: String, unique: true, default: uuidv4 }
});

const File = mongoose.model('File', fileSchema);

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Upload Route
app.post('/upload', upload.single('file'), async (req, res) => {
    const { uploader, summary } = req.body;
    const newFile = new File({
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        uploader,
        summary,
        filePath: `/uploads/${req.file.originalname}`,
        uuid: uuidv4() // Generate a unique UUID
    });
    await newFile.save();
    res.status(201).send('File uploaded successfully');
});

// Get All Files
app.get('/files', async (req, res) => {
    const files = await File.find();
    res.json(files);
});

// Edit File Summary
app.put('/edit/:id', async (req, res) => {
    const { summary } = req.body;
    await File.findByIdAndUpdate(req.params.id, { summary });
    res.send('Summary updated');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
