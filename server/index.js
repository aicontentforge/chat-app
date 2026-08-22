require("dotenv").config();

const userRoutes = require("./routes/users");
const audioUploadRoutes = require("./routes/audioUpload");
const messageRoutes = require("./routes/messages");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const groupRoutes = require("./routes/groups");
const fileUploadRoutes = require("./routes/fileUpload");
const profileUploadRoutes =
    require("./routes/profileUpload");

const db = require("./database");
const path = require("path");
const globalChatRoutes = require("./routes/globalChat");
const donationRoutes = require("./routes/donations");

db.run(`
ALTER TABLE messages
ADD COLUMN reaction TEXT DEFAULT NULL
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});

db.run(`
ALTER TABLE messages
ADD COLUMN file TEXT
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});

db.run(`
ALTER TABLE messages
ADD COLUMN fileName TEXT
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});

db.run(`
ALTER TABLE users
ADD COLUMN lastSeen TEXT DEFAULT NULL
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});

db.run(`
ALTER TABLE messages
ADD COLUMN pinned INTEGER DEFAULT 0
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});

db.run(`
ALTER TABLE users
ADD COLUMN pinnedChats TEXT DEFAULT '[]'
`, (err) => {

    if (
        err &&
        !err.message.includes("duplicate column")
    ) {
        console.log(err);
    }

});


db.run(`
ALTER TABLE users
ADD COLUMN displayName TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE users
ADD COLUMN avatar TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE users
ADD COLUMN bio TEXT DEFAULT 'Hey there! I am using Chat App.'
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE users
ADD COLUMN joinedAt TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN file TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN fileName TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN replyTo INTEGER
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN reaction TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN edited INTEGER DEFAULT 0
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE group_messages
ADD COLUMN pinned INTEGER DEFAULT 0
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE groups
ADD COLUMN createdBy TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE groups
ADD COLUMN createdAt TEXT
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});

db.run(`
ALTER TABLE groups
ADD COLUMN avatar TEXT DEFAULT ''
`, (err) => {
    if (err && !err.message.includes("duplicate column")) {
        console.log(err);
    }
});


const app = express();
const server = http.createServer(app);

const uploadRoutes = require("./routes/upload");

let onlineUsers = {};

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.get("/", (req, res) => {
  res.send("Chat Server Running");
});
app.use("/api/users", userRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/audio", audioUploadRoutes);

app.use("/api/groups", groupRoutes);

app.use("/api/file", fileUploadRoutes);

app.use("/api/global-chat", globalChatRoutes);

app.use("/api/donations", donationRoutes);

app.use(
    "/api/profile-upload",
    profileUploadRoutes
);

// ================= TRANSLATION =================

app.post("/api/translate", async (req, res) => {

    try {

        const {
            text,
            targetLanguage
        } = req.body;

        if (!text || !text.trim()) {

            return res.status(400).json({
                error: "Text is required"
            });

        }

        if (!targetLanguage) {

            return res.status(400).json({
                error: "Target language is required"
            });

        }

        const url =
            "https://api.mymemory.translated.net/get" +
            `?q=${encodeURIComponent(text)}` +
            `&langpair=auto|${encodeURIComponent(targetLanguage)}`;

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                `Translation API returned ${response.status}`
            );

        }

        const data = await response.json();

        const translatedText =
            data?.responseData?.translatedText;

        if (!translatedText) {

            return res.status(500).json({
                error: "Translation failed"
            });

        }

        res.json({
            translatedText
        });

    } catch (error) {

        console.error(
            "Translation error:",
            error
        );

        res.status(500).json({
            error: "Translation service failed"
        });

    }

});

app.get("/debug/messages", (req, res) => {

    db.all("SELECT * FROM messages", [], (err, rows) => {

        if (err) {
            return res.status(500).json(err);
        }

        res.json(rows);

    });

});

io.on("connection", (socket) => {

  console.log("User Connected:", socket.id);

  socket.on("join", (username) => {

    socket.username = username;

    onlineUsers[username] = socket.id;

    console.log("Online Users:", Object.keys(onlineUsers));

    io.emit("online_users", Object.keys(onlineUsers));

});


socket.on("join_group", (groupId) => {

    socket.join(`group_${groupId}`);

});


socket.on("send_group_message", (data) => {

    db.run(

        `INSERT INTO group_messages
        (
            groupId,
            sender,
            message,
            image,
            audio,
            file,
            fileName,
            replyTo,
            time
        )
        VALUES(?,?,?,?,?,?,?,?,?)`,

        [

            data.groupId,

            data.sender,

            data.message || "",

            data.image || "",

            data.audio || "",

            data.file || "",

            data.fileName || "",

            data.replyTo || null,

            new Date().toLocaleTimeString()

        ],

        function(err){

            if(err){

                console.log(err);

                return;

            }

            io.to(`group_${data.groupId}`).emit(

                "receive_group_message",

                {

                    id: this.lastID,

                    ...data,

                    time: new Date().toLocaleTimeString()

                }

            );

        }

    );

});

  

  socket.on("send_message", (data) => {

    const {
        sender,
        receiver,
        message,
        image,
        audio,
        file,
        replyTo
    } = data;

    const time = new Date().toLocaleTimeString();

    db.get(

        `SELECT *
         FROM blocked_users
         WHERE blocker=? AND blocked=?`,

        [receiver, sender],

        (err, row) => {

            if (err) {
                console.log(err);
                return;
            }

            if (row) {

                socket.emit("message_blocked", {
                    receiver
                });

                return;
            }

            db.run(

                `INSERT INTO messages
                (sender, receiver, message, image, audio, file, time, seen, replyTo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

                [
                    sender,
                    receiver,
                    message,
                    image,
                    audio,
                    file,
                    time,
                    0,
                    replyTo
                ],

                function (err) {

                    if (err) {
                        console.log(err);
                        return;
                    }

                    const msg = {
                        id: this.lastID,
                        sender,
                        receiver,
                        message,
                        image,
                        audio,
                        file,
                        fileName: data.fileName,
                        time,
                        seen: 0,
                        reaction: null,
                        replyTo
                    };

                    socket.emit("receive_message", msg);

                    if (onlineUsers[receiver]) {

                        io.to(onlineUsers[receiver]).emit(
                            "receive_message",
                            msg
                        );

                    }

                }

            );

        }

    );

});

  

  socket.on("seen_messages", (data) => {

    const { sender, receiver } = data;

    db.run(

        `UPDATE messages
        SET seen = 1
        WHERE sender = ?
        AND receiver = ?`,

        [

            sender,
            receiver

        ],

        function () {

            if (onlineUsers[sender]) {

                io.to(onlineUsers[sender]).emit(
                    "messages_seen",
                    {
                        sender,
                        receiver
                    }
                );

            }

        }

    );

});

  socket.on("react_message", (data) => {

    const {

        id,
        reaction

    } = data;

    db.run(

        `UPDATE messages
        SET reaction = ?
        WHERE id = ?`,

        [

            reaction,
            id

        ],

        function (err) {

            if (err) {

                console.log(err);

                return;

            }

            io.emit(

                "message_reacted",

                {

                    id,
                    reaction

                }

            );

        }

    );

});

  socket.on("edit_message", (data) => {

    const {

        id,
        message

    } = data;

    const editedTime = new Date().toLocaleTimeString();

    db.run(

        `UPDATE messages
        SET
            message = ?,
            edited = 1,
            editedTime = ?
        WHERE id = ?`,

        [

            message,
            editedTime,
            id

        ],

        function (err) {

            if (err) {

                console.log(err);
                return;

            }

            io.emit("message_edited", {

                id,
                message,
                edited: 1,
                editedTime

            });

        }

    );

});
  
  // ================= CALL USER =================

socket.on("call_user", (data) => {

    const { from, to, offer } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit("incoming_call", {

            from,
            offer

        });

    }

});

// ================= ANSWER CALL =================

socket.on("answer_call", (data) => {

    const { to, answer } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_accepted",

            answer

        );

    }

});

// ================= REJECT CALL =================

socket.on("reject_call", (data) => {

    const { to } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_rejected"

        );

    }

});

// ================= ICE CANDIDATE =================

socket.on("ice_candidate", (data) => {

    const { to, candidate } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "receive_ice_candidate",

            candidate

        );

    }

});

// ================= END CALL =================

socket.on("end_call", (data) => {

    const { to } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_ended"

        );

    }

});


  socket.on("typing", (data) => {

    const { sender, receiver } = data;

    if (onlineUsers[receiver]) {

        io.to(onlineUsers[receiver]).emit("typing", {
            sender
        });

    }

});

  socket.on("pin_message", ({ id, pinned }) => {

    db.run(

        `UPDATE messages
         SET pinned = ?
         WHERE id = ?`,

        [pinned ? 1 : 0, id],

        function (err) {

            if (err) {

                console.log(err);
                return;

            }

            io.emit("message_pinned", {

                id,
                pinned

            });

        }

    );

});

  socket.on("delete_message", (id) => {

    db.run(

        `DELETE FROM messages
        WHERE id = ?`,

        [id],

        function (err) {

            if (err) {

                console.log(err);
                return;

            }

            io.emit("message_deleted", id);

        }

    );

});

  socket.on("stop_typing", (data) => {

    const { sender, receiver } = data;

    if (onlineUsers[receiver]) {

        io.to(onlineUsers[receiver]).emit("stop_typing", {
            sender
        });

    }

});

  socket.on("call_user", (data) => {

    const {

        to,
        signal,
        from

    } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "incoming_call",

            {

                from,

                signal

            }

        );

    }

});

socket.on("answer_call", (data) => {

    const {

        to,
        signal

    } = data;

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_accepted",

            signal

        );

    }

});

socket.on("reject_call", (to) => {

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_rejected"

        );

    }

});

socket.on("end_call", (to) => {

    if (onlineUsers[to]) {

        io.to(onlineUsers[to]).emit(

            "call_ended"

        );

    }

});
  
  socket.on("disconnect", () => {

    if (socket.username) {

        db.run(
            "UPDATE users SET lastSeen=? WHERE username=?",
            [
                new Date().toISOString(),
                socket.username
            ]
        );

        delete onlineUsers[socket.username];

    }

    io.emit(
        "online_users",
        Object.keys(onlineUsers)
    );

}); // closes disconnect

}); // <-- ADD THIS LINE to close io.on("connection")

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});