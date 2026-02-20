import { createArtProvider } from './ArtProviderFactory.js';

const provider = createArtProvider();

class ArtApiService {
    static async selectArtworkForRound(difficulty, artId, theme = 'global') {
        return provider.getArtworksForRound(difficulty, artId ? [artId] : [], theme);
    }
}

export default ArtApiService;
