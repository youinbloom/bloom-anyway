const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Serve index.html for all routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Bloom Anyway development server running on http://localhost:${PORT}`);
  console.log(`📖 Open your browser to: http://localhost:${PORT}`);
});
