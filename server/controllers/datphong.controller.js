// datphong.controller.js - controller for datphong
const pool = require('../db');
const { generateId } = require('../utils/id.util');

// Đặt phòng mới
const datPhong = async (req, res) => {
  const { ma_kh, ma_nv, ngay_nhan, ngay_tra, ma_phong } = req.body;
  try {
    const ma_phieu = await generateId('phieu_dat', 'PD');
    const phongDat = await generateId('phong_dat', 'PDPH');

    // 1. Tạo phiếu đặt
    await pool.query(`
      INSERT INTO phieu_dat (ma_phieu, ma_kh, ma_nv, ngay_dat, ngay_nhan, ngay_tra)
      VALUES ($1, $2, $3, CURRENT_DATE, $4, $5);
    `, [ma_phieu, ma_kh, ma_nv, ngay_nhan, ngay_tra]);

    // 2. Tạo phòng đặt
    await pool.query(`
      INSERT INTO phong_dat (ma_phong_dat, ma_phieu, ma_phong)
      VALUES ($1, $2, $3);
    `, [phongDat, ma_phieu, ma_phong]);

    // 3. Cập nhật trạng thái phòng
    await pool.query(`
      UPDATE phong SET trang_thai = 'Da_dat' WHERE ma_phong = $1;
    `, [ma_phong]);

    res.status(201).json({ ma_phieu, message: 'Đặt phòng thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { datPhong };
