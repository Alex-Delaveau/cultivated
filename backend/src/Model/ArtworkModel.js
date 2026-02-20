import { DataTypes } from 'sequelize';
import BaseModel from './BaseModels.js';

class ArtworkModel extends BaseModel {

    static instance = null;

    constructor() {
        super('Artwork', {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            artistName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            year: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            style: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            movement: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            museum: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            sourceUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            completeness: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
            },
            themeGlobal: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            themeClassic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            themeModern: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            themeJapanese: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            themeImpressionist: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        });
        ArtworkModel.instance = this;
    }

    static getInstance() {
        if (!ArtworkModel.instance) {
            ArtworkModel.instance = new ArtworkModel();
        }
        return ArtworkModel.instance;
    }
}

export default ArtworkModel;
