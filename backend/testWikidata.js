/**
 * Standalone Wikidata SPARQL test script
 * Usage:
 *   node backend/testWikidata.js                        → theme "global", limit 100
 *   node backend/testWikidata.js classic                → specific theme
 *   node backend/testWikidata.js global 20              → smaller limit (faster)
 *   node backend/testWikidata.js global 800 --export    → fetch + overwrite fallbackArtworks.json
 *
 * The query is also written to /tmp/wikidata-query-<theme>.sparql so you can
 * test it manually with curl (no shell-escaping issues):
 *   curl -s -G 'https://query.wikidata.org/sparql' \
 *     --data-urlencode "query@/tmp/wikidata-query-global.sparql" \
 *     -H 'Accept: application/sparql-results+json' | python3 -m json.tool | head -60
 */

import axios from 'axios';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

const THEME_EXTRAS = {
    global:        { clause: '',                              requireInception: false },
    classic:       { clause: 'FILTER(?inception < "1800-01-01T00:00:00Z"^^xsd:dateTime)', requireInception: true  },
    modern:        { clause: 'FILTER(?inception >= "1850-01-01T00:00:00Z"^^xsd:dateTime && ?inception < "1970-01-01T00:00:00Z"^^xsd:dateTime)', requireInception: true },
    japanese:      { clause: '?item wdt:P495 wd:Q17 .',      requireInception: false },
    impressionist: { clause: '?item wdt:P135 wd:Q40415 .',   requireInception: false },
};

function buildQuery(theme, limit) {
    const { clause, requireInception } = THEME_EXTRAS[theme];
    const inceptionTriple = requireInception
        ? '?item wdt:P571 ?inception .'
        : 'OPTIONAL { ?item wdt:P571 ?inception }';

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
  ?wpArticle schema:about ?item ;
             schema:isPartOf <https://en.wikipedia.org/> .
  ${clause}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
LIMIT ${limit}
`;
}

function completeness(art) {
    return [art.year, art.style, art.movement, art.museum].filter(Boolean).length;
}

async function run() {
    const exportMode = process.argv.includes('--export');
    const args = process.argv.slice(2).filter(a => a !== '--export');
    const theme = args[0] ?? 'global';
    const limit = parseInt(args[1] ?? '100');

    if (!THEME_EXTRAS[theme]) {
        console.error(`Unknown theme "${theme}". Available: ${Object.keys(THEME_EXTRAS).join(', ')}`);
        process.exit(1);
    }

    const query = buildQuery(theme, limit);

    // Write query to temp file for manual curl testing
    const queryFile = join(tmpdir(), `wikidata-query-${theme}.sparql`);
    writeFileSync(queryFile, query, 'utf-8');

    console.log('='.repeat(60));
    console.log(`Theme   : ${theme}`);
    console.log(`Limit   : ${limit}`);
    console.log(`Endpoint: ${SPARQL_ENDPOINT}`);
    console.log(`Query   :\n${query.trim()}`);
    console.log('='.repeat(60));
    console.log(`\nTo test manually with curl (works without shell-escaping issues):`);
    console.log(`  curl -s -G '${SPARQL_ENDPOINT}' \\`);
    console.log(`    --data-urlencode "query@${queryFile}" \\`);
    console.log(`    -H 'Accept: application/sparql-results+json' | python3 -m json.tool | head -60`);
    console.log('\nSending request...\n');

    const t0 = Date.now();
    try {
        const response = await axios.get(
            `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`,
            {
                headers: {
                    'Accept': 'application/sparql-results+json',
                    'User-Agent': 'AMICULTIVATED-test/1.0',
                },
                timeout: 60000,
            }
        );

        const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
        const bindings = response.data?.results?.bindings ?? [];
        console.log(`✓ HTTP ${response.status} — ${bindings.length} raw rows in ${elapsed}s`);

        // Deduplicate and normalize
        const seen = new Set();
        const artworks = bindings
            .map(row => ({
                id:         row.item.value.split('/').pop(),
                title:      row.itemLabel?.value ?? '(no label)',
                artistName: row.artistLabel?.value ?? '(no label)',
                year:       row.inception?.value ? new Date(row.inception.value).getFullYear() : null,
                imageUrl:   row.image?.value ?? null,
                style:      row.genreLabel?.value ?? null,
                movement:   row.movementLabel?.value ?? null,
                museum:     row.locationLabel?.value ?? null,
            }))
            .filter(a => {
                if (!a.imageUrl || seen.has(a.id)) return false;
                seen.add(a.id);
                return true;
            });

        artworks.sort((a, b) => completeness(b) - completeness(a));

        const n = artworks.length;
        const easyEnd = Math.floor(n * 0.35);
        const medEnd  = Math.floor(n * 0.70);
        const tiers = {
            easy:   artworks.slice(0, easyEnd),
            medium: artworks.slice(easyEnd, medEnd),
            hard:   artworks.slice(medEnd),
        };

        console.log(`Unique artworks with image: ${n}`);
        console.log(`  Easy tier   (0–${easyEnd - 1})   : ${tiers.easy.length}`);
        console.log(`  Medium tier (${easyEnd}–${medEnd - 1}) : ${tiers.medium.length}`);
        console.log(`  Hard tier   (${medEnd}–${n - 1})  : ${tiers.hard.length}`);
        console.log('');
        console.log('Top 5 (completeness-sorted):');
        artworks.slice(0, 5).forEach((a, i) => {
            const score = completeness(a);
            console.log(`  ${i + 1}. [${a.id}] "${a.title}" — ${a.artistName} (${a.year ?? '?'}) [completeness: ${score}/4]`);
            console.log(`     style: ${a.style ?? '-'}  movement: ${a.movement ?? '-'}  museum: ${a.museum ?? '-'}`);
            console.log(`     image: ${(a.imageUrl ?? '').slice(0, 80)}...`);
        });

        if (artworks.length < 4) {
            console.warn('\n⚠ Not enough artworks for a round (need 4)!');
            process.exit(1);
        }

        console.log('\n✓ Query OK — enough artworks for all difficulty tiers.');

        if (exportMode) {
            // Add sourceUrl for each artwork before exporting
            const exportData = artworks.map(a => ({
                ...a,
                sourceUrl: `https://www.wikidata.org/wiki/${a.id}`,
            }));
            const outPath = join(__dirname, 'src/Services/fallbackArtworks.json');
            writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');
            console.log(`\n✓ Exported ${exportData.length} artworks → ${outPath}`);
            console.log('  Commit and push this file to update the VPS fallback dataset.');
        }

    } catch (error) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
        console.error(`✗ Failed after ${elapsed}s: ${error.message}`);
        if (error.response) {
            console.error(`  HTTP ${error.response.status}`);
            console.error(`  Body: ${String(error.response.data).slice(0, 400)}`);
        }
        console.log('\nTest manually (query saved to file — no escaping issues):');
        console.log(`  curl -s -G '${SPARQL_ENDPOINT}' \\`);
        console.log(`    --data-urlencode "query@${queryFile}" \\`);
        console.log(`    -H 'Accept: application/sparql-results+json' | python3 -m json.tool | head -60`);
        process.exit(1);
    }
}

run();
