-- In powershell run Get-Content schema.sql | sqlite3 db.sqlite

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'admin', 'insti')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test users (only if they don't already exist)
INSERT INTO users (username, password_hash, role) 
--uses bcrpyt hash for plaintext admin123
SELECT 'admin_test',  '$2a$10$oZ697GTIWKrTMi2lhP2x7OWk5liBrvEwSP0vJL5oNKnckM0uprGLK', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin_test');

INSERT INTO users (username, password_hash, role)
--uses brcypt hash for plaintext student123
SELECT 'student_test', '$2a$10$o.NUKP4p.bgzX5.DGCUOveLsKp5odJkCGjPnhQpig8SRvxJLWBWQ2', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'student_test');

INSERT INTO users (username, password_hash, role) 
--uses brcypt hash for plaintext inst123
SELECT 'insti_test',  '$2a$10$JQXx6hzoEwftaSRQtGk1N.ZonYdz1JblI3a4yUbe0aTZvUBJJPCo.', 'insti'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'insti_test');

-- Create the "files" table to store metadata and file paths
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    uploader TEXT NOT NULL,
    comments TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create "courses" table to store course metadata
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseName TEXT NOT NULL,
    creator TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create "course_files" table to store the relationship between courses and files
CREATE TABLE IF NOT EXISTS course_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    fileId INTEGER NOT NULL,
    orderIndex INTEGER NOT NULL, -- Determines order in the course
    FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (fileId) REFERENCES files(id) ON DELETE CASCADE
);

-- Tables related to tracking user interactions / sessions
-- sessions table to track user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- session_context table to link sessions with relevant files used in session context
CREATE TABLE IF NOT EXISTS session_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- interactions table to log session each session interactions
CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    llm_role TEXT NOT NULL CHECK(llm_role IN ('user', 'assistant')),
    llm_text TEXT NOT NULL,
    llm_parts TEXT,
    interaction_text TEXT NOT NULL,
    interaction_type TEXT NOT NULL CHECK(interaction_type IN ('summary', 'quiz', 'chat')),
    interaction_subtype TEXT NOT NULL CHECK(interaction_subtype IN (
        'summary_req', 'summary_ans', 
        'quiz_request', 'quiz_questions', 'quiz_answer_user', 'quiz_answer_feedback',
        'chat_user', 'chat_response'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
-- End of Tables related to tracking user interactions / sessions
