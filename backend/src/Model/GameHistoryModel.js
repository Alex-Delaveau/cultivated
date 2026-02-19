import { DataTypes } from 'sequelize';
import BaseModel from './BaseModels.js';

class GameHistoryModel extends BaseModel {

    static instance = null;

    constructor() {
        super('GameHistory', {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            gamesPlayed: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            gamesWon: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            totalScore: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            bestStreak: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            }
        });
        GameHistoryModel.instance = this;
    }

    static getInstance() {
        if (!GameHistoryModel.instance) {
            GameHistoryModel.instance = new GameHistoryModel();
        }
        return GameHistoryModel.instance;
    }
}

export default GameHistoryModel;
