const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db/db'); 
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, weight, height, dob, gender } = req.body;
  
  if (!name || !email || !password || !weight || !height || !dob || !gender) {
    return res.json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if user exists
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (results.length > 0) {
      return res.json({ success: false, message: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    await db.query(
      'INSERT INTO users (name, email, password, weight, height, dob, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, weight, height, dob, gender]
    );
    
    res.json({ success: true, message: 'Signup successful!' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if user exists
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (results.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    // Set session
    req.session.user = { 
      id: user.id, 
      name: user.name,
      email: user.email
    };
    
    res.json({ success: true, message: 'Login successful!' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user profile data
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [results] = await db.query(
            'SELECT id, name, email, weight, height, dob, gender, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: results[0]
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

// Get current user session
router.get('/current-user', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            success: true,
            user: req.session.user
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'No user session found'
        });
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ error: 'Failed to logout' });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
