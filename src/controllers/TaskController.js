
const Task = require('../models/Task');
const { redisClient } = require('../config/redis');


// Tạo key Redis riêng cho từng người dùng
function getTaskCacheKey(userId) {
    return 'tasks:' + userId;
}

// Xóa cache Redis khi dữ liệu Task thay đổi
async function clearTaskCache(userId) {
    // Kiểm tra Redis có hoạt động không
    if (!redisClient.isReady) {
        return;
    }
    try {
        // Xóa cache của người dùng
        const cacheKey = getTaskCacheKey(userId);
        await redisClient.del(cacheKey);
        console.log('Redis: CACHE CLEARED');
    } catch (error) {

        console.log('Redis DEL error:', error.message);
    }
}

async function showCreateTask(req, res) {

    res.render('../views/user/tasks/create.handlebars', {
        layout: 'user',
        user: req.user
    });

}

async function create(req, res, next) {

    try {

        const title = req.body.title;
        const description = req.body.description;
        const priority = req.body.priority;
        const dueDate = req.body.dueDate;

        await Task.create({
            title: title,
            description: description,
            priority: priority || 'medium',
            dueDate: dueDate || null,
            userId: req.user._id

        });

        //Xóa cache cũ
        await clearTaskCache(req.user._id);

        return res.redirect('/home');

    } catch (error) {
        next(error);
    }

}

async function edit(req, res, next) {

    try {

       
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).lean();

        if (!task) {
            return res.status(404).send('Không tìm thấy Task');
        }


        task.isPending = task.status === 'pending';
        task.isInProgress = task.status === 'in_progress';
        task.isCompleted = task.status === 'completed';


        task.isLow = task.priority === 'low';
        task.isMedium = task.priority === 'medium';
        task.isHigh = task.priority === 'high';

        //Định dạng ngày cho input type="date"
        if (task.dueDate) {
            task.dueDateInput = new Date(task.dueDate)
                .toISOString()
                .slice(0, 10);

        } else {
            task.dueDateInput = '';

        }

        return res.render('user/tasks/edit', {
            layout: 'user',
            user: req.user,
            task: task
        });

    } catch (error) {
        next(error);
    }

}

async function update(req, res, next) {
    try {

        const title = req.body.title;
        const description = req.body.description;
        const status = req.body.status;
        const priority = req.body.priority;
        const dueDate = req.body.dueDate;
    
        const task = await Task.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

 
        if (!task) {
            return res.status(404).send('Không tìm thấy Task');
        }


        //Cập nhật thông tin Task
        task.title = title;
        task.description = description;
        task.status = status;
        task.priority = priority;
        task.dueDate = dueDate || null;

        // Cập nhật thời gian hoàn thành
        if (status === 'completed') {
            // Nếu chưa có thời gian hoàn thành thì tạo mới
            if (!task.completedAt) {
                task.completedAt = new Date();
            }

        } else {
            // Nếu chưa hoàn thành thì xóa thời gian hoàn thành
            task.completedAt = null;
        }

        await task.save();

        //Xóa cache cũ
        await clearTaskCache(req.user._id);

        return res.redirect('/home');

    } catch (error) {
        next(error);
    }

}


async function remove(req, res, next) {
    try {

        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!task) {
            return res.status(404).send('Không tìm thấy Task');
        }
      
        await clearTaskCache(req.user._id);
 
        return res.redirect('/home');

    } catch (error) {
        next(error);
    }

}


module.exports = {
    create,
    edit,
    update,
    remove,
    showCreateTask
};
