import { Op } from 'sequelize';
import ArtworkModel from '../Model/ArtworkModel.js';

const THEME_COLUMNS = {
    global:        'themeGlobal',
    classic:       'themeClassic',
    modern:        'themeModern',
    japanese:      'themeJapanese',
    impressionist: 'themeImpressionist',
};

class ArtworkRepository {

    model = null;

    constructor() {
        this.model = ArtworkModel.getInstance().getModel();
    }

    upsert = async (artwork, theme) => {
        const themeCol = THEME_COLUMNS[theme];
        if (!themeCol) throw new Error(`Unknown theme: ${theme}`);

        const completeness = [artwork.year, artwork.style, artwork.movement, artwork.museum]
            .filter(Boolean).length;

        const [record, created] = await this.model.findOrCreate({
            where: { id: artwork.id },
            defaults: {
                id:         artwork.id,
                title:      artwork.title,
                artistName: artwork.artistName,
                year:       artwork.year ?? null,
                imageUrl:   artwork.imageUrl ?? null,
                style:      artwork.style ?? null,
                movement:   artwork.movement ?? null,
                museum:     artwork.museum ?? null,
                sourceUrl:  artwork.sourceUrl ?? null,
                completeness,
                [themeCol]: true,
            },
        });

        if (!created) {
            await record.update({ [themeCol]: true });
        }
    };

    getByTheme = async (theme) => {
        const themeCol = THEME_COLUMNS[theme];
        if (!themeCol) throw new Error(`Unknown theme: ${theme}`);

        return await this.model.findAll({
            where: { [themeCol]: true },
            order: [['completeness', 'DESC']],
            raw: true,
        });
    };

    countByTheme = async (theme) => {
        const themeCol = THEME_COLUMNS[theme];
        if (!themeCol) throw new Error(`Unknown theme: ${theme}`);

        return await this.model.count({ where: { [themeCol]: true } });
    };

    // Mark every artwork that belongs to any specific theme as also belonging to global.
    // Single SQL UPDATE — used after syncing themed artworks so global is populated for free.
    markThemedAsGlobal = async () => {
        await this.model.update(
            { themeGlobal: true },
            { where: { [Op.or]: [
                { themeClassic:       true },
                { themeModern:        true },
                { themeJapanese:      true },
                { themeImpressionist: true },
            ]}}
        );
    };
}

export default ArtworkRepository;
