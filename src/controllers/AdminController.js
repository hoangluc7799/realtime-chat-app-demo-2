
const User = require('../models/User');
const Task = require('../models/Task');

// Mỗi trang hiển thị 10 người dùng
const LIMIT = 10;

class AdminController {

    // GET /admin/dashboard
    async dashboard(req, res, next) {
        try {

            //Lấy từ khóa tìm kiếm
            const search = req.query.search || '';

            //Lấy số trang hiện tại
            let currentPage = parseInt(req.query.page) || 1;

            // Không cho số trang nhỏ hơn 1
            if (currentPage < 1) {
                currentPage = 1;
            }

            // Tạo điều kiện tìm kiếm
            const filter = {};

            if (search.trim() !== '') {
                filter.$or = [
                    {
                        username: {
                            $regex: search.trim(),
                            $options: 'i'
                        }
                    },
                    {
                        email: {
                            $regex: search.trim(),
                            $options: 'i'
                        }
                    }
                ];
            }

            //Lấy dữ liệu thống kê
            const totalUsers = await User.countDocuments();

            const totalTasks = await Task.countDocuments();

            const activeUsers = await User.countDocuments({
                status: 'active'
            });

            const lockedUsers = await User.countDocuments({
                status: 'locked'
            });

            //Đếm số người dùng sau khi tìm kiếm
            const filteredUsersCount = await User.countDocuments(filter);

            // Tính tổng số trang
            let totalPages = Math.ceil(filteredUsersCount / LIMIT);

            if (totalPages < 1) {
                totalPages = 1;
            }

            
            if (currentPage > totalPages) {
                currentPage = totalPages;
            }

            // Tính số lượng bản ghi cần bỏ qua
            const skip = (currentPage - 1) * LIMIT;

            // Lấy danh sách người dùng
            const userList = await User.find(filter)
                .select('username email role status createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(LIMIT)
                .lean();

            //Lấy ID của admin đang đăng nhập
            const currentAdminId = String(req.user._id);

            // Xử lý dữ liệu người dùng
            const users = userList.map(function(item) {

                
                const isLocked = item.status === 'locked';

                
                const isAdmin = item.role === 'admin';

                
                const isCurrentAdmin =
                    String(item._id) === currentAdminId;

                return {
                    ...item,
                    isLocked: isLocked,

                    canToggleLock: !isAdmin && !isCurrentAdmin
                };
            });

            //Tạo danh sách số trang
            const pages = [];

            for (let i = 1; i <= totalPages; i++) {
                pages.push({
                    number: i,
                    isCurrent: i === currentPage
                });
            }

            // Render giao diện
            res.render('admin/dashboard/index', {

                layout: 'admin',
                user: req.user,

                // Thống kê
                totalUsers: totalUsers,
                totalTasks: totalTasks,
                activeUsers: activeUsers,
                lockedUsers: lockedUsers,

                // Danh sách người dùng
                users: users,

                // Tìm kiếm
                search: search,

                // Phân trang
                currentPage: currentPage,
                totalPages: totalPages,
                filteredUsersCount: filteredUsersCount,
                pages: pages,

                hasPrevPage: currentPage > 1,
                hasNextPage: currentPage < totalPages,

                prevPage: currentPage - 1,
                nextPage: currentPage + 1
            });

        } catch (error) {
            next(error);
        }
    }

}

module.exports = new AdminController();
