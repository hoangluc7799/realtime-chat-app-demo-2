
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");

async function register({ username, email, password }) {
    username = username.trim();
    email = email.trim().toLowerCase();

    if (username.length < 3 || username.length > 30) {
        throw new AppError("Username phải dài từ 3 đến 30 ký tự", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError("Email không hợp lệ", 400);
    }

    if (password.length < 8 || password.length > 72) {
        throw new AppError("Password phải dài từ 8 đến 72 ký tự", 400);
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new AppError("Username hoặc email đã tồn tại", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    return {
        id: user._id,
        username: user.username,
        email: user.email
    };
}

async function login({ email, password }) {
    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
        throw new AppError("Email hoặc password không chính xác", 401);
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new AppError("Email hoặc password không chính xác", 401);
    }

    if (user.status !== "active") {
        throw new AppError("Tài khoản đã bị khóa", 403);
    }

    const token = jwt.sign(
        { sub: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return {
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    };
}

async function getMe(userId) {
    const user = await User.findById(userId).select(
        "_id username email status createdAt"
    );

    if (!user) {
        throw new AppError("Không tìm thấy tài khoản", 404);
    }

    if (user.status !== "active") {
        throw new AppError("Tài khoản đã bị khóa", 403);
    }

    return user;
}

module.exports = {
    register,
    login,
    getMe
};
