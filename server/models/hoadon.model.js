// hoadon.model.js - DB queries for hoadon
// hoadon.model.js - Model xử lý logic hóa đơn

function isValidThanhToan(hinhThuc) {
  return ['cash', 'banking', 'momo', 'zalopay'].includes(hinhThuc);
}

function isValidTrangThai(tt) {
  return ['da_thanh_toan', 'dang_xu_li'].includes(tt);
}

module.exports = { isValidThanhToan, isValidTrangThai };
