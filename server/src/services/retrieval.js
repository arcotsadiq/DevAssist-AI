import { knowledgeBase } from '../data/knowledgeBase.js';

const terms = text => String(text).toLowerCase().match(/[a-z0-9]+/g) || [];

export function retrieveRelevantNotes(query, limit = 3) {
  const queryTerms = new Set(terms(query));
  return knowledgeBase
    .map(note => {
      const noteTerms = new Set(terms(`${note.title} ${note.content}`));
      const score = [...queryTerms].reduce((total, term) => total + (noteTerms.has(term) ? 1 : 0), 0);
      return { ...note, score };
    })
    .filter(note => note.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
