
const MessageService = require("../services/MessageService");

async function getMessages(req, res, next) {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "page phải >= 1 và limit phải từ 1 đến 100"
            });
        }

        const result = await MessageService.getMessages(
            req.params.id,
            req.user.id,
            page,
            limit
        );

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

async function createMessage(req, res, next) {
    try {
        const { content } = req.body;

        if (typeof content !== "string") {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập nội dung tin nhắn"
            });
        }

        const message = await MessageService.createMessage(
            req.params.id,
            req.user.id,
            content
        );

        return res.status(201).json({
            success: true,
            message: "Gửi tin nhắn thành công",
            data: { message }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMessages,
    createMessage
};
