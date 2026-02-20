import WikidataProvider from './providers/WikidataProvider.js';
import ArtworkRepository from '../Repository/ArtworkRepository.js';
import Logger from '../Logger/Logger.js';

const THEMES = ['classic', 'modern', 'japanese', 'impressionist'];
const MIN_PER_THEME = 200;
const PAGE_SIZE = 100;      // must match LIMIT in WikidataProvider._buildQuery
const MAX_PAGES = 10;       // safety cap — 10 × 100 raw = up to ~600 usable artworks

export default class ArtworkSyncService {
    constructor() {
        this._provider = new WikidataProvider();
        this._repo = new ArtworkRepository();
    }

    // Fetch pages with increasing OFFSET until the DB has MIN_PER_THEME for this theme.
    async syncTheme(theme) {
        let count = await this._repo.countByTheme(theme);
        if (count >= MIN_PER_THEME) {
            Logger.success(`[ArtworkSync] theme "${theme}" already has ${count} artworks — skipping`);
            return;
        }

        Logger.info(`[ArtworkSync] syncing theme "${theme}" (${count} artworks in DB, need ${MIN_PER_THEME})...`);

        for (let page = 0; page < MAX_PAGES; page++) {
            const offset = page * PAGE_SIZE;
            let artworks;
            try {
                artworks = await this._provider._fetchFromWikidata(theme, offset);
            } catch (e) {
                Logger.warning(`[ArtworkSync] page ${page} failed for theme "${theme}": ${e.message}`);
                break;
            }

            if (artworks.length === 0) {
                Logger.info(`[ArtworkSync] theme "${theme}" exhausted at offset ${offset}`);
                break;
            }

            for (const artwork of artworks) {
                await this._repo.upsert(artwork, theme);
            }

            count = await this._repo.countByTheme(theme);
            Logger.info(`[ArtworkSync] theme "${theme}" — page ${page}, stored ${artworks.length}, DB total: ${count}`);

            if (count >= MIN_PER_THEME) break;

            // Brief pause between pages to be polite to the Wikidata endpoint
            await new Promise(r => setTimeout(r, 1000));
        }

        const final = await this._repo.countByTheme(theme);
        Logger.success(`[ArtworkSync] theme "${theme}" done — ${final} artworks in DB`);
    }

    async syncAll() {
        // Step 1: sync the 4 specific themes with pagination
        for (const theme of THEMES) {
            try {
                await this.syncTheme(theme);
            } catch (e) {
                Logger.warning(`[ArtworkSync] failed for theme "${theme}": ${e.message}`);
            }
        }

        // Step 2: populate global by reusing artworks from all specific themes (single SQL UPDATE)
        Logger.info('[ArtworkSync] populating global from themed artworks...');
        await this._repo.markThemedAsGlobal();
        const globalCount = await this._repo.countByTheme('global');
        Logger.success(`[ArtworkSync] global theme now has ${globalCount} artworks`);

        // Step 3: if global is still below threshold, try SPARQL for it too
        if (globalCount < MIN_PER_THEME) {
            Logger.info('[ArtworkSync] global still below threshold — attempting SPARQL...');
            try {
                await this.syncTheme('global');
            } catch (e) {
                Logger.warning(`[ArtworkSync] global SPARQL failed: ${e.message}`);
            }
        }
    }
}
