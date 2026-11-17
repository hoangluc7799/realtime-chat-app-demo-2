
const express = require("express");
const RoomController = require("../controllers/RoomController");
const MessageController = require("../controllers/MessageController");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/", RoomController.createRoom);
router.get("/", RoomController.getRooms);
router.get("/:id", RoomController.getRoomById);
router.post("/:id/join", RoomController.joinRoom);

router.get("/:id/messages", MessageController.getMessages);
router.post("/:id/messages", MessageController.createMessage);

module.exports = router;
