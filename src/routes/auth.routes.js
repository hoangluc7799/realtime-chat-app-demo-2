
const express = require("express");
const AuthController = require("../controllers/AuthController");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/me", protect, AuthController.getMe);

module.exports = router;
