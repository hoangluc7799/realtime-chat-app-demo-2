const bcrypt = require('bcrypt');

const NUMBER = 10;

// Hash mk
async function hashPassword(password) {
    return bcrypt.hash(password, NUMBER);
}

// So sánh mk vs háh mk
async function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword
};