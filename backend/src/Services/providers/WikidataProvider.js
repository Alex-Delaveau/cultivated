import ArtProvider from './ArtProvider.js';
import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fallbackArtworks = JSON.parse(
    readFileSync(join(__dirname, '../fallbackArtworks.json'), 'utf-8')
);

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

// Read optional egress proxy (set via HTTPS_PROXY env in docker-compose)
const _proxyConfig = (() => {
    const raw = process.env.HTTPS_PROXY || process.env.https_proxy;
    if (!raw) return false;
    try {
        const u = new URL(raw);
        return { protocol: 'http', host: u.hostname, port: parseInt(u.port) || 3128 };
    } catch (_) {
        return false;
    }
})();

// Extra WHERE triples or FILTER clauses injected per theme
const THEME_EXTRAS = {
    global:        { clause: '',                              requireInception: false },
    classic:       { clause: 'FILTER(?inception < "1800-01-01T00:00:00Z"^^xsd:dateTime)', requireInception: true  },
    modern:        { clause: 'FILTER(?inception >= "1850-01-01T00:00:00Z"^^xsd:dateTime && ?inception < "1970-01-01T00:00:00Z"^^xsd:dateTime)', requireInception: true },
    japanese:      { clause: '?item wdt:P495 wd:Q17 .',      requireInception: false },
    impressionist: { clause: '?item wdt:P135 wd:Q40415 .',   requireInception: false },
};

export default class WikidataProvider extends ArtProvider {
    constructor() {
        super();
        // Cache keyed by theme: { data, timestamp }
        this._caches = new Map();
    }

    async getArtworksForRound(difficulty, excludeIds = [], theme = 'global') {
        const pool = await this._getPool(theme);
        const n = pool.length;

        // Pool is pre-sorted by metadata completeness (proxy for famousness).
        // Tiers are proportional to actual pool size (robust to small themed pools).
        //   Easy   = top 35% (most complete metadata = most famous)
        //   Medium = next 35%
        //   Hard   = bottom 30%
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

    async _getPool(theme) {
        const cached = this._caches.get(theme);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[WikidataProvider] cache hit (theme: ${theme})`);
            return cached.data;
        }

        console.log(`[WikidataProvider] fetching from Wikidata SPARQL (theme: ${theme})...`);
        const t0 = Date.now();
        try {
            const artworks = await this._fetchFromWikidata(theme);
            const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
            if (artworks.length >= 4) {
                this._caches.set(theme, { data: artworks, timestamp: Date.now() });
                console.log(`[WikidataProvider] OK — ${artworks.length} artworks in ${elapsed}s (theme: ${theme})`);
                return artworks;
            }
            console.warn(`[WikidataProvider] too few results (${artworks.length}) after ${elapsed}s`);
        } catch (error) {
            const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
            console.error(`[WikidataProvider] SPARQL failed after ${elapsed}s (theme: ${theme}): ${error.message}`);
            if (error.response) {
                console.error(`[WikidataProvider] HTTP ${error.response.status} — ${String(error.response.data).slice(0, 300)}`);
            }
        }

        console.warn('[WikidataProvider] falling back to local artworks');
        return fallbackArtworks;
    }

    async _fetchFromWikidata(theme) {
        const query = this._buildQuery(theme);

        // Write query to a temp file so it can be tested with curl (avoids shell escaping issues)
        const queryFile = join(tmpdir(), `wikidata-query-${theme}.sparql`);
        try { writeFileSync(queryFile, query, 'utf-8'); } catch (_) { /* non-blocking */ }
        console.log(`[WikidataProvider] query written to ${queryFile}`);
        console.log(`[WikidataProvider] test with: curl -s -G '${SPARQL_ENDPOINT}' --data-urlencode "query@${queryFile}" -H 'Accept: application/sparql-results+json' | python3 -m json.tool | head -60`);

        const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/sparql-results+json',
                'User-Agent': 'AMICULTIVATED/1.0',
            },
            timeout: 55000,
            proxy: _proxyConfig,
        });

        console.log(`[WikidataProvider] HTTP ${response.status}, raw bindings: ${response.data?.results?.bindings?.length ?? '?'}`);
        const results = response.data?.results?.bindings;
        if (!results) throw new Error('Unexpected Wikidata SPARQL response format');

        // Deduplicate by QID, skip artworks with blank-node labels, sort by completeness
        const seen = new Set();
        const artworks = results
            .map(row => this._normalize(row))
            .filter(art => {
                if (!art.imageUrl) return false;
                if (!art.title || !art.artistName) return false; // blank-node or missing label
                if (seen.has(art.id)) return false;
                seen.add(art.id);
                return true;
            });

        // Sort: more complete metadata → easy tier (correlates with notoriety)
        artworks.sort((a, b) => this._completeness(b) - this._completeness(a));

        return artworks;
    }

    // Count non-null metadata fields — higher = better documented = more famous
    _completeness(art) {
        return [art.year, art.style, art.movement, art.museum].filter(Boolean).length;
    }

    _buildQuery(theme) {
        const { clause, requireInception } = THEME_EXTRAS[theme] ?? THEME_EXTRAS.global;
        const inceptionTriple = requireInception
            ? '?item wdt:P571 ?inception .'
            : 'OPTIONAL { ?item wdt:P571 ?inception }';

        // No ORDER BY, no sitelinks join — streams results immediately, stops at LIMIT.
        // Notability filter: only paintings with an English Wikipedia article.
        return `
SELECT ?item ?itemLabel ?artistLabel ?image
       ?inception ?genreLabel ?movementLabel ?locationLabel
WHERE {
  ?item wdt:P31  wd:Q3305213 ;
        wdt:P18  ?image ;
        wdt:P170 ?artist .
  ${inceptionTriple}
  OPTIONAL { ?item wdt:P136 ?genre }
  OPTIONAL { ?item wdt:P135 ?movement }
  OPTIONAL { ?item wdt:P276 ?location }
  # Only paintings that have an English Wikipedia article (notability filter)
  ?wpArticle schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> .
  ${clause}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
LIMIT 100
`;
    }

    // Wikidata's label SERVICE returns blank-node URIs when no label exists.
    // Detect and discard them so they never reach the game.
    _cleanLabel(value) {
        if (!value) return null;
        if (value.includes('.well-known/genid/')) return null; // blank node
        if (/^Q\d+$/.test(value)) return null;                // raw QID (no label found)
        return value;
    }

    _normalize(row) {
        const id = row.item.value.split('/').pop();
        const rawImage = row.image?.value ?? null;
        const imageUrl = rawImage
            ? rawImage.replace(
                'http://commons.wikimedia.org/wiki/Special:FilePath/',
                'https://commons.wikimedia.org/wiki/Special:FilePath/'
              ) + '?width=800'
            : null;

        return {
            id,
            title:      this._cleanLabel(row.itemLabel?.value)   ?? '',
            artistName: this._cleanLabel(row.artistLabel?.value) ?? '',
            year:       row.inception?.value ? new Date(row.inception.value).getFullYear() : null,
            imageUrl,
            style:      this._cleanLabel(row.genreLabel?.value),
            movement:   this._cleanLabel(row.movementLabel?.value),
            museum:     this._cleanLabel(row.locationLabel?.value),
            sourceUrl:  `https://www.wikidata.org/wiki/${id}`,
        };
    }
}
