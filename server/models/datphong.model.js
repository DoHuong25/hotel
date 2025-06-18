// datphong.model.js - DB queries for datphong
// datphong.model.js - Model xử lý logic đặt phòng

function isValidNgay(nhan, tra) {
  return new Date(nhan) <= new Date(tra);
}

module.exports = { isValidNgay };
