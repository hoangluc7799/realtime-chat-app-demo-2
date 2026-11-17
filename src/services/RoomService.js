
const mongoose = require("mongoose");
const Room = require("../models/Room");
const AppError = require("../utils/AppError");

async function createRoom({ name, description }, userId) {
    name = name.trim();
    description = (description || "").trim();

    if (name.length < 2 || name.length > 50) {
        throw new AppError("Tên phòng phải dài từ 2 đến 50 ký tự", 400);
    }

    if (description.length > 200) {
        throw new AppError("Mô tả phòng không được quá 200 ký tự", 400);
    }

    const room = await Room.create({
        name,
        description,
        createdBy: userId,
        members: [userId]
    });

    return room;
}

async function getRooms(userId) {
    return Room.find({
        members: userId
    })
        .select("name description createdBy members createdAt")
        .populate("createdBy", "username")
        .sort({ createdAt: -1 });
}

async function getRoomById(roomId, userId) {
    if (!mongoose.isValidObjectId(roomId)) {
        throw new AppError("ID phòng không hợp lệ", 400);
    }

    const room = await Room.findOne({
        _id: roomId,
        members: userId
    }).populate("createdBy", "username");

    if (!room) {
        throw new AppError("Không tìm thấy phòng hoặc bạn không có quyền truy cập", 404);
    }

    return room;
}

async function joinRoom(roomId, userId) {
    if (!mongoose.isValidObjectId(roomId)) {
        throw new AppError("ID phòng không hợp lệ", 400);
    }

    const room = await Room.findById(roomId);

    if (!room) {
        throw new AppError("Không tìm thấy phòng", 404);
    }

    const alreadyMember = room.members.some(
        (memberId) => memberId.toString() === userId
    );

    if (!alreadyMember) {
        room.members.push(userId);
        await room.save();
    }

    return room;
}

module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    joinRoom
};
