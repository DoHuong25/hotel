// khachhang.route.js - routes for khachhang
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/khachhang.controller');

router.get('/', ctrl.getAllKhachHang);
router.get('/:id', ctrl.getKhachHangById);
router.post('/', ctrl.createKhachHang);
router.put('/:id', ctrl.updateKhachHang);
router.delete('/:id', ctrl.deleteKhachHang);

module.exports = router;
