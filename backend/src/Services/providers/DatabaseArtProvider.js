import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ArtProvider from './ArtProvider.js';
import ArtworkRepository from '../../Repository/ArtworkRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fallbackArtworks = JSON.parse(
    readFileSync(join(__dirname, '../fallbackArtworks.json'), 'utf-8')
);

export default class DatabaseArtProvider extends ArtProvider {
    constructor() {
        super();
        this._repo = new ArtworkRepository();
    }

    async getArtworksForRound(difficulty, excludeIds = [], theme = 'global') {
        let pool = await this._repo.getByTheme(theme);
        if (pool.length < 4) pool = await this._repo.getByTheme('global');
        if (pool.length < 4) pool = fallbackArtworks;

        const n = pool.length;
        const easyEnd = Math.floor(n * 0.35);
        const medEnd  = Math.floor(n * 0.70);

        let tier;
        switch (parseInt(difficulty)) {
            case 0:  tier = pool.slice(0, easyEnd);      break;
            case 1:  tier = pool.slice(easyEnd, medEnd); break;
            case 2:  tier = pool.slice(medEnd);          break;
            default: tier = pool.slice(0, easyEnd);
        }

        if (tier.length < 4) tier = pool;

        return this._pickFourUnique(tier, excludeIds);
    }
}
