
const User = require('../models/User');

const {
    hashPassword,
    comparePassword
} = require('../utils/password');

const {
    generateToken
} = require('../utils/token');


// Kiểm tra request đến từ API hay form HTML
function isApiRequest(req) {
    if (req.is('application/json')) {
        return true;
    }

    if (req.get('accept')?.includes('application/json')) {
        return true;
    }

    return false;
}


// Cấu hình Cookie
function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    };
}

// GET /user/register
function showRegister(req, res) {
    res.render('../views/user/auth/register.handlebars', {
        title: 'Đăng ký tài khoản',
        layout: 'user',
        hideHeader: true
    });
}

// POST /user/register
async function register(req, res, next) {
    try {

        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        if (!username || !email || !password) {

            const message = 'Vui lòng nhập đầy đủ thông tin';

            if (isApiRequest(req)) {
                return res.status(400).json({
                    success: false,
                    message: message
                });
            }

            return res.status(400).render(
                '../views/user/auth/register.handlebars',
                {
                    title: 'Đăng ký tài khoản',
                    layout: 'user',
                    error: message
                }
            );
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanUsername.length < 3 || cleanUsername.length > 30) {

            const message = 'Username phải dài từ 3 đến 30 ký tự';

            if (isApiRequest(req)) {
                return res.status(400).json({
                    success: false,
                    message: message
                });
            }

            return res.status(400).render(
                '../views/user/auth/register.handlebars',
                {
                    title: 'Đăng ký tài khoản',
                    layout: 'user',
                    error: message
                }
            );
        }

        if (password.length < 6) {

            const message = 'Password phải có ít nhất 6 ký tự';

            if (isApiRequest(req)) {
                return res.status(400).json({
                    success: false,
                    message: message
                });
            }

            return res.status(400).render(
                '../views/user/auth/register.handlebars',
                {
                    title: 'Đăng ký tài khoản',
                    layout: 'user',
                    error: message
                }
            );
        }

        // Kiểm tra username hoặc email đã tồn tại chưa
        const existingUser = await User.findOne({
            $or: [
                { username: cleanUsername },
                { email: cleanEmail }
            ]
        });

        if (existingUser) {

            const message = 'Username hoặc email đã tồn tại';

            if (isApiRequest(req)) {
                return res.status(409).json({
                    success: false,
                    message: message
                });
            }

            return res.status(409).render(
                '../views/user/auth/register.handlebars',
                {
                    title: 'Đăng ký tài khoản',
                    layout: 'user',
                    error: message
                }
            );
        }

        // Mã hóa mật khẩu
        const hashedPassword = await hashPassword(password);

        // Tạo tài khoản mới trong MongoDB
        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword
        });

        // Trả kết quả cho API
        if (isApiRequest(req)) {
            return res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
        return res.redirect('/user/login?registered=true');

    } catch (error) {

        // Kiểm tra lỗi trùng dữ liệu trong MongoDB
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Username hoặc email đã tồn tại'
            });
        }

        next(error);
    }
}


// GET /user/login
function showLogin(req, res) {
    res.render('../views/user/auth/login.handlebars', {
        title: 'Đăng nhập',
        layout: 'user',
        registered: req.query.registered === 'true',
        hideHeader: true
    });
}


// POST /user/login
async function login(req, res, next) {
    try {

        const identifier = req.body.identifier;
        const password = req.body.password;

        if (!identifier || !password) {

            const message = 'Vui lòng nhập tài khoản và mật khẩu';

            if (isApiRequest(req)) {
                return res.status(400).json({
                    success: false,
                    message: message
                });
            }

            return res.status(400).render(
                '../views/user/auth/login.handlebars',
                {
                    title: 'Đăng nhập',
                    layout: 'user',
                    error: message
                }
            );
        }

        const cleanIdentifier = identifier.trim();
        const user = await User.findOne({
            $or: [
                { username: cleanIdentifier },
                { email: cleanIdentifier.toLowerCase() }
            ]
        }).select('+password');

        if (!user) {

            const message = 'Tài khoản hoặc mật khẩu không chính xác';

            if (isApiRequest(req)) {
                return res.status(401).json({
                    success: false,
                    message: message
                });
            }

            return res.status(401).render(
                '../views/user/auth/login.handlebars',
                {
                    title: 'Đăng nhập',
                    layout: 'user',
                    error: message
                }
            );
        }

        //Kiểm tra tài khoản có bị khóa không
        if (user.status !== 'active') {

            const message = 'Tài khoản đã bị khóa';

            if (isApiRequest(req)) {
                return res.status(403).json({
                    success: false,
                    message: message
                });
            }

            return res.status(403).render(
                '../views/user/auth/login.handlebars',
                {
                    title: 'Đăng nhập',
                    layout: 'user',
                    error: message
                }
            );
        }

        //So sánh mật khẩu nhập vào với mật khẩu đã mã hóa
        const isMatch = await comparePassword(
            password,
            user.password
        );

        if (!isMatch) {

            const message = 'Tài khoản hoặc mật khẩu không chính xác';

            if (isApiRequest(req)) {
                return res.status(401).json({
                    success: false,
                    message: message
                });
            }

            return res.status(401).render(
                '../views/user/auth/login.handlebars',
                {
                    title: 'Đăng nhập',
                    layout: 'user',
                    error: message
                }
            );
        }

        //Tạo JWT
        const token = generateToken(user);

        //Lưu JWT vào Cookie
        res.cookie(
            process.env.COOKIE_NAME || 'todo_token',
            token,
            getCookieOptions()
        );

        //Nếu là API thì trả JSON
        if (isApiRequest(req)) {
            return res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }

        
        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard');
        }

        return res.redirect('/home');

    } catch (error) {
        next(error);
    }
}


// POST /user/logout
function logout(req, res) {

    // Xóa Cookie chứa JWT
    res.clearCookie(
        process.env.COOKIE_NAME || 'todo_token',
        getCookieOptions()
    );
    //API trả Json
    if (isApiRequest(req)) {
        return res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    }

//form trả giao diện
    return res.redirect('/user/login');
}

module.exports = {
    showRegister,
    register,
    showLogin,
    login,
    logout
};
