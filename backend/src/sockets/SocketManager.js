import RoomSocketHandler from "./RoomSocketHandler.js";
import { Server } from "socket.io";

class SocketManager {
    io = null;

    constructor(server) {
        const origins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ["http://localhost:5173", "http://127.0.0.1:5173"];

        this.io = new Server(server, {
            cors: {
                origin: origins,
                methods: ["GET", "POST"],
                credentials: true,
            }
        });

        this.setupHandlers();
    }

    setupHandlers() {
        new RoomSocketHandler(this.io);
    }
}

export default SocketManager;