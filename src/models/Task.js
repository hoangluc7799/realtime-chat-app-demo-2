// Part 3: Task schema (title, description, status, dueDate, userId).

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            trim: true,
            default: ''
        },

        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
            default: 'pending'
        },

        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },

        dueDate: {
            type: Date,
            default: null
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Tối ưu truy vấn Task theo User và thời gian tạo
taskSchema.index({
    userId: 1,
    createdAt: -1
});

// Tối ưu truy vấn theo trạng thái
taskSchema.index({
    userId: 1,
    status: 1
});

module.exports = mongoose.model('Task', taskSchema);
