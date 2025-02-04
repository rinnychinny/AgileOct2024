const express = require("express");

const app = express();
const PORT = 5000;

// Simple GET Route
app.get("/", (req, res) => {
    res.send("Hello, Express!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
