const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();
const pool = require('./db');

// Middleware
app.use(cors());
app.use(express.json());

// 👉 Thêm dòng này để phục vụ file HTML/CSS/JS từ thư mục public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes API
app.use('/api/khachhang', require('./routes/khachhang.route'));
app.use('/api/phong', require('./routes/phong.route'));
app.use('/api/dichvu', require('./routes/dichvu.route'));
app.use('/api/hoadon', require('./routes/hoadon.route'));
app.use('/api/datphong', require('./routes/datphong.route'));

// Test DB connection
app.get('/api', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`API đang hoạt động! ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
