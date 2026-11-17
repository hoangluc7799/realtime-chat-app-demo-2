const User = require('../models/User');
const { verifyToken } = require('../utils/token');

async function authMiddleware(req, res, next) {
    try {
        // Lấy token từ cookie
        let token = req.cookies?.[process.env.COOKIE_NAME || 'todo_token'];

        // Nếu không có cookie thì thử lấy từ Authorization header
        if (!token) {
            const authHeader = req.headers.authorization;

            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        // Không tìm thấy token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        // Xác thực chữ ký và thời hạn JWT
        const decoded = verifyToken(token);

        // Lấy user mới nhất từ MongoDB
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        // Kiểm tra tài khoản có bị khóa không
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // Gắn thông tin user vào request
        req.user = user;

        next();

    } catch (error) {
        if (
            error.name === 'TokenExpiredError' ||
            error.name === 'JsonWebTokenError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        next(error);
    }
}

module.exports = authMiddleware;