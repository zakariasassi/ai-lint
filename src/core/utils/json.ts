export function extractFirstJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue with extraction mode.
  }

  const start = trimmed.indexOf("{");
  if (start === -1) {
    return undefined;
  }

  let depth = 0;
  for (let i = start; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const candidate = trimmed.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
}

