import Logger from "../Logger/Logger.js";
import RoomRepository from "../Repository/RoomRepository.js";
import UserRepository from "../Repository/UserRepository.js";
import RoundSocketManager from "./RoundSocketManager.js";

class RoomSocketHandler {

    io = null;
    userRepository = null;
    roomRepository = null;
    roundManagers = {};

    constructor(io) {
        this.io = io;
        this.roundManagers = {};
        this.userRepository = new UserRepository();
        this.roomRepository = new RoomRepository();
        this.setupRoomNamespace();
    }

    setupRoomNamespace() {
        const roomNamespace = this.io.of("/room");
        roomNamespace.on("connection", (socket) => {
            socket.on("joinRoom", ({ roomCode, user }) => {
                socket.join(roomCode);
                roomNamespace.to(roomCode).emit('userJoined', { user: user.username, room: roomCode });
                Logger.info(`User ${user.username} joined the room: ${roomCode}`);
                if (!this.roundManagers[roomCode]) {
                    this.roundManagers[roomCode] = new RoundSocketManager(roomNamespace, roomCode);
                }
                // attach room event listeners
                this.attachRoomEventListeners(socket, user);

                socket.on("disconnect", () => {
                    Logger.info(`User ${user.username} has disconnected from the room: ${roomCode}`);
                    this.handleLeaveRoom(socket, roomCode, user);
                });
            });

            socket.on("leaveRoom", ({ roomCode, user }) => {
                Logger.info(`User ${user.username} left the room: ${roomCode}`);
                this.handleLeaveRoom(socket, roomCode, user);
            });
        });
    }

    attachRoomEventListeners(socket, user) {
        const roomNamespace = this.io.of("/room");

        socket.on("updateRoom", async ({ roomCode }) => {
            Logger.info(`User ${user.username} has changed the settings of the room: ${roomCode}`);
            roomNamespace.to(roomCode).emit('updateRoom', { room: roomCode });
        });

        socket.on("startGame", async ({ roomCode, artId }) => {
            Logger.info(`User ${user.username} started the game for room: ${roomCode}`);
            const roundSocketManager = this.roundManagers[roomCode];
            roomNamespace.to(roomCode).emit('gameStarting', { room: roomCode });
            if (roundSocketManager) {
                // Fetch difficulty and timerSeconds from DB (ignore client-provided values)
                try {
                    const room = await this.roomRepository.getRoomByCode(roomCode);
                    const difficulty = room ? room.difficulty : 0;
                    const timerSeconds = room ? room.timerSeconds : 30;
                    const theme = room ? (room.theme ?? 'global') : 'global';
                    roundSocketManager.startRound(difficulty, artId || "", timerSeconds, theme);
                } catch (e) {
                    Logger.error(`Failed to fetch room settings for ${roomCode}: ${e.message}`);
                    roundSocketManager.startRound(0, artId || "", 30);
                }
            }
        });

        socket.on("nextRound", async ({ roomCode, artId }) => {
            Logger.info(`User ${user.username} started a new round for room: ${roomCode}`);
            const roundSocketManager = this.roundManagers[roomCode];
            if (roundSocketManager) {
                // Fetch difficulty and timerSeconds from DB
                try {
                    const room = await this.roomRepository.getRoomByCode(roomCode);
                    const difficulty = room ? room.difficulty : 0;
                    const timerSeconds = room ? room.timerSeconds : 30;
                    const theme = room ? (room.theme ?? 'global') : 'global';
                    roundSocketManager.startRound(difficulty, artId || "", timerSeconds, theme);
                } catch (e) {
                    Logger.error(`Failed to fetch room settings for ${roomCode}: ${e.message}`);
                    roundSocketManager.startRound(0, artId || "", 30);
                }
            }
        });

        socket.on("submitAnswer", async ({ roomCode, user, answerId }) => {
            Logger.info(`User ${user.username} answered in room: ${roomCode} with answer: ${answerId}`);
            const roundSocketManager = this.roundManagers[roomCode];
            if (roundSocketManager) {
                roundSocketManager.handlePlayerResponse(user, answerId);
            }
        });

        socket.on("endGame", async ({ roomCode }) => {
            Logger.info(`User ${user.username} ended game in room: ${roomCode}`);
            const roundSocketManager = this.roundManagers[roomCode];
            if (roundSocketManager) {
                roundSocketManager.endGame();
            }
        });

        // Feature 9: Hint system
        socket.on("requestHint", async ({ roomCode }) => {
            Logger.info(`User ${user.username} requested a hint in room: ${roomCode}`);
            const roundSocketManager = this.roundManagers[roomCode];
            if (roundSocketManager) {
                roundSocketManager.handleHintRequest(user.userId, socket);
            }
        });
    }

    handleLeaveRoom(socket, roomCode, user) {
        const roomNamespace = this.io.of("/room");
        this.detachRoomEventListeners(socket);
        socket.leave(roomCode);
        roomNamespace.to(roomCode).emit('userLeft', { user: user.username, room: roomCode });
        const roundSocketManager = this.roundManagers[roomCode];
        if (roundSocketManager) {
            roundSocketManager.handlePlayerLeave(user);
        }
    }

    detachRoomEventListeners(socket) {
        socket.removeAllListeners("updateRoom");
        socket.removeAllListeners("startGame");
        socket.removeAllListeners("nextRound");
        socket.removeAllListeners("submitAnswer");
        socket.removeAllListeners("endGame");
        socket.removeAllListeners("requestHint");
    }

}

export default RoomSocketHandler;
