const pool = require('../db');
const { generateId } = require('../utils/id.util'); // Đảm bảo generateId được import đúng cách

// GET /api/khachhang?search=
const getAllKhachHang = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = `
      SELECT * FROM khach_hang
      WHERE LOWER(ten_kh) LIKE LOWER($1)
         OR sdt LIKE $1
         OR email ILIKE $1
         OR cmnd LIKE $1
      ORDER BY ma_kh;
    `;
    const result = await pool.query(query, [`%${search}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi trong getAllKhachHang:", err); // Thêm log lỗi chi tiết
    res.status(500).json({ error: err.message });
  }
};

// GET /api/khachhang/:id
const getKhachHangById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM khach_hang WHERE ma_kh = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi trong getKhachHangById:", err); // Thêm log lỗi chi tiết
    res.status(500).json({ error: err.message });
  }
};

// POST /api/khachhang
const createKhachHang = async (req, res) => {
  try {
    const { ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich } = req.body;
    // SỬA LỖI TẠI ĐÂY: generateId là hàm đồng bộ, KHÔNG cần 'await'
    const ma_kh = generateId('KH'); 
    
    const insertQuery = `
      INSERT INTO khach_hang (ma_kh, ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;
    `;
    const values = [ma_kh, ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich];
    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi trong createKhachHang:", err); // Thêm log lỗi chi tiết
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/khachhang/:id
const updateKhachHang = async (req, res) => {
  try {
    const { id } = req.params;
    const { ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich } = req.body;
    const updateQuery = `
      UPDATE khach_hang SET
        ten_kh=$1, sdt=$2, email=$3, cmnd=$4,
        dia_chi=$5, ngay_sinh=$6, gioi_tinh=$7, quoc_tich=$8
      WHERE ma_kh=$9 RETURNING *;
    `;
    const values = [ten_kh, sdt, email, cmnd, dia_chi, ngay_sinh, gioi_tinh, quoc_tich, id];
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi trong updateKhachHang:", err); // Thêm log lỗi chi tiết
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/khachhang/:id
const deleteKhachHang = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM khach_hang WHERE ma_kh = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    res.json({ message: 'Đã xoá khách hàng' });
  } catch (err) {
    console.error("Lỗi trong deleteKhachHang:", err); // Thêm log lỗi chi tiết
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllKhachHang,
  getKhachHangById,
  createKhachHang,
  updateKhachHang,
  deleteKhachHang
};
