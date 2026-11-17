
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const profileController = require('../controllers/ProfileController');

// Tất cả route bên dưới đều yêu cầu đăng nhập
router.use(authMiddleware);

// Xem Profile
router.get('/', profileController.showProfile);

// Cập nhật thông tin
router.post('/update', profileController.updateProfile);

// Đổi mật khẩu
router.post('/change-password', profileController.changePassword);

module.exports = router;
