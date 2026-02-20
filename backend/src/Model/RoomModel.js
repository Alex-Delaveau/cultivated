import { DataTypes } from 'sequelize';
import BaseModel from './BaseModels.js';

class RoomModel extends BaseModel{


    constructor() {
        super('Room',{
            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            maxPlayers: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            currentPlayerNumber: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            maxRounds: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            status: {
                type: DataTypes.STRING,
                allowNull: false
            },
            adminId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            timerSeconds: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 30
            },
            difficulty: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            theme: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'global'
            }
        })
        RoomModel.instance = this;
    }


    static getInstance() {
        if (!RoomModel.instance) {
            RoomModel.instance = new RoomModel();
        }
        return RoomModel.instance;
    }
    
}

export default RoomModel;