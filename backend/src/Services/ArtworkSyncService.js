import WikidataProvider from './providers/WikidataProvider.js';
import ArtworkRepository from '../Repository/ArtworkRepository.js';
import Logger from '../Logger/Logger.js';

const THEMES = ['global', 'classic', 'modern', 'japanese', 'impressionist'];
const MIN_PER_THEME = 50;

export default class ArtworkSyncService {
    constructor() {
        this._provider = new WikidataProvider();
        this._repo = new ArtworkRepository();
    }

    async syncTheme(theme) {
        const count = await this._repo.countByTheme(theme);
        if (count >= MIN_PER_THEME) {
            Logger.success(`[ArtworkSync] theme "${theme}" already has ${count} artworks — skipping`);
            return;
        }

        Logger.info(`[ArtworkSync] syncing theme "${theme}" (${count} artworks in DB, need ${MIN_PER_THEME})...`);
        const artworks = await this._provider._fetchFromWikidata(theme);

        let stored = 0;
        for (const artwork of artworks) {
            await this._repo.upsert(artwork, theme);
            stored++;
        }

        Logger.success(`[ArtworkSync] stored ${stored} artworks for theme "${theme}"`);
    }

    async syncAll() {
        for (const theme of THEMES) {
            try {
                await this.syncTheme(theme);
            } catch (e) {
                Logger.warning(`[ArtworkSync] failed for theme "${theme}": ${e.message}`);
            }
        }
    }
}
