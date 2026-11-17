
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Vui lòng đăng nhập", 401);
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new AppError("Token không hợp lệ", 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.sub
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 401));
        }

        return next(error);
    }
}

module.exports = { protect };
