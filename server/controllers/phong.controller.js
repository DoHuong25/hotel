const db = require('../db');
const { generateId } = require('../utils/id.util'); // Đảm bảo đã sửa generateId trong id.util.js (CommonJS)

const getAllPhong = async (req, res) => {
  const search = req.query.search || '';
  const ngayNhan = req.query.ngay_nhan; // Lấy ngày nhận từ query parameter
  const ngayTra = req.query.ngay_tra;   // Lấy ngày trả từ query parameter

  let query = `
    SELECT p.* FROM phong p
    WHERE (LOWER(p.so_phong) LIKE LOWER($1) OR LOWER(p.loai_phong) LIKE LOWER($1))
  `;
  const params = [`%${search}%`];
  let paramIndex = 2; // Bắt đầu index cho các tham số ngày (nếu có)

  if (ngayNhan && ngayTra) {
  
    query += `
      AND p.ma_phong NOT IN (
        SELECT pdph.ma_phong
        FROM phong_dat pdph
        JOIN phieu_dat pd ON pdph.ma_phieu = pd.ma_phieu
        WHERE (
                  (pd.ngay_nhan < $${paramIndex} AND pd.ngay_tra > $${paramIndex + 1}) -- Đặt phòng hiện có chồng lên ngày nhận của yêu cầu
                  OR (pd.ngay_nhan >= $${paramIndex + 1} AND pd.ngay_nhan < $${paramIndex}) -- Đặt phòng hiện có bắt đầu trong khoảng yêu cầu
                  OR (pd.ngay_tra > $${paramIndex + 1} AND pd.ngay_tra <= $${paramIndex}) -- Đặt phòng hiện có kết thúc trong khoảng yêu cầu
                  OR (pd.ngay_nhan <= $${paramIndex + 1} AND pd.ngay_tra >= $${paramIndex}) -- Đặt phòng hiện có bao trùm khoảng yêu cầu
                )
      )
      AND p.trang_thai NOT IN ('Bao_tri') -- Luôn loại trừ các phòng đang bảo trì khỏi danh sách khả dụng
    `;
    params.push(ngayTra, ngayNhan); // Thêm ngày trả và ngày nhận vào mảng tham số
  } else {
    
    query += ` AND p.trang_thai NOT IN ('Bao_tri')`; 
  }
  
  query += ` ORDER BY p.so_phong`;

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi trong getAllPhong (theo ngày):", err);
    res.status(500).json({ error: err.message });
  }
};


const getPhongById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM phong WHERE ma_phong = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy phòng' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Lỗi trong getPhongById:", err);
    res.status(500).json({ error: err.message });
  }
};

const createPhong = async (req, res) => {
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  try {
    const ma_phong = generateId('P'); // Sử dụng generateId (đã sửa sang CommonJS)
    await db.query(`
      INSERT INTO phong (ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [ma_phong, so_phong, loai_phong, loai_giuong, gia, trang_thai]);
    res.json({ message: 'Thêm phòng thành công' });
  } catch (err) {
    console.error("Lỗi trong createPhong:", err);
    res.status(500).json({ error: err.message });
  }
};

const updatePhong = async (req, res) => {
  const { id } = req.params;
  const { so_phong, loai_phong, loai_giuong, gia, trang_thai } = req.body;
  try {
    await db.query(`
      UPDATE phong SET so_phong = $1, loai_phong = $2, loai_giuong = $3, gia = $4, trang_thai = $5
      WHERE ma_phong = $6
    `, [so_phong, loai_phong, loai_giuong, gia, trang_thai, id]);
    res.json({ message: 'Cập nhật phòng thành công' });
  } catch (err) {
    console.error("Lỗi trong updatePhong:", err);
    res.status(500).json({ error: err.message });
  }
};

const deletePhong = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM phong WHERE ma_phong = $1', [id]);
    res.json({ message: 'Xoá phòng thành công' });
  } catch (err) {
    console.error("Lỗi trong deletePhong:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPhong,
  getPhongById,
  createPhong,
  updatePhong,
  deletePhong
};
