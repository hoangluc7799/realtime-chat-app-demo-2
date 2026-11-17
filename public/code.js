
const state = {
    token: localStorage.getItem("token"),
    user: null,
    socket: null,
    currentRoomId: null,
    currentRoom: null,
    renderedMessageIds: new Set()
};

// ================================
// 1. LẤY CÁC PHẦN TỬ HTML
// ================================

const authSection = document.getElementById("authSection");
const chatSection = document.getElementById("chatSection");

const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

const currentUsername = document.getElementById("currentUsername");
const logoutBtn = document.getElementById("logoutBtn");

const createRoomForm = document.getElementById("createRoomForm");
const joinRoomForm = document.getElementById("joinRoomForm");

const roomList = document.getElementById("roomList");
const roomMessage = document.getElementById("roomMessage");

const roomTitle = document.getElementById("roomTitle");
const roomDescriptionText = document.getElementById("roomDescriptionText");
const copyRoomIdBtn = document.getElementById("copyRoomIdBtn");

const connectionStatus = document.getElementById("connectionStatus");
const messageList = document.getElementById("messageList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");


// ================================
// 2. HÀM GỌI API
// ================================

async function api(url, options = {}) {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(state.token
            ? { Authorization: `Bearer ${state.token}` }
            : {}),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error("Server trả về dữ liệu không hợp lệ");
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.message || "Có lỗi xảy ra");
    }

    return result;
}


// ================================
// 3. HIỂN THỊ THÔNG BÁO
// ================================

function showNotice(element, message, type = "error") {
    element.textContent = message;
    element.className = `message ${type}`;
}

function clearNotice(element) {
    element.textContent = "";
    element.className = "message";
}

function showAuth() {
    authSection.classList.remove("hidden");
    chatSection.classList.add("hidden");
}

function showChat() {
    authSection.classList.add("hidden");
    chatSection.classList.remove("hidden");

    currentUsername.textContent = state.user.username;
}

function showEmptyState(title, description) {
    messageList.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "💬";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    wrapper.append(icon, heading, paragraph);
    messageList.appendChild(wrapper);
}


// ================================
// 4. CHUYỂN TAB ĐĂNG NHẬP / ĐĂNG KÝ
// ================================

function showLoginForm() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");

    clearNotice(authMessage);
}

function showRegisterForm() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    showRegisterBtn.classList.add("active");
    showLoginBtn.classList.remove("active");

    clearNotice(authMessage);
}

showLoginBtn.addEventListener("click", showLoginForm);
showRegisterBtn.addEventListener("click", showRegisterForm);


// ================================
// 5. ĐĂNG NHẬP
// ================================

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const button = loginForm.querySelector('button[type="submit"]');

    button.disabled = true;
    clearNotice(authMessage);

    try {
        const result = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        state.token = result.data.token;
        state.user = result.data.user;

        localStorage.setItem("token", state.token);

        showChat();
        connectSocket();
        await loadRooms();

        loginForm.reset();
    } catch (error) {
        showNotice(authMessage, error.message);
    } finally {
        button.disabled = false;
    }
});


// ================================
// 6. ĐĂNG KÝ
// ================================

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username =
        document.getElementById("registerUsername").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const button = registerForm.querySelector('button[type="submit"]');

    button.disabled = true;
    clearNotice(authMessage);

    try {
        // Bước 1: Tạo tài khoản
        await api("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ username, email, password })
        });

        // Bước 2: Đăng nhập bằng tài khoản vừa tạo
        const result = await api("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        state.token = result.data.token;
        state.user = result.data.user;

        localStorage.setItem("token", state.token);

        showChat();
        connectSocket();
        await loadRooms();

        registerForm.reset();
        showNotice(authMessage, "Đăng ký thành công!", "success");
    } catch (error) {
        showNotice(authMessage, error.message);
    } finally {
        button.disabled = false;
    }
});


// ================================
// 7. KẾT NỐI SOCKET.IO
// ================================

function connectSocket() {
    // Nếu đã có kết nối cũ thì ngắt trước
    if (state.socket) {
        state.socket.disconnect();
    }

    state.socket = io({
        auth: {
            token: state.token
        }
    });

    state.socket.on("connect", () => {
        connectionStatus.textContent = "Đã kết nối realtime";
        connectionStatus.className = "connection-status connected";

        // Kết nối lại sau khi mất mạng:
        // tham gia lại phòng đang mở.
        if (state.currentRoomId) {
            joinSocketRoom(state.currentRoomId)
                .catch((error) => console.error(error.message));
        }
    });

    state.socket.on("disconnect", () => {
        connectionStatus.textContent = "Mất kết nối realtime";
        connectionStatus.className = "connection-status disconnected";
    });

    state.socket.on("connect_error", (error) => {
        connectionStatus.textContent = "Không thể kết nối realtime";
        connectionStatus.className = "connection-status disconnected";

        console.error("Socket connection error:", error.message);
    });

    // Nhận tin nhắn realtime từ server
    state.socket.on("message:new", (message) => {
        if (message.roomId !== state.currentRoomId) {
            return;
        }

        renderMessage(message);
    });

    // Nhận thông báo khi thành viên vào hoặc rời phòng
    state.socket.on("room:update", (data) => {
        if (data?.message) {
            const notice = document.createElement("div");
            notice.className = "system-notice";
            notice.textContent = data.message;

            messageList.appendChild(notice);
            messageList.scrollTop = messageList.scrollHeight;
        }
    });
}


// ================================
// 8. THAM GIA PHÒNG BẰNG SOCKET
// ================================

function joinSocketRoom(roomId) {
    return new Promise((resolve, reject) => {
        if (!state.socket || !state.socket.connected) {
            reject(new Error("Chưa kết nối realtime"));
            return;
        }

        state.socket.emit("room:join", { roomId }, (result) => {
            if (!result?.success) {
                reject(
                    new Error(result?.message || "Không thể tham gia phòng")
                );
                return;
            }

            resolve(result);
        });
    });
}


// ================================
// 9. TẢI DANH SÁCH PHÒNG
// ================================

async function loadRooms() {
    try {
        const result = await api("/api/rooms");
        const rooms = result.data.rooms;

        roomList.replaceChildren();

        if (rooms.length === 0) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.textContent = "Bạn chưa tham gia phòng nào.";

            roomList.appendChild(empty);
            return;
        }

        rooms.forEach((room) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "room-item";

            if (String(room._id) === state.currentRoomId) {
                button.classList.add("active");
            }

            const name = document.createElement("span");
            name.className = "room-item-name";
            name.textContent = room.name;

            const description = document.createElement("span");
            description.className = "room-item-description";
            description.textContent =
                room.description || "Chưa có mô tả";

            button.append(name, description);

            button.addEventListener("click", () => {
                enterRoom(String(room._id));
            });

            roomList.appendChild(button);
        });
    } catch (error) {
        showNotice(roomMessage, error.message);
    }
}


// ================================
// 10. TẠO PHÒNG CHAT
// ================================

createRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("roomName").value.trim();

    const description =
        document.getElementById("roomDescription").value.trim();

    const button = createRoomForm.querySelector('button[type="submit"]');

    button.disabled = true;
    clearNotice(roomMessage);

    try {
        const result = await api("/api/rooms", {
            method: "POST",
            body: JSON.stringify({ name, description })
        });

        const room = result.data.room;

        createRoomForm.reset();

        await loadRooms();
        await enterRoom(String(room._id));

        showNotice(roomMessage, "Tạo phòng thành công!", "success");
    } catch (error) {
        showNotice(roomMessage, error.message);
    } finally {
        button.disabled = false;
    }
});


// ================================
// 11. THAM GIA PHÒNG BẰNG ID
// ================================

joinRoomForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const roomId = document.getElementById("joinRoomId").value.trim();

    const button = joinRoomForm.querySelector('button[type="submit"]');

    button.disabled = true;
    clearNotice(roomMessage);

    try {
        await api(`/api/rooms/${encodeURIComponent(roomId)}/join`, {
            method: "POST"
        });

        document.getElementById("joinRoomId").value = "";

        await loadRooms();
        await enterRoom(roomId);

        showNotice(roomMessage, "Tham gia phòng thành công!", "success");
    } catch (error) {
        showNotice(roomMessage, error.message);
    } finally {
        button.disabled = false;
    }
});


// ================================
// 12. MỞ PHÒNG CHAT
// ================================

async function enterRoom(roomId) {
    try {
        clearNotice(roomMessage);

        // Rời phòng socket trước đó
        if (
            state.currentRoomId &&
            state.currentRoomId !== roomId &&
            state.socket?.connected
        ) {
            const oldRoomId = state.currentRoomId;

            await new Promise((resolve) => {
                state.socket.emit(
                    "room:leave",
                    { roomId: oldRoomId },
                    () => resolve()
                );
            });
        }

        // Lấy thông tin phòng
        const result = await api(`/api/rooms/${encodeURIComponent(roomId)}`);
        const room = result.data.room;

        // Cập nhật giao diện
        state.currentRoomId = roomId;
        state.currentRoom = room;
        state.renderedMessageIds.clear();

        roomTitle.textContent = room.name;
        roomDescriptionText.textContent =
            room.description || "Không có mô tả";

        copyRoomIdBtn.classList.remove("hidden");

        messageInput.disabled = true;
        sendMessageBtn.disabled = true;

        showEmptyState("Đang tải tin nhắn...", "Vui lòng chờ một chút.");

        await loadRooms();

        // Tham gia phòng realtime
        if (state.socket?.connected) {
            await joinSocketRoom(roomId);
        }

        // Lấy lịch sử tin nhắn từ MongoDB
        const history = await api(
            `/api/rooms/${encodeURIComponent(roomId)}/messages?page=1&limit=50`
        );

        // Chỉ hiển thị kết quả nếu người dùng vẫn đang mở phòng này
        if (state.currentRoomId !== roomId) {
            return;
        }

        messageList.replaceChildren();
        state.renderedMessageIds.clear();

        history.data.messages.forEach((message) => {
            renderMessage(message);
        });

        if (history.data.messages.length === 0) {
            showEmptyState(
                "Chưa có tin nhắn",
                "Hãy gửi tin nhắn đầu tiên trong phòng này."
            );
        }

        messageInput.disabled = false;
        sendMessageBtn.disabled = false;
        messageInput.focus();
    } catch (error) {
        showNotice(roomMessage, error.message);

        messageInput.disabled = true;
        sendMessageBtn.disabled = true;
    }
}


// ================================
// 13. HIỂN THỊ MỘT TIN NHẮN
// ================================

function renderMessage(message) {
    const messageId = String(message.id || message._id || "");

    // Tránh hiển thị trùng khi lịch sử và Socket.IO cùng trả về một tin
    if (messageId && state.renderedMessageIds.has(messageId)) {
        return;
    }

    if (messageId) {
        state.renderedMessageIds.add(messageId);
    }

    // Xóa trạng thái trống khi có tin nhắn đầu tiên
    const emptyState = messageList.querySelector(".empty-state");

    if (emptyState) {
        messageList.replaceChildren();
    }

    const senderId = String(
        message.sender?.id || message.sender?._id || ""
    );

    const senderName = message.sender?.username || "Người dùng";

    const isMine = senderId === String(state.user?.id);

    const wrapper = document.createElement("div");
    wrapper.className = isMine
        ? "message-item mine"
        : "message-item";

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = isMine ? "Bạn" : senderName;

    const time = document.createElement("span");

    const date = new Date(message.createdAt);

    time.textContent = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });

    meta.append(sender, time);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = message.content;

    wrapper.append(meta, bubble);
    messageList.appendChild(wrapper);

    messageList.scrollTop = messageList.scrollHeight;
}


// ================================
// 14. GỬI TIN NHẮN REALTIME
// ================================

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const content = messageInput.value.trim();

    if (!content || !state.currentRoomId) {
        return;
    }

    if (!state.socket?.connected) {
        showNotice(roomMessage, "Mất kết nối realtime. Hãy thử lại.");
        return;
    }

    sendMessageBtn.disabled = true;

    state.socket.emit(
        "message:send",
        {
            roomId: state.currentRoomId,
            content
        },
        (result) => {
            sendMessageBtn.disabled = false;

            if (!result?.success) {
                showNotice(
                    roomMessage,
                    result?.message || "Không gửi được tin nhắn"
                );
                return;
            }

            // Server phát message:new cho mọi thành viên,
            // bao gồm cả người gửi nên không tự thêm lần nữa.
            messageInput.value = "";
            messageInput.focus();
            clearNotice(roomMessage);
        }
    );
});


// ================================
// 15. SAO CHÉP ID PHÒNG
// ================================

copyRoomIdBtn.addEventListener("click", async () => {
    if (!state.currentRoomId) {
        return;
    }

    try {
        await navigator.clipboard.writeText(state.currentRoomId);

        showNotice(roomMessage, "Đã sao chép ID phòng!", "success");
    } catch {
        showNotice(
            roomMessage,
            `ID phòng: ${state.currentRoomId}`,
            "success"
        );
    }
});


// ================================
// 16. ĐĂNG XUẤT
// ================================

function logout() {
    if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
    }

    localStorage.removeItem("token");

    state.token = null;
    state.user = null;
    state.currentRoomId = null;
    state.currentRoom = null;
    state.renderedMessageIds.clear();

    roomList.replaceChildren();
    messageList.replaceChildren();

    roomTitle.textContent = "Chọn một phòng chat";
    roomDescriptionText.textContent =
        "Chọn phòng ở danh sách bên trái để bắt đầu.";

    copyRoomIdBtn.classList.add("hidden");

    messageInput.disabled = true;
    sendMessageBtn.disabled = true;

    connectionStatus.textContent = "Chưa kết nối";
    connectionStatus.className = "connection-status";

    clearNotice(roomMessage);
    clearNotice(authMessage);

    showLoginForm();
    showAuth();
}

logoutBtn.addEventListener("click", logout);


// ================================
// 17. KHỞI ĐỘNG ỨNG DỤNG
// ================================

async function initializeApp() {
    if (!state.token) {
        showAuth();
        return;
    }

    try {
        // Kiểm tra token còn hợp lệ không
        const result = await api("/api/auth/me");

        state.user = result.data.user;

        showChat();
        connectSocket();
        await loadRooms();
    } catch (error) {
        console.error("Không thể khôi phục phiên đăng nhập:", error.message);

        logout();
    }
}

initializeApp();
