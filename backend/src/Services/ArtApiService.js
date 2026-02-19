import axios from 'axios';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fallbackArtworks = JSON.parse(readFileSync(join(__dirname, 'fallbackArtworks.json'), 'utf-8'));

// In-memory cache for WikiArt API responses
const artCache = new Map(); // key: "pageStart-pageEnd", value: { data, timestamp }
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

class ArtApiService {
    static url = "http://www.wikiart.org/en/api/2/MostViewedPaintings";

    static async getArt(pageStart, pageEnd) {
        const cacheKey = `${pageStart}-${pageEnd}`;
        const cached = artCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        let artData;
        let currentPaginationToken = '';

        for (let page = 1; page <= pageEnd; page++) {
            try {
                const urlWithToken = `${ArtApiService.url}?paginationToken=${currentPaginationToken}`;
                const response = await axios.get(urlWithToken, { timeout: 5000 });

                if (response.status === 200) {
                    const jsonData = response.data;
                    currentPaginationToken = jsonData.paginationToken;
                    if (page >= pageStart && page <= pageEnd) {
                        if (!artData) {
                            artData = jsonData; // Assign initial data
                        } else {
                            // Check if artData has 'data' property before using concat
                            if (artData.data && Array.isArray(artData.data) && jsonData.data && Array.isArray(jsonData.data)) {
                                artData.data = artData.data.concat(jsonData.data);
                            } else {
                                console.error('Invalid data structure in response data.');
                            }
                        }
                    }
                } else {
                    console.error('Request failed with status:', response.status);
                }
            } catch (error) {
                console.error('Error fetching art:', error);
            }
        }

        if (artData) {
            artCache.set(cacheKey, { data: artData, timestamp: Date.now() });
        }

        return artData;
    }

    static async getRandomArt(difficulty, artId) {
        let arts = [];
        switch (difficulty) {
            case 0:
                arts = (await ArtApiService.getArt(1, 3)).data;
                break;
            case 1:
                arts = (await ArtApiService.getArt(4, 6)).data;
                break;
            case 2:
                arts = (await ArtApiService.getArt(7, 9)).data;
                break;
            default:
                arts = (await ArtApiService.getArt(1, 3)).data;
        }
        const index = Math.floor(Math.random() * arts.length);
        let chosenArt =  arts[index];

        return chosenArt;

    }

    static async selectArtworkForRound(difficulty, artId) {
        let pageStart = 1;
        let pageEnd = 3;
        if(difficulty == 1){
            pageStart = 4;
            pageEnd = 6;
        }else if(difficulty >= 2){
            pageStart = 7;
            pageEnd = 9;
        }

        let artList;
        try {
            artList = await ArtApiService.getArt(pageStart, pageEnd);
        } catch (error) {
            console.error('WikiArt API failed, using fallback artworks:', error.message);
        }

        if (!artList || !artList.data || artList.data.length === 0) {
            console.warn('WikiArt returned no data, using fallback artworks');
            artList = { data: fallbackArtworks };
        }

        // chose 4 random arts from the list
        const chosenArtList = [];
        let attempts = 0;
        const maxAttempts = 200;
        while (chosenArtList.length < 4 && attempts < maxAttempts) {
            attempts++;
            const index = Math.floor(Math.random() * artList.data.length);
            const chosenArt = artList.data[index];

            // Check if the chosen art is not already picked (same title AND artist)
            const isUnique = !chosenArtList.some(art =>
                art.title === chosenArt.title &&
                art.artistName === chosenArt.artistName
            );

            if (isUnique) {
                chosenArtList.push(chosenArt);
            }
        }

        if (chosenArtList.length < 4) {
            throw new Error(`Could not find 4 unique artworks after ${maxAttempts} attempts (found ${chosenArtList.length})`);
        }

        return chosenArtList;
    }
}

export default ArtApiService;