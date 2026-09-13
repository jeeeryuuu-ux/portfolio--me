const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message, reason } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in all required fields (name, email, message).'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.'
    });
  }

  console.log('[Contact Message Received]', {
    name,
    email,
    reason: reason || 'General inquiry',
    messageLength: message.length,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: "Message sent — I'll reply within a couple of days."
  });
});

const staticDir = path.join(__dirname, 'portfolio');

// Friendly clean URL rewrites
app.get('/work', (req, res) => {
  res.sendFile(path.join(staticDir, 'work.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(staticDir, 'about.html'));
});

// Serve static assets from the portfolio directory
app.use(express.static(staticDir));

// Support /portfolio prefix for any explicit paths
app.use('/portfolio', express.static(staticDir));

// Support /public prefix if referenced directly
app.use('/public', express.static(path.join(__dirname, 'public')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
