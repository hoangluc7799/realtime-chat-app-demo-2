
const RoomService = require("../services/RoomService");

async function createRoom(req, res, next) {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập tên phòng"
            });
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Mô tả phòng không hợp lệ"
            });
        }

        const room = await RoomService.createRoom(
            { name, description },
            req.user.id
        );

        return res.status(201).json({
            success: true,
            message: "Tạo phòng thành công",
            data: { room }
        });
    } catch (error) {
        next(error);
    }
}

async function getRooms(req, res, next) {
    try {
        const rooms = await RoomService.getRooms(req.user.id);

        return res.status(200).json({
            success: true,
            results: rooms.length,
            data: { rooms }
        });
    } catch (error) {
        next(error);
    }
}

async function getRoomById(req, res, next) {
    try {
        const room = await RoomService.getRoomById(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: { room }
        });
    } catch (error) {
        next(error);
    }
}

async function joinRoom(req, res, next) {
    try {
        const room = await RoomService.joinRoom(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Tham gia phòng thành công",
            data: { room }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    joinRoom
};
