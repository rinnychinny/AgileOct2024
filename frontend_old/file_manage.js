<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Document</title>
</head>
<body>
    <h1>Upload Document</h1>
    <form id="uploadForm" enctype="multipart/form-data">
        <input type="text" id="title" name="title" placeholder="Enter document title" required><br>
        <input type="text" id="group" name="group" placeholder="Enter group name" required><br>
        <input type="file" id="file" name="file" required><br>
        <button type="submit">Upload</button>
    </form>
    
    <h2>Uploaded Documents</h2>
    <ul id="documentList"></ul>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${result.title}</strong> (${result.group}) - <a href="http://localhost:5000/files/${result.filename}" target="_blank">View</a>`;
            document.getElementById('documentList').appendChild(listItem);
        });
    </script>
</body>
</html>
