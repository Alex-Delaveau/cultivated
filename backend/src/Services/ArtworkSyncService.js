import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import WikidataProvider from './providers/WikidataProvider.js';
import ArtworkRepository from '../Repository/ArtworkRepository.js';
import Logger from '../Logger/Logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _fallbackArtworks = JSON.parse(
    readFileSync(join(__dirname, 'fallbackArtworks.json'), 'utf-8')
);

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

    async seedFromFallback() {
        const count = await this._repo.countByTheme('global');
        if (count >= _fallbackArtworks.length) {
            Logger.info('[ArtworkSync] fallback artworks already seeded — skipping');
            return;
        }
        Logger.info(`[ArtworkSync] seeding ${_fallbackArtworks.length} fallback artworks into DB...`);
        for (const artwork of _fallbackArtworks) {
            await this._repo.upsert(artwork, 'global');
            const year = artwork.year;
            const movement = (artwork.movement || '').toLowerCase();
            if (year && year < 1800)                 await this._repo.upsert(artwork, 'classic');
            if (year && year >= 1850 && year < 1970) await this._repo.upsert(artwork, 'modern');
            if (movement.includes('impressi'))       await this._repo.upsert(artwork, 'impressionist');
        }
        Logger.success('[ArtworkSync] fallback seed complete');
    }

    async syncAll() {
        // Step 0: seed fallback artworks immediately (no network needed)
        await this.seedFromFallback();

        // Step 1: sync specific themes from Wikidata
        for (const theme of THEMES) {
            try { await this.syncTheme(theme); }
            catch (e) { Logger.warning(`[ArtworkSync] failed for theme "${theme}": ${e.message}`); }
        }

        // Step 2: mark all themed artworks as global
        Logger.info('[ArtworkSync] populating global from themed artworks...');
        await this._repo.markThemedAsGlobal();
        const globalCount = await this._repo.countByTheme('global');
        Logger.success(`[ArtworkSync] global theme now has ${globalCount} artworks`);

        if (globalCount < MIN_PER_THEME) {
            try { await this.syncTheme('global'); }
            catch (e) { Logger.warning(`[ArtworkSync] global SPARQL failed: ${e.message}`); }
        }
    }
}
