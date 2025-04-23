const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

let users = {};  // Store users in memory for simplicity
let messages = {}; // Store messages

// Load users and messages from file
const loadData = () => {
    if (fs.existsSync('users.json')) {
        users = JSON.parse(fs.readFileSync('users.json'));
    }
    if (fs.existsSync('messages.json')) {
        messages = JSON.parse(fs.readFileSync('messages.json'));
    }
};
loadData();

// Save users and messages to file
const saveData = () => {
    fs.writeFileSync('users.json', JSON.stringify(users));
    fs.writeFileSync('messages.json', JSON.stringify(messages));
};

// Home Route
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Signup Route
app.post('/signup', (req, res) => {
    const { userId, password } = req.body;
    if (users[userId]) {
        res.send('User already exists');
    } else {
        users[userId] = { password };
        saveData();
        req.session.userId = userId;
        res.redirect('/');
    }
});

// Login Route
app.post('/login', (req, res) => {
    const { userId, password } = req.body;
    if (users[userId] && users[userId].password === password) {
        req.session.userId = userId;
        res.redirect('/');
    } else {
        res.send('Invalid credentials');
    }
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Send Message Route
app.post('/send-message', (req, res) => {
    const { toUserId, message } = req.body;
    const fromUserId = req.session.userId;
    if (toUserId && message && users[toUserId]) {
        if (!messages[toUserId]) {
            messages[toUserId] = [];
        }
        messages[toUserId].push({ from: fromUserId, message });
        saveData();
        res.redirect('/');
    } else {
        res.send('User not found or message is empty');
    }
});

// View Messages Route
app.get('/messages', (req, res) => {
    const userId = req.session.userId;
    if (messages[userId]) {
        res.json(messages[userId]);
    } else {
        res.json([]);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
