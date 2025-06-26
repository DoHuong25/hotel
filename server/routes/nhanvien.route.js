const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT ma_nv, ten_nv, chuc_vu FROM nhan_vien ORDER BY ten_nv');
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách nhân viên:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;