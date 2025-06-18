// dichvu.route.js - routes for dichvu
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dichvu.controller');

router.get('/', ctrl.getAllDichVu);
router.post('/', ctrl.createDichVu);
router.put('/:id', ctrl.updateDichVu);
router.delete('/:id', ctrl.deleteDichVu);

module.exports = router;
