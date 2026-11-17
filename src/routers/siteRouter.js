const express = require('express');
const mongoose = require('mongoose');

const { redisClient } = require('../config/redis');

const router = express.Router();

// Trang User
router.get('/', (req, res) => {

    res.render('user/tasks/index', {
        title: 'Todo App',
        layout: 'user'
    });

});

// Trang Admin
router.get('/admin-preview', (req, res) => {

    res.render('admin/dashboard/index', {
        title: 'Dashboard',
        layout: 'admin'
    });

});

// Kiểm tra server, MongoDB và Redis
router.get('/health', async (req, res) => {

    let redisStatus = 'disconnected';

    try {
        if (redisClient.isReady) {
            await redisClient.ping();
            redisStatus = 'connected';
        }
    } catch (error) {
        redisStatus = 'disconnected';
    }

    const mongoStatus =
        mongoose.connection.readyState === 1
            ? 'connected'
            : 'disconnected';

    const success =
        mongoStatus === 'connected' &&
        redisStatus === 'connected';

    res.status(success ? 200 : 503).json({

        success,

        server: 'running',

        mongodb: mongoStatus,

        redis: redisStatus

    });

});

module.exports = router;