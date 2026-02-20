import WikidataProvider from './providers/WikidataProvider.js';
import WikiArtProvider  from './providers/WikiArtProvider.js';

const PROVIDERS = {
    wikidata: WikidataProvider,
    wikiart:  WikiArtProvider,
};

export function createArtProvider() {
    const name = (process.env.ART_PROVIDER || 'wikidata').toLowerCase();
    const Provider = PROVIDERS[name] ?? WikidataProvider;
    console.log(`[ArtProviderFactory] using provider: ${name}`);
    return new Provider();
}
