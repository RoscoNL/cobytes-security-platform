const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files from the public directory
app.use(express.static('/Users/jeroenvanrossum/Documents/cobytes-platform/public'));

// Fallback to index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile('/Users/jeroenvanrossum/Documents/cobytes-platform/public/index.html');
});

app.listen(PORT, () => {
    console.log(`Frontend server running on http://localhost:${PORT}`);
});