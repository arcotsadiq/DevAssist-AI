
import { knowledgeBase } from '../data/knowledgeBase.js';

// Common words that add little meaning to support queries.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are',
  'was', 'were', 'to', 'of', 'in', 'on', 'for', 'with',
  'this', 'that', 'it', 'my', 'our', 'your', 'please',
  'i', 'we', 'you', 'they', 'he', 'she', 'me', 'us',
  'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'not', 'can', 'could', 'would',
  'should', 'will', 'after', 'before', 'from', 'at'
]);

// Related technical terms for keyword-based retrieval.
const SYNONYM_GROUPS = [
  ['login', 'log', 'signin', 'authentication', 'auth', 'access'],
  ['password', 'credential', 'credentials', 'reset'],
  ['database', 'mongodb', 'mongo', 'query', 'collection', 'mongoose'],
  ['api', 'endpoint', 'request', 'response', 'rest'],
  ['slow', 'latency', 'performance', 'loading', 'timeout', 'delay'],
  ['error', 'bug', 'exception', 'crash', 'failure', 'failed'],
  ['user', 'account', 'profile'],
  ['server', 'backend', 'service']
];

// Build a lookup map once instead of scanning every group repeatedly.
const CONCEPT_MAP = new Map();

for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    CONCEPT_MAP.set(word, group);
  }
}

function normalizeWord(word) {
  let result = String(word).toLowerCase();

  if (result.length > 5 && result.endsWith('ies')) {
    result = result.slice(0, -3) + 'y';
  } else if (result.length > 5 && result.endsWith('ing')) {
    result = result.slice(0, -3);
  } else if (result.length > 4 && result.endsWith('ed')) {
    result = result.slice(0, -2);
  } else if (result.length > 4 && result.endsWith('es')) {
    result = result.slice(0, -2);
  } else if (result.length > 4 && result.endsWith('s')) {
    result = result.slice(0, -1);
  }

  return result;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
}

function getConcept(word) {
  return CONCEPT_MAP.get(word) || [word];
}

function calculateScore(queryWords, note) {
  const titleWords = new Set(
    tokenize(note.title).map(normalizeWord)
  );

  const contentWords = new Set(
    tokenize(note.content).map(normalizeWord)
  );

  let score = 0;
  const matchedTerms = [];

  for (const word of queryWords) {
    const concept = getConcept(word);

    const exactTitleMatch = titleWords.has(word);
    const exactContentMatch = contentWords.has(word);

    const synonymTitleMatch = concept.some(term =>
      titleWords.has(normalizeWord(term))
    );

    const synonymContentMatch = concept.some(term =>
      contentWords.has(normalizeWord(term))
    );

    if (exactTitleMatch) {
      score += 4;
      matchedTerms.push(word);
    } else if (exactContentMatch) {
      score += 2;
      matchedTerms.push(word);
    } else if (synonymTitleMatch) {
      score += 3;
      matchedTerms.push(word);
    } else if (synonymContentMatch) {
      score += 1;
      matchedTerms.push(word);
    }
  }

  if (matchedTerms.length >= 3) {
    score += 2;
  }

  return {
    score,
    matchedTerms: [...new Set(matchedTerms)]
  };
}

export function retrieveRelevantNotes(query, limit = 3) {
  const queryWords = [
    ...new Set(
      tokenize(query)
        .map(normalizeWord)
        .filter(word =>
          word.length > 1 &&
          !STOP_WORDS.has(word)
        )
    )
  ];

  if (!queryWords.length || !Array.isArray(knowledgeBase)) {
    return [];
  }

  const requestedLimit = Number(limit);

  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.max(0, Math.min(10, Math.floor(requestedLimit)))
    : 3;

  if (safeLimit === 0) {
    return [];
  }

  return knowledgeBase
    .filter(note =>
      note &&
      typeof note.title === 'string' &&
      typeof note.content === 'string'
    )
    .map(note => {
      const result = calculateScore(queryWords, note);

      return {
        ...note,
        score: result.score,
        matchedTerms: result.matchedTerms
      };
    })
    .filter(note => note.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      a.title.localeCompare(b.title)
    )
    .slice(0, safeLimit);
}
