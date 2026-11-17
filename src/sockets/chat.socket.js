
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Room = require("../models/Room");
const MessageService = require("../services/MessageService");

function registerChatSocket(io) {
    // Xác thực JWT trước khi cho socket kết nối
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("UNAUTHORIZED"));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            if (!mongoose.isValidObjectId(decoded.sub)) {
                return next(new Error("UNAUTHORIZED"));
            }

            const user = await User.findById(decoded.sub)
                .select("_id username status");

            if (!user || user.status !== "active") {
                return next(new Error("UNAUTHORIZED"));
            }

            socket.user = {
                id: user._id.toString(),
                username: user.username
            };

            next();
        } catch (error) {
            next(new Error("UNAUTHORIZED"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`${socket.user.username} connected: ${socket.id}`);

        // Lưu những phòng mà socket đã tham gia
        const joinedRooms = new Set();

        socket.on("room:join", async (data, ack) => {
            const reply = typeof ack === "function" ? ack : () => {};

            try {
                const roomId = data?.roomId;

                if (!mongoose.isValidObjectId(roomId)) {
                    return reply({
                        success: false,
                        message: "ID phòng không hợp lệ"
                    });
                }

                const room = await Room.findOne({
                    _id: roomId,
                    members: socket.user.id
                }).select("_id name");

                if (!room) {
                    return reply({
                        success: false,
                        message: "Bạn không có quyền tham gia phòng này"
                    });
                }

                const socketRoom = room._id.toString();

                // Không phát thông báo tham gia trùng lặp
                if (joinedRooms.has(socketRoom)) {
                    return reply({
                        success: true,
                        message: "Bạn đã ở trong phòng này"
                    });
                }

                await socket.join(socketRoom);
                joinedRooms.add(socketRoom);

                // Chỉ các socket khác trong đúng phòng nhận thông báo
                socket.to(socketRoom).emit("room:update", {
                    message: `${socket.user.username} đã tham gia phòng`
                });

                reply({
                    success: true,
                    room: {
                        id: socketRoom,
                        name: room.name
                    }
                });
            } catch (error) {
                console.error("room:join error:", error.message);

                reply({
                    success: false,
                    message: "Không thể tham gia phòng"
                });
            }
        });

        socket.on("message:send", async (data, ack) => {
            const reply = typeof ack === "function" ? ack : () => {};

            try {
                const roomId = data?.roomId;
                const content = data?.content;

                if (!mongoose.isValidObjectId(roomId)) {
                    return reply({
                        success: false,
                        message: "ID phòng không hợp lệ"
                    });
                }

                const socketRoom = roomId.toString();

                // Không cho gửi nếu socket chưa tham gia phòng
                if (!joinedRooms.has(socketRoom)) {
                    return reply({
                        success: false,
                        message: "Bạn chưa tham gia phòng"
                    });
                }

                // Service kiểm tra membership lần nữa và lưu DB
                const message = await MessageService.createMessage(
                    socketRoom,
                    socket.user.id,
                    content
                );

                const payload = {
                    id: message._id.toString(),
                    roomId: socketRoom,
                    sender: {
                        id: socket.user.id,
                        username: socket.user.username
                    },
                    content: message.content,
                    createdAt: message.createdAt
                };

                // Chỉ phát cho thành viên trong phòng đó, gồm cả người gửi
                io.to(socketRoom).emit("message:new", payload);

                reply({
                    success: true,
                    message: payload
                });
            } catch (error) {
                console.error("message:send error:", error.message);

                reply({
                    success: false,
                    message: error.message || "Không thể gửi tin nhắn"
                });
            }
        });

        socket.on("room:leave", async (data, ack) => {
            const reply = typeof ack === "function" ? ack : () => {};
            const roomId = data?.roomId;

            if (
                typeof roomId !== "string" ||
                !joinedRooms.has(roomId)
            ) {
                return reply({
                    success: false,
                    message: "Bạn chưa tham gia phòng này"
                });
            }

            await socket.leave(roomId);
            joinedRooms.delete(roomId);

            socket.to(roomId).emit("room:update", {
                message: `${socket.user.username} đã rời phòng`
            });

            reply({
                success: true,
                message: "Đã rời phòng"
            });
        });

        socket.on("disconnecting", () => {
            // Socket.IO chưa rời các phòng ở thời điểm này
            for (const roomId of joinedRooms) {
                socket.to(roomId).emit("room:update", {
                    message: `${socket.user.username} đã ngắt kết nối`
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`${socket.user.username} disconnected: ${socket.id}`);
        });
    });
}

module.exports = registerChatSocket;
