Voici une doc sur l'amélioration de la source de donées d'art : 


---                                                                                                                     Réponse à la question 1 : Quelle API pour du grand public multi-source ?
                                                                                                                          La vérité inconfortable : aucune des trois API de musée ne répond parfaitement à ce besoin.

  L'Art Institute, le Met et le Rijksmuseum sont chacun d'excellentes sources mais restent fondamentalement
  monoculturelles — le Met penche occidental/américain, le Rijksmuseum est quasi-exclusivement flamand-néerlandais,
  l'AIC est américano-centré. Pour un quiz grand public international (Hokusai, Klimt, Frida Kahlo, Monet, Basquiat…),
  tu tomberais rapidement sur des trous.

  WikiArt reste paradoxalement la meilleure source pour ton cas d'usage actuel, précisément parce qu'elle agrège depuis
  des centaines de musées et collections mondiales. Le filtre MostViewedPaintings est un proxy de notoriété réel — c'est
   ce qui te garantit que tes joueurs reconnaissent les œuvres.

  Mais il existe une troisième voie bien supérieure que l'audit n'a pas explorée :

  Wikidata / Wikimedia Commons

  Critère: Sources
  WikiArt: Multi-musées agrégé
  Wikidata: Tous les musées mondiaux
  ────────────────────────────────────────
  Critère: Proxy de notoriété
  WikiArt: "Most viewed" sur WikiArt
  Wikidata: Nombre de Wikipédia dans X langues (vrai signal de célébrité)
  ────────────────────────────────────────
  Critère: Images
  WikiArt: JPEG direct, variable
  Wikidata: Wikimedia Commons, libre de droits, haute résolution
  ────────────────────────────────────────
  Critère: Métadonnées
  WikiArt: title, artist, year, style, genre
  Wikidata: Mouvement, matériau, dimensions, musée actuel, coordonnées, description longue…
  ────────────────────────────────────────
  Critère: Clé API
  WikiArt: Non
  Wikidata: Non
  ────────────────────────────────────────
  Critère: Stabilité
  WikiArt: API non officielle
  Wikidata: Institution fondation Wikimedia
  ────────────────────────────────────────
  Critère: Pagination
  WikiArt: Token propriétaire
  Wikidata: SPARQL (requêtes complexes possibles)

  Une requête SPARQL permet de demander : "donne-moi les 500 peintures les plus célèbres avec une image, triées par
  nombre de versions Wikipedia" — c'est le meilleur signal de célébrité grand public qui existe dans une base ouverte.

  ---
  Réponse à la question 2 : L'interface adaptateur, bonne idée ?

  Oui, mais pas comme feature utilisateur

  Exposer le choix d'API à l'utilisateur en jeu serait une erreur UX — tes joueurs veulent jouer, pas configurer une
  source de données. En revanche, l'Adapter Pattern côté développeur est une excellente idée architecturale pour trois
  raisons concrètes :

  1. Résilience — si WikiArt tombe, tu bascules sur Wikidata en changeant une variable d'environnement, sans toucher au
  code du jeu
  2. Testabilité — tu peux injecter un fournisseur mock dans les tests
  3. Évolutivité — ajouter une nouvelle source (ex: une API payante premium plus tard) ne nécessite qu'un nouveau
  fichier

  L'architecture que je recommande

  ArtProvider (interface commune)
  │
  ├── WikiArtProvider        ← existant, refactorisé
  ├── WikidataProvider       ← nouveau, recommandé comme principal
  ├── MetMuseumProvider      ← optionnel, CC0 garanti
  └── MockProvider           ← pour les tests

  L'interface commune n'expose qu'une seule méthode métier :

  // Ce que le jeu consomme — identique quel que soit le provider
  getArtworksForRound(difficulty, excludeIds)
    → Promise<Artwork[]>  // toujours 4 objets normalisés

  L'objet Artwork normalisé absorbe les différences entre APIs :

  {
    id, title, artistName,
    year,               // normalisé (fini completitionYear)
    imageUrl,           // URL directe, prête à l'emploi
    style,              // null si absent
    genre,              // null si absent
    movement,           // nouveau champ possible avec Wikidata
    museum,             // nouveau champ : "Musée d'Orsay"
    sourceUrl,          // lien "En savoir plus" vers la fiche source
  }

  Ce qui ne change pas du tout

  Le frontend, le store Vuex, les sockets, les composants Vue — zéro modification. Seul ArtApiService.js devient une
  factory qui retourne le bon provider selon process.env.ART_PROVIDER.

  ---
  Ma recommandation concrète

  Court terme  → Implémenter l'Adapter Pattern
                 + Provider Wikidata comme source principale
                 + Provider WikiArt conservé en fallback secondaire

  Moyen terme  → Enrichir l'objet normalisé (museum, movement)
                 pour un recap plus riche en fin de partie

  Long terme   → Option admin dans les settings de room
                 pour choisir un "thème" (peinture classique,
                 art moderne, japonais…) — alimenté par
                 des filtres SPARQL différents, pas par
                 le choix d'API

  Tu veux qu'on parte sur cette architecture ? Je peux préparer le plan de migration complet (interface, providers,
  objet normalisé, adaptation des sockets).


----- 


Contexte

 L'API WikiArt actuelle présente plusieurs faiblesses : API non officielle et instable, champ style/genre souvent null,
  HTTP non sécurisé, et catalogue dont la taille est inconnue. Le but est de migrer vers Wikidata comme source
 principale (800 peintures célèbres multi-musées, triées par notoriété Wikipedia) tout en introduisant un Adapter
 Pattern qui isole la logique de chaque fournisseur. WikiArt est conservé en fallback secondaire.

 Principe de changement minimal côté frontend : l'objet artwork est normalisé une fois en backend ; seuls 2 champs
 changent de nom dans les composants Vue (art.image → art.imageUrl, art.completitionYear → art.year).

 ---
 Architecture cible

 ArtApiService.js  (point d'entrée, inchangé pour RoundSocketManager)
         │
         ▼
 ArtProviderFactory.js  (lit ART_PROVIDER env var, retourne le bon provider)
         │
    ┌────┴─────────────────┐
    ▼                      ▼
 WikidataProvider.js   WikiArtProvider.js   ← implémentent tous les deux ArtProvider.js
 (source principale)   (fallback secondaire)

 Schéma normalisé Artwork

 {
   id:         string,          // QID Wikidata (ex: "Q12418") ou ID WikiArt
   title:      string,
   artistName: string,
   year:       number | null,   // Remplace completitionYear (typo corrigée)
   imageUrl:   string,          // URL image directe. Remplace image
   style:      string | null,   // genre Wikidata (P136)
   movement:   string | null,   // mouvement artistique (P135) — NOUVEAU
   museum:     string | null,   // lieu de conservation (P276) — NOUVEAU
   sourceUrl:  string | null,   // lien "En savoir plus" (wikidata.org ou wikiart.org)
 }

 ---
 Étape 1 — ArtProvider.js (classe de base / interface)

 Fichier à créer : backend/src/Services/providers/ArtProvider.js

 Classe abstraite ES6 avec une seule méthode publique :
 export default class ArtProvider {
   // Retourne Promise<Artwork[]> — exactement 4 objets normalisés
   async getArtworksForRound(difficulty, excludeIds = []) {
     throw new Error('Not implemented');
   }
   // Helpers de sélection communs aux deux providers
   _pickFourUnique(pool, excludeIds) { ... }   // 200 tentatives max, unicité par title+artistName
 }

 ---
 Étape 2 — WikidataProvider.js (source principale)

 Fichier à créer : backend/src/Services/providers/WikidataProvider.js

 Stratégie de cache

 - Au premier appel : exécute une requête SPARQL qui ramène les 800 peintures les plus célèbres (triées par
 wikibase:sitelinks décroissant)
 - Cache in-memory + TTL 12 heures
 - Tiers de difficulté découpés sur la liste triée :
   - Facile  → index 0–149   (les 150 œuvres les plus célèbres)
   - Moyen   → index 150–399
   - Difficile → index 400–799

 Requête SPARQL

 SELECT DISTINCT ?item ?itemLabel ?artistLabel ?image
                 ?inception ?genreLabel ?movementLabel ?locationLabel
                 ?sitelinks
 WHERE {
   ?item wdt:P31  wd:Q3305213 ;   # instance de : peinture
         wdt:P18  ?image ;          # possède une image
         wdt:P170 ?artist .         # créateur
   OPTIONAL { ?item wdt:P571 ?inception }
   OPTIONAL { ?item wdt:P136 ?genre }
   OPTIONAL { ?item wdt:P135 ?movement }
   OPTIONAL { ?item wdt:P276 ?location }
   ?item wikibase:sitelinks ?sitelinks .
   SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
 }
 ORDER BY DESC(?sitelinks)
 LIMIT 800

 Endpoint : https://query.wikidata.org/sparql
 Headers requis : Accept: application/sparql-results+json, User-Agent: AMICULTIVATED/1.0

 Normalisation de l'image Wikimedia Commons

 Les URLs retournées par Wikidata sont du type :
 http://commons.wikimedia.org/wiki/Special:FilePath/Starry_Night.jpg

 Convertir en URL d'aperçu dimensionné :
 imageUrl = sparqlImageUrl.replace(
   'http://commons.wikimedia.org/wiki/Special:FilePath/',
   'https://commons.wikimedia.org/wiki/Special:FilePath/'
 ) + '?width=800'

 Mapping SPARQL → Artwork

 {
   id:         item.value.split('/').pop(),  // extrait "Q12418" depuis l'URI
   title:      itemLabel.value,
   artistName: artistLabel.value,
   year:       inception ? new Date(inception.value).getFullYear() : null,
   imageUrl:   /* URL transformée ci-dessus */,
   style:      genreLabel?.value ?? null,
   movement:   movementLabel?.value ?? null,
   museum:     locationLabel?.value ?? null,
   sourceUrl:  `https://www.wikidata.org/wiki/${id}`,
 }

 ---
 Étape 3 — WikiArtProvider.js (fallback secondaire)

 Fichier à créer : backend/src/Services/providers/WikiArtProvider.js

 Reprend exactement la logique de ArtApiService.js actuel (getArt, cache 30 min, tiers pages 1-3 / 4-6 / 7-9), mais :
 - Étend ArtProvider
 - Normalise la sortie vers le schéma Artwork commun :
 year:      art.completitionYear ?? null,
 imageUrl:  art.image,
 style:     art.style ?? null,
 movement:  null,   // WikiArt ne fournit pas ce champ
 museum:    null,   // WikiArt ne fournit pas ce champ
 sourceUrl: (art.artistUrl && art.url)
            ? `https://www.wikiart.org/en/${art.artistUrl}/${art.url}`
            : null,

 ---
 Étape 4 — ArtProviderFactory.js

 Fichier à créer : backend/src/Services/ArtProviderFactory.js

 import WikidataProvider from './providers/WikidataProvider.js';
 import WikiArtProvider  from './providers/WikiArtProvider.js';

 const PROVIDERS = { wikidata: WikidataProvider, wikiart: WikiArtProvider };

 export function createArtProvider() {
   const name = (process.env.ART_PROVIDER || 'wikidata').toLowerCase();
   const Provider = PROVIDERS[name] ?? WikidataProvider;
   return new Provider();
 }

 ---
 Étape 5 — Refactoring ArtApiService.js

 Fichier modifié : backend/src/Services/ArtApiService.js

 Remplacer tout le contenu par une façade fine qui délègue au provider :
 import { createArtProvider } from './ArtProviderFactory.js';
 const provider = createArtProvider();  // singleton au démarrage

 class ArtApiService {
   static async selectArtworkForRound(difficulty, artId) {
     return provider.getArtworksForRound(difficulty, artId ? [artId] : []);
   }
 }
 export default ArtApiService;
 RoundSocketManager.js n'est pas modifié à cette étape.

 ---
 Étape 6 — Adaptation RoundSocketManager.js

 Fichier modifié : backend/src/Sockets/RoundSocketManager.js

 Deux changements ciblés :

 6a — answerData (ligne ~257) : adapter aux nouveaux noms de champs
 answerData = {
   artist:    art.artistName,
   title:     art.title,
   year:      art.year,              // était art.completitionYear
   style:     art.style ?? null,
   movement:  art.movement ?? null,  // NOUVEAU
   museum:    art.museum ?? null,    // NOUVEAU
   sourceUrl: art.sourceUrl ?? null, // était wikiartUrl
 };

 6b — message d'erreur : remplacer "WikiArt may be unavailable" par "Art data unavailable"

 ---
 Étape 7 — Store Vuex frontend

 Fichier modifié : amicultivated_frontend/src/store/store.js

 Étendre chosenArtInfo avec les nouveaux champs :
 chosenArtInfo: safeParse('chosenArtInfo', {
   artist: '', title: '', year: '',
   style: '', movement: '', museum: '',
   sourceUrl: '',                        // remplace wikiartUrl
 }),

 ---
 Étape 8 — ArtGame.vue (2 lignes)

 Fichier modifié : amicultivated_frontend/src/components/game/ArtGame.vue

 <!-- année dans les boutons réponse -->
 <span v-if="currentRoundInfos.questionType == 'year'">{{ artAnswer.year }}</span>
 <!-- était : artAnswer.completitionYear -->

 ---
 Étape 9 — Game.vue (1 ligne)

 Fichier modifié : amicultivated_frontend/src/components/game/Game.vue

 // dans formatRoundInfos()
 currentRoundInfos.value.image = artsInfo[0].imageUrl;
 // était : artsInfo[0].image

 ---
 Étape 10 — RoundRecap.vue (template)

 Fichier modifié : amicultivated_frontend/src/components/game/RoundRecap.vue

 Mettre à jour les bindings + ajouter les nouveaux champs :
 <p>Date : <span class="strong-text">{{ chosenArtInfo.year }}</span></p>
 <p v-if="chosenArtInfo.movement">Mouvement : <span>{{ chosenArtInfo.movement }}</span></p>
 <p v-if="chosenArtInfo.museum">Musée : <span>{{ chosenArtInfo.museum }}</span></p>
 <a v-if="chosenArtInfo.sourceUrl" :href="chosenArtInfo.sourceUrl" target="_blank">
   En savoir plus →
 </a>
 <!-- Supprimer la référence à wikiartUrl -->

 ---
 Étape 11 — fallbackArtworks.json

 Fichier modifié : backend/src/Services/fallbackArtworks.json

 Normaliser les 50 entrées au schéma Artwork (renommer image → imageUrl, unifier year, ajouter sourceUrl: null,
 movement: null, museum: null).
 Supprimer les doublons completionYear / completitionYear.

 ---
 Étape 12 — Variables d'environnement

 Fichiers modifiés : backend/.env et backend/.env.example

 # Art data provider: "wikidata" (default) | "wikiart" (fallback)
 ART_PROVIDER=wikidata

 ---
 Récapitulatif des fichiers

 ┌───────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┐
 │                          Fichier                          │                        Action                        │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/providers/ArtProvider.js             │ CRÉER — interface commune                            │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/providers/WikidataProvider.js        │ CRÉER — source principale                            │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/providers/WikiArtProvider.js         │ CRÉER — fallback (logique extraite de ArtApiService) │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/ArtProviderFactory.js                │ CRÉER — factory                                      │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/ArtApiService.js                     │ MODIFIER — façade fine                               │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Sockets/RoundSocketManager.js                 │ MODIFIER — answerData (6 lignes)                     │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/src/Services/fallbackArtworks.json                │ MODIFIER — normaliser schema                         │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ backend/.env + .env.example                               │ MODIFIER — ART_PROVIDER                              │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ amicultivated_frontend/src/store/store.js                 │ MODIFIER — chosenArtInfo schema                      │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ amicultivated_frontend/src/components/game/ArtGame.vue    │ MODIFIER — 1 ligne (year)                            │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ amicultivated_frontend/src/components/game/Game.vue       │ MODIFIER — 1 ligne (imageUrl)                        │
 ├───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────┤
 │ amicultivated_frontend/src/components/game/RoundRecap.vue │ MODIFIER — bindings + nouveaux champs                │
 └───────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┘

 ---
 Phase 2 — Long terme : Sélection de thème par l'admin de la room

 L'admin choisit un thème artistique dans les paramètres de la room (comme il choisit la difficulté). WikidataProvider
 exécute une requête SPARQL différente selon le thème. Aucun changement d'API nécessaire — c'est uniquement un filtre
 SPARQL différent.

 Thèmes proposés

 ┌───────────────┬────────────────────┬───────────────────────────────────────────────────────────────────────┐
 │      Clé      │      Label UI      │                        Filtre SPARQL principal                        │
 ├───────────────┼────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ global        │ 🌍 Général         │ aucun filtre supplémentaire (comportement actuel)                     │
 ├───────────────┼────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ classic       │ 🎨 Classique       │ ?inception < "1800"^^xsd:dateTime                                     │
 ├───────────────┼────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ modern        │ 🖼️ Moderne         │ ?inception >= "1850"^^xsd:dateTime, ?inception < "1970"^^xsd:dateTime
 ├───────────────┼────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ japanese      │ ⛩️ Japonais        │ ?item wdt:P495 wd:Q17 (pays d'origine : Japon)                        │
 ├───────────────┼────────────────────┼───────────────────────────────────────────────────────────────────────┤
 │ impressionist │ 🌸 Impressionnisme │ ?item wdt:P135 wd:Q40415 (mouvement : impressionnisme)                │
 └───────────────┴────────────────────┴───────────────────────────────────────────────────────────────────────┘

 Modifications backend

 WikidataProvider.js — ajouter des SPARQL par thème :
 - Cache séparé par thème : clé "${theme}-${tier}" au lieu de juste "${tier}"
 - Méthode _buildQuery(theme) retourne la requête SPARQL avec le filtre approprié
 - getArtworksForRound(difficulty, excludeIds, theme = 'global') — signature étendue

 ArtProvider.js — signature mise à jour :
 async getArtworksForRound(difficulty, excludeIds = [], theme = 'global') {}

 ArtApiService.js — passer le thème :
 static async selectArtworkForRound(difficulty, excludeId, theme = 'global') {
   return provider.getArtworksForRound(difficulty, excludeId ? [excludeId] : [], theme);
 }

 Migration base de données — nouveau champ theme dans RoomModel :
 - Sequelize : theme: { type: DataTypes.STRING, defaultValue: 'global' }
 - RoomRepository.js : inclure theme dans updateRoom
 - RoundSocketManager.js : lire room.theme et le passer à selectArtworkForRound

 Modifications frontend

 amicultivated_frontend/src/components/game/RoomStarting.vue — ajouter un sélecteur de thème (section après Difficulté)
  :
 <section class="card-section">
   <h2 class="section-title">Thème</h2>
   <div class="theme-buttons">
     <button
       v-for="t in themes" :key="t.value"
       class="diff-btn"
       :class="{ 'diff-btn--active': roomInfos.theme === t.value }"
       @click="setTheme(t.value)"
     >{{ t.icon }} {{ t.label }}</button>
   </div>
 </section>
 Avec themes = tableau des 5 thèmes, et setTheme() qui émet updateRoom.

 amicultivated_frontend/src/store/store.js — currentRoomInfos inclut déjà tous les champs de la room ; pas de
 changement si theme est retourné par getRoom.

 amicultivated_frontend/src/views/Room.vue ou équivalent — s'assurer que theme est inclus dans le payload updateRoom.

 Fichiers supplémentaires pour le long terme

 ┌─────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────┐
 │                           Fichier                           │                     Action                      │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Models/RoomModel.js                             │ Ajouter champ theme                             │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Repositories/RoomRepository.js                  │ Inclure theme dans update                       │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Sockets/RoundSocketManager.js                   │ Lire room.theme, passer à selectArtworkForRound │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Services/ArtApiService.js                       │ Passer theme en 3ème paramètre                  │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Services/providers/ArtProvider.js               │ Signature étendue                               │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ backend/src/Services/providers/WikidataProvider.js          │ Cache par thème, _buildQuery(theme)             │
 ├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
 │ amicultivated_frontend/src/components/game/RoomStarting.vue │ Section sélecteur de thème                      │
 └─────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────┘

 ---
 Ordre d'implémentation recommandé

 Phase 1 — Court/moyen terme (étapes 1→12)

 1. Backend d'abord (étapes 1→6) : le jeu continue de fonctionner avec WikiArt tant que ART_PROVIDER n'est pas changé
 2. Tester WikidataProvider isolément via un script Node avant de brancher RoundSocketManager
 3. Frontend ensuite (étapes 7→10) : les 2 champs renommés cassent l'affichage si le backend est déjà migré — les faire
  en même déploiement
 4. Basculer ART_PROVIDER=wikidata seulement quand les deux côtés sont prêts

 Phase 2 — Long terme (thèmes)

 5. Ajouter theme au modèle Room + migration DB
 6. Étendre WikidataProvider avec _buildQuery(theme) et cache par thème
 7. Brancher le theme dans RoundSocketManager → selectArtworkForRound
 8. Ajouter l'UI de sélection de thème dans RoomStarting.vue

 ---
 Vérification

 - node -e "import('./backend/src/Services/providers/WikidataProvider.js').then(m => new
 m.default().getArtworksForRound(0)).then(console.log)" — doit retourner 4 objets normalisés
 - Démarrer le backend avec ART_PROVIDER=wikidata, lancer une partie : l'image et les 4 réponses s'affichent
 correctement
 - RoundRecap affiche movement et museum quand ils sont renseignés
 - Switcher ART_PROVIDER=wikiart : le jeu fonctionne toujours (fallback opérationnel)
 - Vérifier la console backend : le cache Wikidata se remplit une fois au premier round, puis "cache hit" pour les
 suivants