
const User = require('../models/User');

class UserController {

    // POST /admin/users/:id/toggle-lock
    async toggleLock(req, res, next) {
        try {

            const userId = req.params.id;

            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).send('Không tìm thấy người dùng.');
            }

            if (user.role === 'admin') {
                return res.status(403).send('Không thể khóa tài khoản Admin.');
            }

            const currentAdminId = String(
                req.user?._id || req.user?.id || ''
            );

            if (String(user._id) === currentAdminId) {
                return res.status(403).send('Không thể tự khóa tài khoản.');
            }

            if (user.status === 'locked') {
                user.status = 'active';
            } else {
                user.status = 'locked';
            }


            await user.save();

            let search = '';

            if (typeof req.body.search === 'string') {
                search = req.body.search.trim();
            }

            let page = parseInt(req.body.page, 10) || 1;

            if (page < 1) {
                page = 1;
            }

            return res.redirect(
                `/admin/dashboard?page=${page}&search=${encodeURIComponent(search)}`
            );

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
