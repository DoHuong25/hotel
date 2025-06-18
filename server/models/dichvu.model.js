// dichvu.model.js - DB queries for dichvu
// dichvu.model.js - Model xử lý logic dịch vụ

function isValidTenDichVu(ten) {
  return ['Spa', 'Laundry', 'Food', 'Drink', 'Internet', 'Gym'].includes(ten);
}

module.exports = { isValidTenDichVu };
