const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 5000;

// Simple GET Route
//app.get("/", (req, res) => {
//    res.send("Hello, Express!");
//});


// Serve the HTML file from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({ fileName: req.file.filename, filePath: `/uploads/${req.file.filename}` });
});

// Serve uploaded files
app.use("/uploads", express.static("uploads"));