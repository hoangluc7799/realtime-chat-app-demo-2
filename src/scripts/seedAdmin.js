require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

async function seedAdmin() {
    try {
        await connectDB();

        const username = process.env.ADMIN_USERNAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!username || !email || !password) {
            throw new Error('Thiếu thông tin');
        }

        if (password.length < 6) {
            throw new Error('Password phải có ít nhất 6 ký tự');
        }

        //tim tai khoản trùng
        const existingAdmin = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (existingAdmin) {
            console.log('Tài khoản này đã tồn tại. Không tạo Admin mới.');
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Tạo Admin
        const admin = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName: 'Administrator',
            role: 'admin',
            status: 'active'
        });

        console.log('Tạo Admin thành công!');
        console.log('Username:', admin.username);
        console.log('Email:', admin.email);

    } catch (error) {
        console.error('Seed Admin Error:', error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();