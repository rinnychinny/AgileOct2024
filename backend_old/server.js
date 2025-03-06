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
//const llmApi = require('../gemini-api/llm-api');

(async () => {
    const api = await import('../gemini-api/llm-api.mjs'); // Path to your ES module
    console.log(api.default); // Access default export


const GEMINI_API_KEY = 'AIzaSyCgWrQpxjatd_Na-6_FflB4vHeXyGSbr1Q';
const llmApi = new api.default(GEMINI_API_KEY);


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
app.use(express.static(path.join(__dirname, '../frontend_old')));

//Serve files from /uploads statically
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


//************** User, login and authentication code **********************************

//Middleware to authenticate user via cookie
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

        //Fetch user from SQLite database
        const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username]);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        //Validate password with bcrypt
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        //Generate JWT token
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });

        //Set HTTP-only cookie (for security)
        res.cookie('authToken', token, { httpOnly: true, secure: false, maxAge: 3600000 });

        res.status(200).json({ success: true, redirectUrl: '/courses.html' });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Server error. Try again.' });
    }
});

//************** End of User, login and authentication code **********************************

//********* Routes related to files *************************************************

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

app.get('/files/details', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const fileIds = req.query.fileIds?.split(',') || [];

    if (fileIds.length === 0) {
        return res.status(400).json({ message: "No file IDs provided" });
    }

    try {
        // Use placeholders in SQL to prevent injection
        const placeholders = fileIds.map(() => '?').join(',');
        const files = await db.all(
            `SELECT * FROM files WHERE id IN (${placeholders})`, 
            fileIds
        );

        res.json(files);
    } catch (error) {
        console.error("Error fetching file details:", error);
        res.status(500).json({ message: "Failed to retrieve file details." });
    }
});

//Edit File Metadata (comments)
app.put('/edit/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { comments } = req.body;
    const { id } = req.params;

    await db.run(`UPDATE files SET comments = ? WHERE id = ?`, [comments, id]);
    res.json({ message: "File metadata updated successfully" });
});

//Delete File (Also Remove from File System)
app.delete('/delete/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    //Fetch file path before deleting
    const file = await db.get(`SELECT filePath FROM files WHERE id = ?`, [id]);
    if (!file) return res.status(404).json({ message: "File not found" });

    //Delete file from filesystem
    const fullFilePath = path.join(__dirname, '../', file.filePath);
    if (fs.existsSync(fullFilePath)) fs.unlinkSync(fullFilePath);

    //Remove from database
    await db.run(`DELETE FROM files WHERE id = ?`, [id]);
    res.json({ message: "File deleted successfully" });
});

//********* End of routes related to files *************************************************



//********* routes related to courses *************************************************

//Fetch all courses
app.get('/courses', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const courses = await db.all(`SELECT * FROM courses ORDER BY createdAt DESC`);
    res.json(courses);
});

//get course information for a particular course ID
app.get('/courses/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    try {
        const course = await db.get(`SELECT * FROM courses WHERE id = ?`, [id]);

        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }

        res.json(course);
    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: "Failed to fetch course details." });
    }
});



//Get course materials for specified course
app.get('/courses/:id/materials', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    //Get course materials
    const materials = await db.all(`
        SELECT cf.id coursefile_id, f.id file_id, f.source, f.filePath, f.mimeType, cf.orderIndex
        FROM course_files cf
        JOIN files f ON cf.fileId = f.id
        WHERE cf.courseId = ?
        ORDER BY cf.orderIndex ASC
    `, [id]);

    res.json(materials);
});

//Create a new course
app.post('/courses', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { courseName } = req.body;

    if (!courseName) {
        return res.status(400).json({ message: "Course name is required" });
    }

    //Insert new course into the database
    const result = await db.run(
        `INSERT INTO courses (courseName, creator) VALUES (?, ?)`,
        [courseName, req.user.username]
    );

    res.json({ message: "Course created successfully!", courseId: result.lastID });
});

//Delete a course (Removes the course and its associated files)
app.delete('/courses/:id', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;

    //Delete associated files from the course_files table
    await db.run(`DELETE FROM course_files WHERE courseId = ?`, [id]);

    //Delete the course itself
    await db.run(`DELETE FROM courses WHERE id = ?`, [id]);

    res.json({ message: "Course deleted successfully!" });
});

//Add a file to a course
app.post('/courses/:id/add-file', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;
    const { fileId } = req.body;

    //Get current max orderIndex in the course
    const maxOrder = await db.get(`SELECT MAX(orderIndex) as maxOrder FROM course_files WHERE courseId = ?`, [id]);
    const newOrderIndex = (maxOrder?.maxOrder || 0) + 1;

    await db.run(
        `INSERT INTO course_files (courseId, fileId, orderIndex) VALUES (?, ?, ?)`,
        [id, fileId, newOrderIndex]
    );

    res.json({ message: "File added to course!" });
});

//Remove a row (file) from a course
app.delete('/courses/:courseId/remove-file/:courseFileId', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { courseFileId } = req.params;

    try {
        // Delete only the specific row based on `course_files.id`
        const result = await db.run(`DELETE FROM course_files WHERE id = ?`, [courseFileId]);

        if (result.changes === 0) {
            return res.status(404).json({ message: "File not found in course." });
        }

        res.json({ message: "File removed from course successfully!" });
    } catch (error) {
        console.error("Error removing file:", error);
        res.status(500).json({ message: "Failed to remove file from course." });
    }
});


//Reorder course materials
app.put('/courses/:id/update-order', authenticateUser, async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;
    const { firstCourseFileId, secondCourseFileId } = req.body;
    
    try {
        // Fetch the current order indices of both items
        const firstItem = await db.get(`SELECT id, orderIndex FROM course_files WHERE id = ? AND courseId = ?`, [firstCourseFileId, id]);
        const secondItem = await db.get(`SELECT id, orderIndex FROM course_files WHERE id = ? AND courseId = ?`, [secondCourseFileId, id]);
        
        if (!firstItem || !secondItem) {
            return res.status(404).json({ message: "One or both files not found in course." });
        }
        
        // Swap the order indices
        await db.run(`UPDATE course_files SET orderIndex = ? WHERE id = ?`, [secondItem.orderIndex, firstItem.id]);
        await db.run(`UPDATE course_files SET orderIndex = ? WHERE id = ?`, [firstItem.orderIndex, secondItem.id]);

        res.json({ message: "Course material order swapped successfully." });
    } catch (error) {
        console.error("Error swapping course material order:", error);
        res.status(500).json({ message: "Failed to swap order." });
    }
});

//********* End of routes related to courses *************************************************


//********* LLM API related routes ***********************************************************

//Upload files to llm for later reference
//returns gemini uri to files
app.post('/llm_upload_file', authenticateUser, async (req, res) => {
    try {
        const {files} = req.body;

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: "Invalid or missing 'files' array in request body" });
        }

        // Upload each file to Gemini and replace local paths with Gemini URIs
        const uploadedFiles = await Promise.all(
            files.map(async (file) => {
                try {
                    const localFilePath = path.join(__dirname, '../uploads/', path.basename(file.uri)); // Resolve to absolute path
                    //const geminiFileUri = await llmApi.uploadFile(localFilePath, file.mimeType); // Upload and get Gemini file URI
                    const geminiFileData = await llmApi.uploadFile(localFilePath, file.mimeType); // Upload and get Gemini file URI
                    //return { uri: geminiFileUri.uri, mimeType: file.mimeType }; // Use Gemini URI
                    return geminiFileData;
                } catch (uploadError) {
                    console.error("Error uploading file to Gemini:", uploadError);
                    return { uri: null, mimeType: file.mimeType, error: "Upload failed" };
                }
            })
        );

        res.status(200).json({ uploadedFiles });
    } catch (error) {
        console.error("Error getting LLM response:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Get a quiz response from the LLM
//files must already have a gemini uri (not local)
app.post('/llm_get_quiz', authenticateUser, async (req, res) => {
    try {
        const {files} = req.body;

        // Call the Gemini API via chatResponse
        const numQuestions = 3;
        const responseQuiz = await llmApi.generateQuiz(files, numQuestions);

        res.status(200).json({ response: responseQuiz });
    } catch (error) {
        console.error("Error getting LLM quiz:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//Get a quiz evaluation from the LLM
//Based on the model answer, so files not required
app.post('/llm_eval_quiz', authenticateUser, async (req, res) => {
    try {
        const {QandA} = req.body;

        // Call the Gemini API quiz evaluation
        const evaluateQuiz = await llmApi.evaluateAllAnswers(QandA);

        res.status(200).json({ response: evaluateQuiz });
    } catch (error) {
        console.error("Error getting LLM quiz:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//generates gemini chat fromat from conversation array of {role, text}
function geminiChatFromConversation(conversation, files) {
    //Prepare chat history format
    let chatSoFar = [];
    let firstTurn = true;
    for (const conv of conversation) {
        if (firstTurn) {
            chatSoFar = api.default.chat_add_response(chatSoFar, conv.role, conv.text, files);
            firstTurn = false;
        }
        else {
            chatSoFar = api.default.chat_add_response(chatSoFar, conv.role, conv.text, []);
        }
    }
    return chatSoFar;
}

//Get a chat response from the LLM
//files must already have a gemini uri (not local)
app.post('/llm_response', authenticateUser, async (req, res) => {
    try {
        const { conversation, files } = req.body;

        if (!conversation) {
            return res.status(400).json({ error: "User input is required" });
        }

        const chatSoFar = geminiChatFromConversation(conversation, files);

        // Call the Gemini API via chatResponse
        const responseText = await llmApi.chatResponse(chatSoFar);

        res.status(200).json({ response: responseText });
    } catch (error) {
        console.error("Error getting LLM response:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


//Get a chat response stream from the LLM
//files must already have a gemini uri (not local)
app.post('/llm_response_stream', authenticateUser, async (req, res) => {
    try {
        const { conversation, files } = req.body;

        if (!conversation) {
            return res.status(400).json({ error: "User input is required" });
        }

        const chatSoFar = geminiChatFromConversation(conversation, files);

        // Set response headers for streaming
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");
        
        //Call the llm API via chatResponseStream to get a stream
        const resultStream = await llmApi.chatResponseStream(chatSoFar, (chunk) => {
            res.write(chunk); // Send each chunk immediately to the client
        });

        res.end(); // End response when streaming is complete

    } catch (error) {
        console.error("Error getting LLM response:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//********* End of LLM API related routes **************************************************************/


//Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

})();
