// phong.route.js - routes for phong
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phong.controller');

router.get('/', ctrl.getAllPhong);
router.get('/:id', ctrl.getPhongById);
router.post('/', ctrl.createPhong);
router.put('/:id', ctrl.updatePhong);
router.delete('/:id', ctrl.deletePhong);
router.put('/:id/checkin', ctrl.checkInPhong);
router.put('/:id/checkout', ctrl.checkOutPhong);
module.exports = router;
