import ArtProvider from './ArtProvider.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fallbackArtworks = JSON.parse(
    readFileSync(join(__dirname, '../fallbackArtworks.json'), 'utf-8')
);

const WIKIART_URL = 'http://www.wikiart.org/en/api/2/MostViewedPaintings';
const artCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export default class WikiArtProvider extends ArtProvider {
    // eslint-disable-next-line no-unused-vars
    async getArtworksForRound(difficulty, excludeIds = [], theme = 'global') {
        let pageStart = 1;
        let pageEnd = 3;
        if (difficulty == 1) {
            pageStart = 4; pageEnd = 6;
        } else if (difficulty >= 2) {
            pageStart = 7; pageEnd = 9;
        }

        let normalizedArtworks;
        try {
            const artList = await this._getArt(pageStart, pageEnd);
            if (artList?.data?.length > 0) {
                normalizedArtworks = artList.data.map(art => this._normalize(art));
            }
        } catch (error) {
            console.error('[WikiArtProvider] API failed, using fallback:', error.message);
        }

        if (!normalizedArtworks || normalizedArtworks.length === 0) {
            console.warn('[WikiArtProvider] no data, using fallback artworks');
            normalizedArtworks = fallbackArtworks; // already normalized
        }

        return this._pickFourUnique(normalizedArtworks, excludeIds);
    }

    async _getArt(pageStart, pageEnd) {
        const cacheKey = `${pageStart}-${pageEnd}`;
        const cached = artCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        let artData;
        let currentPaginationToken = '';

        for (let page = 1; page <= pageEnd; page++) {
            try {
                const urlWithToken = `${WIKIART_URL}?paginationToken=${currentPaginationToken}`;
                const response = await axios.get(urlWithToken, { timeout: 5000 });

                if (response.status === 200) {
                    const jsonData = response.data;
                    currentPaginationToken = jsonData.paginationToken;
                    if (page >= pageStart && page <= pageEnd) {
                        if (!artData) {
                            artData = jsonData;
                        } else if (artData.data && Array.isArray(artData.data) &&
                                   jsonData.data && Array.isArray(jsonData.data)) {
                            artData.data = artData.data.concat(jsonData.data);
                        }
                    }
                }
            } catch (error) {
                console.error('[WikiArtProvider] Error fetching page:', error.message);
            }
        }

        if (artData) {
            artCache.set(cacheKey, { data: artData, timestamp: Date.now() });
        }

        return artData;
    }

    _normalize(art) {
        return {
            id:         art.id,
            title:      art.title,
            artistName: art.artistName,
            year:       art.completitionYear ?? null,
            imageUrl:   art.image,
            style:      art.style ?? null,
            movement:   null,
            museum:     null,
            sourceUrl:  (art.artistUrl && art.url)
                ? `https://www.wikiart.org/en/${art.artistUrl}/${art.url}`
                : null,
        };
    }
}
