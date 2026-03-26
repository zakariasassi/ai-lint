export function chunkText(content: string, chunkSizeChars: number): string[] {
  if (content.length <= chunkSizeChars || chunkSizeChars <= 0) {
    return [content];
  }

  const chunks: string[] = [];

  for (let start = 0; start < content.length; start += chunkSizeChars) {
    chunks.push(content.slice(start, start + chunkSizeChars));
  }

  return chunks;
}
