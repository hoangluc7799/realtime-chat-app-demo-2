
const express = require('express');
const router = express.Router();

const homeController = require('../controllers/HomeController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả route trong router này đều yêu cầu đăng nhập
router.use(authMiddleware);

// GET /home
router.get('/', homeController.index);

module.exports = router;
