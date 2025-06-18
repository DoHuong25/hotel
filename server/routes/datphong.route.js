// datphong.route.js - routes for datphong

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/datphong.controller');

router.post('/', ctrl.datPhong);

module.exports = router;
