import io from 'socket.io-client';

class RoomSocketManager {

    static instance = null;
    socket = null;
    currentRoomCode = null;
    currentUser = null;

    constructor() {
        this.socket = io((import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000') + '/room', {
            withCredentials: true,
            transports: ['websocket'],
        });
        this.socket.on('connect', () => {
            if (this.currentRoomCode && this.currentUser) {
                this.socket.emit('joinRoom', {
                    roomCode: this.currentRoomCode,
                    user: this.currentUser,
                });
            }
        });
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomSocketManager();
        }
        return this.instance;
    }

    joinRoom(roomCode, user) {
        this.currentRoomCode = roomCode;
        this.currentUser = user;
        this.socket.emit('joinRoom', {
            roomCode: roomCode,
            user: user
        });
    }

    leaveRoom(roomCode, user) {
        this.currentRoomCode = null;
        this.currentUser = null;
        this.socket.emit('leaveRoom', {
            roomCode: roomCode,
            user: user
        });
    }

    updateRoom(roomCode) {
        this.socket.emit('updateRoom', {
            roomCode: roomCode
        });
    }

    startGame(roomCode) {
        this.socket.emit('startGame', {
            roomCode: roomCode,
            artId: ""
        });
    }

    endGame(roomCode) {
        this.socket.emit('endGame', {
            roomCode: roomCode
        });
    }

    submitAnswer(roomCode, user, answerId) {
        this.socket.emit('submitAnswer', {
            roomCode: roomCode,
            user: user,
            answerId: answerId
        });
    }

    startNextRound(roomCode) {
        this.socket.emit('nextRound', {
            roomCode: roomCode,
            artId: ""
        });
    }

    // Feature 9: Hint system
    requestHint(roomCode) {
        this.socket.emit('requestHint', { roomCode });
    }

    onUserJoined(callback) {
        this.socket.on('userJoined', callback);
    }

    onUserLeft(callback) {
        this.socket.on('userLeft', callback);
    }

    onRoomUpdated(callback) {
        this.socket.on('updateRoom', callback);
    }

    onGameStarted(callback) {
        this.socket.on('gameStarting', callback);
    }

    onRoundStarted(callback){
        this.socket.on('roundStarted', callback);
    }

    onRoundLoading(callback){
        this.socket.on('roundLoading', callback);
    }

    onRoundEnded(callback){
        this.socket.on('roundEnded', callback);
    }

    onGameEnded(callback){
        this.socket.on('gameEnded', callback);
    }

    onHintGranted(callback) {
        this.socket.on('hintGranted', callback);
    }

    offUserJoined(callback) {
        this.socket.off('userJoined', callback);
    }

    offUserLeft(callback) {
        this.socket.off('userLeft', callback);
    }

    offRoomUpdated(callback) {
        this.socket.off('updateRoom', callback);
    }

    offGameStarted(callback) {
        this.socket.off('gameStarting', callback);
    }

    offRoundStarted(callback){
        this.socket.off('roundStarted', callback);
    }

    offRoundEnded(callback){
        this.socket.off('roundEnded', callback);
    }

    offGameEnded(callback){
        this.socket.off('gameEnded', callback);
    }

    offRoundLoading(callback){
        this.socket.off('roundLoading', callback);
    }

    offHintGranted(callback) {
        this.socket.off('hintGranted', callback);
    }
}

export default RoomSocketManager;
