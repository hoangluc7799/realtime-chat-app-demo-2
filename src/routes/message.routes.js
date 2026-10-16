
const express = require("express");
const MessageController = require("../controllers/MessageController");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

module.exports = router;
