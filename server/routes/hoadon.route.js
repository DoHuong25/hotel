// hoadon.route.js - routes for hoadon
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hoadon.controller');

router.get('/', ctrl.getAllHoaDon);
router.post('/', ctrl.createHoaDon);

module.exports = router;
