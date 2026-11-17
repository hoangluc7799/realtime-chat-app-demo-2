
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (error) => {
    console.error('Redis Error:', error.message);
});

redisClient.on('connect', () => {
    console.log('Redis connecting...');
});

redisClient.on('ready', () => {
    console.log('Redis connected successfully');
});

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    return redisClient;
}

module.exports = {
    redisClient,
    connectRedis
};
