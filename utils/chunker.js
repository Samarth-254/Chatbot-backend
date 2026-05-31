const chunkText = (text, chunkSize = 500, overlap = 80) => {
  if (!text || typeof text !== 'string') return [];

  const clean = text.replace(/\r\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  if (clean.length === 0) return [];

  const chunks = [];
  let start = 0;
  const step = chunkSize - overlap; n

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end >= clean.length) {
      chunks.push(clean.slice(start).trim());
      break;
    }
    let boundary = clean.lastIndexOf(' ', end);
    if (boundary <= start + Math.floor(chunkSize * 0.5)) {
      boundary = end;
    }

    const chunk = clean.slice(start, boundary).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    start += step;
    if (step <= 0) break;
  }

  return chunks;
};

module.exports = { chunkText };
