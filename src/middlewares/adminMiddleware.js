function adminMiddleware(req, res, next) {
    // Phải chạy authMiddleware trước
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập'
        });
    }

    // Chỉ tài khoản admin được truy cập
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập'
        });
    }

    next();
}

module.exports = adminMiddleware;