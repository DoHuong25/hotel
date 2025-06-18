// phong.model.js - DB queries for phong
// phong.model.js - Model xử lý logic dữ liệu phòng

function isValidLoaiPhong(loai) {
  return ['Standard', 'Luxury', 'President'].includes(loai);
}

function isValidTrangThai(trangThai) {
  return ['Trong', 'Da_dat', 'Dang_o', 'Bao_tri'].includes(trangThai);
}

module.exports = { isValidLoaiPhong, isValidTrangThai };
