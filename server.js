const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/submit-form', (req, res) => {
    console.log('Form submission received:', req.body);
    
    // Here you can add logic to:
    // - Save to database
    // - Send emails
    // - Process the form data
    
    res.json({ 
        success: true, 
        message: 'Form submitted successfully!',
        data: req.body
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
}); 