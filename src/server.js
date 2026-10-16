
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/database");
const registerChatSocket = require("./sockets/chat.socket");

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server);

    registerChatSocket(io);

    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
