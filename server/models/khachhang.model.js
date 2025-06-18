// khachhang.model.js - DB queries for khachhang
// khachhang.model.js - Model xử lý logic dữ liệu khách hàng

function isValidPhone(sdt) {
  return /^\d{10}$/.test(sdt);
}

function isValidCCCD(cmnd) {
  return /^\d{12}$/.test(cmnd);
}

module.exports = { isValidPhone, isValidCCCD };
