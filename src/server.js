
require('dotenv').config();

const app = require('./app');

const connectDB = require('./config/db');

const {
    connectRedis,
    redisClient
} = require('./config/redis');
console.log('Redis module:', require('./config/redis'));
console.log('connectRedis type:', typeof connectRedis);

console.log('connectDB:', connectDB);
console.log('Type:', typeof connectDB);

const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('START SERVER FUNCTION');

    try {
        await connectDB();
        console.log('MONGODB CONNECTED');

        await connectRedis();
        console.log('REDIS CONNECTED');

        const server = app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

        async function shutdown() {
            console.log('Shutting down...');

            server.close(async () => {
                try {
                    if (redisClient.isOpen) {
                        await redisClient.quit();
                    }

                    const mongoose = require('mongoose');
                    await mongoose.disconnect();

                    process.exit(0);
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                }
            });
        }

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (error) {
        console.error('Application startup failed:', error);
        process.exit(1);
    }
}

startServer();