
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false
        },

        fullName: {
            type: String,
            trim: true,
            default: ''
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },

        status: {
            type: String,
            enum: ['active', 'locked'],
            default: 'active'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
