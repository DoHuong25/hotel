const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hoadon.controller');

router.get('/', ctrl.getAllHoaDon); 
router.get('/:id', ctrl.getHoaDonById); 
router.post('/', ctrl.createHoaDon); 
router.put('/:id', ctrl.updateHoaDon); 
router.delete('/:id', ctrl.deleteHoaDon); 

module.exports = router;
