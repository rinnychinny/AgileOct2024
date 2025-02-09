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
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    uploader TEXT NOT NULL,
    comments TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



