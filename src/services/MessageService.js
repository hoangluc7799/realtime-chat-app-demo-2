
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Room = require("../models/Room");
const AppError = require("../utils/AppError");

async function checkRoomMembership(roomId, userId) {
    if (!mongoose.isValidObjectId(roomId)) {
        throw new AppError("ID phòng không hợp lệ", 400);
    }

    const room = await Room.findOne({
        _id: roomId,
        members: userId
    }).select("_id");

    if (!room) {
        throw new AppError(
            "Không tìm thấy phòng hoặc bạn không có quyền truy cập",
            404
        );
    }

    return room;
}

async function getMessages(roomId, userId, page = 1, limit = 20) {
    await checkRoomMembership(roomId, userId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        Message.find({ room: roomId })
            .populate("sender", "username")
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit),

        Message.countDocuments({ room: roomId })
    ]);

    return {
        messages: messages.reverse(),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function createMessage(roomId, userId, content) {
    await checkRoomMembership(roomId, userId);

    if (typeof content !== "string") {
        throw new AppError("Nội dung tin nhắn không hợp lệ", 400);
    }

    content = content.trim();

    if (!content) {
        throw new AppError("Tin nhắn không được để trống", 400);
    }

    if (content.length > 2000) {
        throw new AppError("Tin nhắn không được quá 2000 ký tự", 400);
    }

    const message = await Message.create({
        room: roomId,
        sender: userId,
        content
    });

    return Message.findById(message._id)
        .populate("sender", "username");
}

module.exports = {
    getMessages,
    createMessage
};
