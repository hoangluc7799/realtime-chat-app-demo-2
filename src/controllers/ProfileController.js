
const User = require('../models/User');

const {
    hashPassword,
    comparePassword
} = require('../utils/password');

// Xác định request từ Postman/API hay HTML form
function isApiRequest(req) {
    return req.is('application/json') ||
        req.get('accept')?.includes('application/json');
}

function showProfile(req, res) {
    res.render('user/profile/index', {
        title: 'Thông tin cá nhân',
        layout: 'user',
        user: req.user
    });
}

// Cập nhật thông tin cá nhân
async function updateProfile(req, res, next) {
    try {
        const { username, email, fullName } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username và email không được để trống'
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanFullName = (fullName || '').trim();

        if (cleanUsername.length < 3 || cleanUsername.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Username phải dài từ 3 đến 30 ký tự'
            });
        }

        // Kiểm tra email 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Kiểm tra username/email đã thuộc tài khoản khác chưa
        const existingUser = await User.findOne({
            _id: { $ne: req.user._id },
            $or: [
                { username: cleanUsername },
                { email: cleanEmail }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username hoặc email đã được sử dụng'
            });
        }

        // Cập nhật thông tin
        req.user.username = cleanUsername;
        req.user.email = cleanEmail;
        req.user.fullName = cleanFullName;

        await req.user.save();

        if (isApiRequest(req)) {
            return res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    fullName: req.user.fullName,
                    role: req.user.role
                }
            });
        }

        return res.redirect('/profile');

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username hoặc email đã được sử dụng'
            });
        }

        next(error);
    }
}

// Đổi mật khẩu
async function changePassword(req, res, next) {
    try {
        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ thông tin'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu xác nhận không khớp'
            });
        }

        const user = await User.findById(req.user._id)
            .select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản'
            });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await comparePassword(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        const isSamePassword = await comparePassword(
            newPassword,
            user.password
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
            });
        }

        // Hash mật khẩu mới
        user.password = await hashPassword(newPassword);

        await user.save();

        // Xóa cookie để yêu cầu đăng nhập lại
        res.clearCookie(
            process.env.COOKIE_NAME || 'todo_token',
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            }
        );

        if (isApiRequest(req)) {
            return res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'
            });
        }

        return res.redirect('/login');

    } catch (error) {
        next(error);
    }
}

module.exports = {
    showProfile,
    updateProfile,
    changePassword
};
