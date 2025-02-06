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
SELECT 'admin_test',  'hashedpassword123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin_test');

INSERT INTO users (username, password_hash, role) 
SELECT 'student_test', 'hashedpassword456', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'student_test');

INSERT INTO users (username, password_hash, role) 
SELECT 'insti_test',  'hashedpassword789', 'insti'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'insti_test');
