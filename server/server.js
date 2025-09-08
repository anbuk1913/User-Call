const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.get('/', (req, res) => res.send('Socket.IO server running'));

io.on('connection', (socket) => {
    console.log("User Connected")
    console.log(`User Connected: ${socket.id}`)
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", ({ userToCall, signalData, from }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

server.listen(5000, () => console.log("Server running on port 5000"));
