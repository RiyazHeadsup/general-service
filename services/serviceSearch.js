// Ranks a salon's services against what a customer typed in the app's search.
//
// The catalogue for one service group is a few hundred items, so this scores
// them in memory. Each query word is matched against the service name first,
// then its subcategory and category names:
//   whole word (10) > word prefix (8) > inside a word (6) > typo (5)
//   subcategory/category hits score less (4 / 2).
// Services matching more of the query words rank first, then by score. Typos
// are allowed by length (1 edit from 4 letters, 2 from 7) using an edit
// distance that counts a swap of neighbours as one edit ("hiar" → "hair").

// One typed word that means several ("haircut" = hair + cut): each part must match
const SPLITS = {
  haircut: ['hair', 'cut'],
  haircuts: ['hair', 'cut'],
  haircolour: ['hair', 'color'],
  haircolor: ['hair', 'color'],
  hairspa: ['hair', 'spa'],
  headmassage: ['head', 'massage'],
};

// A typed word and what else it may mean
const SYNONYMS = {
  mani: ['manicure'],
  pedi: ['pedicure'],
  colour: ['color'],
  colouring: ['color'],
  coloring: ['color'],
  waxing: ['wax'],
  facials: ['facial'],
  threading: ['thread'],
  shave: ['shave', 'beard'],
  baal: ['hair'],
  bal: ['hair'],
  dadhi: ['beard'],
  daadhi: ['beard'],
  nakhun: ['nail'],
  massage: ['massage', 'spa'],
  bridal: ['bridal', 'bride'],
  makeup: ['makeup', 'make'],
  'make-up': ['makeup'],
};

const normalise = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ');
const words = (s) => normalise(s).split(/\s+/).filter(Boolean);

// Optimal string alignment distance, stopping early above `max`
const editDistance = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
};

const typoAllowance = (token) => (token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0);

// Best score for one query token against a list of words (0 = no match)
const scoreWords = (token, list, weights) => {
  let best = 0;
  const allow = typoAllowance(token);
  for (const w of list) {
    if (w === token) return weights.exact;
    if (w.startsWith(token)) best = Math.max(best, weights.prefix);
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, weights.inside);
    else if (allow && w.length >= 3 && editDistance(token, w, allow) <= allow) best = Math.max(best, weights.typo);
  }
  return best;
};

const NAME = { exact: 10, prefix: 8, inside: 6, typo: 5 };
const GROUP = { exact: 4, prefix: 4, inside: 3, typo: 2 };

const nameOf = (ref) => (ref && typeof ref === 'object' ? ref.name : '');

/**
 * @param {object[]} services  lean Service docs (categoryId/subCategoryId may be populated)
 * @param {string} text        what the user typed
 * @returns {object[]}         matching services, best first
 */
const rankServices = (services, text) => {
  const raw = words(text).flatMap(t => SPLITS[t] || [t]);
  if (!raw.length) return [];
  // Each query word becomes a set of alternatives (itself + synonyms)
  const terms = raw.map(t => [...new Set([t, ...(SYNONYMS[t] || [])])]);

  const scored = [];
  for (const svc of services) {
    const nameWords = words(svc.name);
    const groupWords = [...words(nameOf(svc.subCategoryId)), ...words(nameOf(svc.categoryId))];
    let matched = 0;
    let score = 0;
    let nameHit = false;

    for (const alts of terms) {
      let best = 0;
      let bestIsName = false;
      for (const t of alts) {
        const n = scoreWords(t, nameWords, NAME);
        const g = scoreWords(t, groupWords, GROUP);
        if (n > best) { best = n; bestIsName = true; }
        if (g > best) { best = g; bestIsName = false; }
      }
      if (best) {
        matched += 1;
        score += best;
        nameHit = nameHit || bestIsName;
      }
    }
    if (matched) scored.push({ svc, matched, score: score + (nameHit ? 5 : 0) });
  }

  scored.sort((a, b) =>
    b.matched - a.matched ||
    b.score - a.score ||
    String(a.svc.name).length - String(b.svc.name).length ||
    String(a.svc.name).localeCompare(String(b.svc.name)));
  return scored.map(s => s.svc);
};

module.exports = { rankServices, editDistance };
