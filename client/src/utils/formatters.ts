/**
 * Formats a branch name so that each word is capitalized (first letter only caps),
 * while preserving appropriate casing for minor conjunctions/prepositions ('and', 'of', 'in', etc.).
 *
 * Example:
 * "INFORMATION TECHNOLOGY" -> "Information Technology"
 * "computer science and engineering" -> "Computer Science and Engineering"
 * "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE" -> "Artificial Intelligence and Data Science"
 */
export const formatBranchName = (branch: string | undefined | null): string => {
  if (!branch) return '';
  let trimmed = branch.trim();
  if (!trimmed) return '';

  // Deduplicate repeated halves (case-insensitive)
  const halfLen = Math.floor(trimmed.length / 2);
  if (halfLen > 0) {
    const firstHalf = trimmed.substring(0, halfLen).toLowerCase();
    const secondHalf = trimmed.substring(halfLen).toLowerCase();
    if (firstHalf === secondHalf) {
      trimmed = trimmed.substring(0, halfLen);
    }
  }

  const minorWords = new Set(['and', 'of', 'in', 'for', 'the', 'to', 'on', 'at', 'by', 'with', '&']);

  return trimmed
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (word === '&') return '&';
      if (word.startsWith('(') && word.endsWith(')')) {
        const inner = word.slice(1, -1);
        if (index > 0 && minorWords.has(inner)) {
          return `(${inner})`;
        }
        return `(${inner.charAt(0).toUpperCase() + inner.slice(1)})`;
      }
      if (index > 0 && minorWords.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
