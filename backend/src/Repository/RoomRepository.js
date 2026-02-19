import RoomModel from '../Model/RoomModel.js';
import UserRepository from './UserRepository.js';
class RoomRepository {
    model = null
    userRepository = null
    constructor() {
        this.model = RoomModel.getInstance().getModel();
        this.userRepository = new UserRepository();
    }

    createRoom = (roomCode, maxPlayers, maxRounds, status, adminId) => {
        return this.model.create({
            code: roomCode,
            currentPlayerNumber: 1,
            maxPlayers: maxPlayers,
            maxRounds: maxRounds,
            status: status,
            adminId: adminId,
            timerSeconds: 30,
            difficulty: 0
        });
    }

    async getRoomByCode(roomCode) {
        const room = await this.model.findOne({ where: { code: roomCode } });
        if (!room) {
            return;
        }
        let roomData = {
            id: room.id,
            maxPlayers: room.maxPlayers,
            currentPlayerNumber: room.currentPlayerNumber,
            maxRounds: room.maxRounds,
            status: room.status,
            code: room.code,
            adminId: room.adminId,
            timerSeconds: room.timerSeconds ?? 30,
            difficulty: room.difficulty ?? 0,
            players: {}
        }
        roomData.players = (await this.userRepository.getUsersByRoomId(roomData.id)).map(user => {
            return {username: user.username, score: user.score};
        });
        return roomData;
    }

    async getRoomById(roomId) {
        return await this.model.findOne({ where: { id: roomId } });
    }

    async updateRoomStatus(roomCode, status) {
        return await this.model.update({ status: status }, { where: { code: roomCode } });
    }

    async incrementCurrentPlayerNumber(roomCode) {
        return await this.model.increment('currentPlayerNumber', { by: 1, where: { code: roomCode } });
    }

    async decrementCurrentPlayerNumber(roomCode) {
        return await this.model.decrement('currentPlayerNumber', { by: 1, where: { code: roomCode } });
    }

    async isRoomFull(roomCode) {
        let room = await this.getRoomByCode(roomCode);

        if (!room) {
            return true;
        }

        return room.maxPlayers === room.currentPlayerNumber;
    }

    async isRoomClosed(roomCode) {
        let room = await this.getRoomByCode(roomCode);
        return room.status === "Finished" || room.status === "Started";
    }

    async isRoomJoinable(roomCode) {
        return !(await this.isRoomFull(roomCode)) && !(await this.isRoomClosed(roomCode));
    }

    async updateSettings(roomCode, maxPlayers, maxRounds, timerSeconds, difficulty) {
        const updates = {};
        if (maxPlayers !== undefined) updates.maxPlayers = maxPlayers;
        if (maxRounds !== undefined) updates.maxRounds = maxRounds;
        if (timerSeconds !== undefined) updates.timerSeconds = timerSeconds;
        if (difficulty !== undefined) updates.difficulty = difficulty;
        return await this.model.update(updates, { where: { code: roomCode } });
    }

    async deleteRoom(roomId) {
        return await this.model.destroy({ where: { id: roomId } });
    }

    async doesRoomExist(roomCode) {
        return (await this.model.count({ where: { code: roomCode } })) > 0;
    }
}

export default RoomRepository;