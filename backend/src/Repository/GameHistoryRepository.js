import GameHistoryModel from '../Model/GameHistoryModel.js';

class GameHistoryRepository {

    model = null;

    constructor() {
        this.model = GameHistoryModel.getInstance().getModel();
    }

    async getOrCreate(userId, username) {
        const [record] = await this.model.findOrCreate({
            where: { userId },
            defaults: { userId, username, gamesPlayed: 0, gamesWon: 0, totalScore: 0, bestStreak: 0 }
        });
        return record;
    }

    async addScore(userId, username, score) {
        await this.getOrCreate(userId, username);
        return await this.model.increment('totalScore', { by: score, where: { userId } });
    }

    async updateBestStreak(userId, username, streak) {
        const record = await this.getOrCreate(userId, username);
        if (streak > record.bestStreak) {
            await this.model.update({ bestStreak: streak }, { where: { userId } });
        }
    }

    async finishGame(userId, username, won) {
        await this.getOrCreate(userId, username);
        await this.model.increment('gamesPlayed', { by: 1, where: { userId } });
        if (won) {
            await this.model.increment('gamesWon', { by: 1, where: { userId } });
        }
    }

    async getByUserId(userId) {
        return await this.model.findOne({ where: { userId } });
    }

    async getTopPlayers(limit = 10) {
        return await this.model.findAll({
            order: [['totalScore', 'DESC']],
            limit: limit
        });
    }
}

export default GameHistoryRepository;
