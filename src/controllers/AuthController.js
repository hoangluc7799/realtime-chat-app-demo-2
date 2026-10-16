
const AuthService = require("../services/AuthService");

async function register(req, res, next) {
    try {
        const { username, email, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập username, email và password"
            });
        }

        const user = await AuthService.register({
            username,
            email,
            password
        });

        return res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            data: { user }
        });
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và password"
            });
        }

        const result = await AuthService.login({ email, password });

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function getMe(req, res, next) {
    try {
        const user = await AuthService.getMe(req.user.id);

        return res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    getMe
};
