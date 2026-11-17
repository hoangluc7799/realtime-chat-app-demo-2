
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/AdminController');
const userController = require('../controllers/UserController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Phải đăng nhập
router.use(authMiddleware);

// Phải có role admin
router.use(adminMiddleware);

// GET /admin/test
router.get('/test', (req, res) => {
    res.send('ADMIN ROUTER HOẠT ĐỘNG');
});

// GET /admin/dashboard
router.get('/dashboard', adminController.dashboard);

// POST /admin/users/:id/toggle-lock
router.post('/users/:id/toggle-lock', userController.toggleLock);

module.exports = router;
