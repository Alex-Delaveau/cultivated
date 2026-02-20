export default class ArtProvider {
    // Returns Promise<Artwork[]> — exactly 4 normalized objects
    async getArtworksForRound(difficulty, excludeIds = [], theme = 'global') {
        throw new Error('Not implemented');
    }

    // Picks 4 unique artworks from pool, excluding given ids
    _pickFourUnique(pool, excludeIds) {
        const filtered = excludeIds.length > 0
            ? pool.filter(art => !excludeIds.includes(art.id))
            : pool;

        const source = filtered.length >= 4 ? filtered : pool;
        const chosen = [];
        let attempts = 0;
        const maxAttempts = 200;

        while (chosen.length < 4 && attempts < maxAttempts) {
            attempts++;
            const index = Math.floor(Math.random() * source.length);
            const art = source[index];
            const isUnique = !chosen.some(a =>
                a.title === art.title && a.artistName === art.artistName
            );
            if (isUnique) {
                chosen.push(art);
            }
        }

        if (chosen.length < 4) {
            throw new Error(
                `Could not find 4 unique artworks after ${maxAttempts} attempts (found ${chosen.length})`
            );
        }

        return chosen;
    }
}
