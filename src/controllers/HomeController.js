
const Task = require('../models/Task');
const { redisClient } = require('../config/redis');

// Redis 
const CACHE_TTL = 60;

// pagination
const LIMIT = 10;


//
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPageUrl(page, search, status, priority) {

    const params = new URLSearchParams();

    params.set('page', page);

    if (search) {
        params.set('search', search);
    }

    if (status) {
        params.set('status', status);
    }

    if (priority) {
        params.set('priority', priority);
    }

    return '/home?' + params.toString();
}


class HomeController {

    // GET /home
    async index(req, res, next) {

        try {


            const userId = req.user._id;
            //dulieu o tim kiếm
            let search = '';

            if (typeof req.query.search === 'string') {
                search = req.query.search.trim();
            }

            let status = '';

            if (typeof req.query.status === 'string') {
                status = req.query.status;
            }

            let priority = '';

            if (typeof req.query.priority === 'string') {
                priority = req.query.priority;
            }

            //Kiểm tra trạng thái
            const allowedStatuses = [
                'pending',
                'in_progress',
                'completed'
            ];

            if (!allowedStatuses.includes(status)) {
                status = '';
            }

            // Ktra độ ưu tiên
            const allowedPriorities = [
                'low',
                'medium',
                'high'
            ];

            if (!allowedPriorities.includes(priority)) {
                priority = '';
            }

            //Lấy số trang
            let page = parseInt(req.query.page, 10);

            if (isNaN(page) || page < 1) {
                page = 1;
            }

            // Khởi tạo danh sách công việc
            let tasks = [];

            // Tổng số công việc phù hợp tìm kiếm
            let totalFilteredTasks = 0;

            const filter = {
                userId: userId
            };

            // Tìm kiếm theo tiêu đề
            if (search) {

                filter.title = {
                    $regex: escapeRegex(search),
                    $options: 'i'
                };

            }

            // Lọc theo trạng thái
            if (status) {
                filter.status = status;
            }

            // Lọc theo độ ưu tiên
            if (priority) {
                filter.priority = priority;
            }

            // Kiểm tra người dùng có đang tìm kiếm hoặc lọc không
            let hasFilter = false;

            if (search || status || priority) {
                hasFilter = true;
            }

            if (hasFilter) {

                console.log('Lấy Task từ MongoDB (Search/Filter)');

                // Đếm số công việc phù hợp
                totalFilteredTasks = await Task.countDocuments(filter);

                // Tính tổng số trang
                let totalPages = Math.ceil(
                    totalFilteredTasks / LIMIT
                );

                // Kiểm tra số trang
                if (totalPages > 0 && page > totalPages) {
                    page = totalPages;
                }

                // Tính số công việc cần bỏ qua
                const skip = (page - 1) * LIMIT;

                // Lấy công việc từ MongoDB
                tasks = await Task.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(LIMIT)
                    .lean();

            }
            else {
                // Tạo tên cache riêng cho từng người dùng
                const cacheKey = 'tasks:' + userId;

                let cachedTasks = null;
                if (redisClient.isReady) {

                    try {
                        // Lấy dữ liệu từ Redis
                        cachedTasks = await redisClient.get(cacheKey);

                    } catch (error) {
                        console.log('Redis GET error:', error.message);

                    }
                }

                let allTasks = [];

                // Nếu Redis có dữ liệu
                if (cachedTasks) {

                    console.log('Lấy Task từ Redis');

                    allTasks = JSON.parse(cachedTasks);
                }

                else {

                    console.log('Lấy Task từ MongoDB');
                    allTasks = await Task.find({
                        userId: userId
                    })
                    .sort({ createdAt: -1 })
                    .lean();

                    // Lưu dữ liệu vào Redis
                    if (redisClient.isReady) {
                        try {
                            await redisClient.set(
                                cacheKey,
                                JSON.stringify(allTasks),
                                {
                                    EX: CACHE_TTL
                                }
                            );

                            console.log('Redis: CACHE SET');
                        } catch (error) {
                            console.log('Redis SET error:', error.message);
                        }
                    }
                }

                // Tổng số công việc
                totalFilteredTasks = allTasks.length;

                // Tổng số trang
                let totalPages = Math.ceil(
                    totalFilteredTasks / LIMIT
                );

                // Kiểm tra số trang
                if (totalPages > 0 && page > totalPages) {
                    page = totalPages;
                }

                // Tính vị trí bắt đầu
                const startIndex = (page - 1) * LIMIT;

                // Lấy 10 công việc của trang hiện tại
                tasks = allTasks.slice(
                    startIndex,
                    startIndex + LIMIT
                );

            }

            const totalPages = Math.ceil(
                totalFilteredTasks / LIMIT
            );

            const pages = [];

            for (let i = 1; i <= totalPages; i++) {

                pages.push({

                    number: i,

                    active: i === page,

                    url: buildPageUrl(
                        i,
                        search,
                        status,
                        priority
                    )

                });

            }

            const previousUrl = buildPageUrl(
                page - 1,
                search,
                status,
                priority
            );

            const nextUrl = buildPageUrl(
                page + 1,
                search,
                status,
                priority
            );

            const totalTasks = await Task.countDocuments({
                userId: userId
            });

            const pendingTasks = await Task.countDocuments({
                userId: userId,
                status: 'pending'
            });

            const inProgressTasks = await Task.countDocuments({
                userId: userId,
                status: 'in_progress'
            });

            const completedTasks = await Task.countDocuments({
                userId: userId,
                status: 'completed'
            });

            return res.render('user/tasks/index', {

                layout: 'user',

                user: req.user,

                tasks: tasks,

                // Tìm kiếm và lọc
                search: search,
                status: status,
                priority: priority,

                statusPending: status === 'pending',
                statusInProgress: status === 'in_progress',
                statusCompleted: status === 'completed',

                priorityLow: priority === 'low',
                priorityMedium: priority === 'medium',
                priorityHigh: priority === 'high',

                hasFilter: hasFilter,

                // Phân trang
                currentPage: page,
                totalPages: totalPages,
                totalFilteredTasks: totalFilteredTasks,
                pages: pages,

                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,

                previousUrl: previousUrl,
                nextUrl: nextUrl,

                // Thống kê
                totalTasks: totalTasks,
                pendingTasks: pendingTasks,
                inProgressTasks: inProgressTasks,
                completedTasks: completedTasks

            });

        } catch (error) {

            next(error);

        }

    }

}

module.exports = new HomeController();
