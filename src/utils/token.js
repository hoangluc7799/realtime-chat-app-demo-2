const jwt = require('jsonwebtoken');

// Tajo token cho JWT
function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        }
    );
}

function verifyToken(token) {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
}

module.exports = {
    generateToken,
    verifyToken
};