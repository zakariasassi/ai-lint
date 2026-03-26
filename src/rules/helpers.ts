export function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

export function collectRegexMatches(
  content: string,
  regex: RegExp,
): Array<{ index: number; value: string; line: number }> {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  const safeRegex = new RegExp(regex.source, flags);
  const output: Array<{ index: number; value: string; line: number }> = [];

  let match: RegExpExecArray | null = safeRegex.exec(content);
  while (match) {
    const index = match.index ?? 0;
    output.push({
      index,
      value: match[0],
      line: getLineNumber(content, index),
    });
    match = safeRegex.exec(content);
  }

  return output;
}

