const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'MySQL@pass',
  database: 'store_rating'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Signup Route
app.post('/signup', (req, res) => {
  const { name, email, address, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (name, email, address, password, role) VALUES (?, ?, ?, ?, 'normal_user')`;

  db.query(query, [name, email, address, hashedPassword], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return res.json({ success: false, message: 'Signup failed' });
    }
    res.json({ success: true, message: 'Signup successful' });
  });
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email = ?`;

  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ success: false, message: 'Invalid password' });
    }

    res.json({ success: true, role: user.role });
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// Fetch summary for admin dashboard
app.get('/admin/summary', (req, res) => {
  const totalUsersQuery = `SELECT COUNT(*) AS totalUsers FROM users`;
  const totalStoresQuery = `SELECT COUNT(*) AS totalStores FROM stores`;
  const totalRatingsQuery = `SELECT COUNT(*) AS totalRatings FROM ratings`;

  Promise.all([
    db.promise().query(totalUsersQuery),
    db.promise().query(totalStoresQuery),
    db.promise().query(totalRatingsQuery)
  ]).then(([usersResult, storesResult, ratingsResult]) => {
    res.json({
      totalUsers: usersResult[0][0].totalUsers,
      totalStores: storesResult[0][0].totalStores,
      totalRatings: ratingsResult[0][0].totalRatings
    });
  });
});

// Add new user (admin, store owner, or normal user)
app.post('/admin/add_user', (req, res) => {
  const { name, email, address, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `INSERT INTO users (name, email, address, password, role) VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [name, email, address, hashedPassword, role], (err, result) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json({ success: true });
    }
  });
});

// Fetch users and apply sorting
app.get('/admin/users', (req, res) => {
  const sortBy = req.query.sort || 'name';
  const query = `SELECT name, email, role FROM users ORDER BY ${sortBy}`;
  db.query(query, (err, results) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json(results);
    }
  });
});

// Fetch stores and apply sorting
app.get('/admin/stores', (req, res) => {
  const sortBy = req.query.sort || 'name';
  const query = `SELECT name, address, average_rating FROM stores ORDER BY ${sortBy}`;
  db.query(query, (err, results) => {
    if (err) {
      res.json({ success: false, error: err });
    } else {
      res.json(results);
    }
  });
});

// Fetch Store Owner ratings
app.get('/store_owner/ratings', (req, res) => {
  const storeOwnerId = req.userId; // Assuming you have the store owner's ID from the session

  const ratingsQuery = `
    SELECT u.name AS userName, r.rating 
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.store_id = (SELECT id FROM stores WHERE owner_id = ?)
  `;

  const averageRatingQuery = `
    SELECT AVG(rating) AS averageRating 
    FROM ratings 
    WHERE store_id = (SELECT id FROM stores WHERE owner_id = ?)
  `;

  Promise.all([
    db.promise().query(ratingsQuery, [storeOwnerId]),
    db.promise().query(averageRatingQuery, [storeOwnerId])
  ]).then(([ratingsResult, avgResult]) => {
    res.json({
      ratings: ratingsResult[0],
      averageRating: avgResult[0][0].averageRating
    });
  }).catch(err => {
    res.status(500).json({ success: false, error: err.message });
  });
});

// Switch Role Route
app.post('/switch_role', (req, res) => {
  const { userId, role } = req.body;
  const query = `UPDATE users SET role = ? WHERE id = ?`;
  
  db.query(query, [role, userId], (err, result) => {
    if (err) {
      return res.json({ success: false, message: 'Error switching role' });
    }
    res.json({ success: true, message: 'Role switched successfully', newRole: role });
  });
});

// Add Store Route
app.post('/add_store', (req, res) => {
  const { name, address, rating } = req.body;
  const ownerId = req.userId || 1; // Assuming the store owner ID comes from the session, hardcoded here as 1 for testing.

  const query = `INSERT INTO stores (name, address, owner_id, average_rating) VALUES (?, ?, ?, ?)`;
  db.query(query, [name, address, ownerId, rating], (err, result) => {
    if (err) {
      console.error('Error adding store:', err);
      return res.json({ success: false, message: 'Failed to add store' });
    }
    res.json({ success: true, message: 'Store added successfully' });
  });
});

// Submit Rating Route
app.post('/submit_rating', (req, res) => {
  const { userId, storeId, rating } = req.body;

  if (rating < 1 || rating > 5) {
    return res.json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  const query = `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)`;
  db.query(query, [userId, storeId, rating], (err, result) => {
    if (err) {
      console.error('Error submitting rating:', err);
      return res.json({ success: false, message: 'Failed to submit rating' });
    }
    res.json({ success: true, message: 'Rating submitted successfully' });
  });
});
////////////////////////////////////////////////////////

// Handle Reset Password
app.post('/reset_password', (req, res) => {
  const { email } = req.body;

  // Here, you should generate a reset token and send it to the user's email
  // For simplicity, we'll assume success
  // In a real application, you'd store the token in your database, along with an expiration time

  // Check if the user exists
  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false, message: 'Email not found' });
    }

    // Send reset link (simulate with a success response)
    res.json({ success: true, message: 'Reset link sent to your email.' });

    // Here you would send an email containing the reset link and token
  });
});
