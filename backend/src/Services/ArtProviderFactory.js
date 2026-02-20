import WikidataProvider    from './providers/WikidataProvider.js';
import WikiArtProvider     from './providers/WikiArtProvider.js';
import DatabaseArtProvider from './providers/DatabaseArtProvider.js';

const PROVIDERS = {
    wikidata: WikidataProvider,
    wikiart:  WikiArtProvider,
    database: DatabaseArtProvider,
};

export function createArtProvider() {
    const name = (process.env.ART_PROVIDER || 'database').toLowerCase();
    const Provider = PROVIDERS[name] ?? DatabaseArtProvider;
    console.log(`[ArtProviderFactory] using provider: ${name}`);
    return new Provider();
}
