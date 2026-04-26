export const escapeInline = (value: string): string =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("*", "\\*")
    .replaceAll("_", "\\_");

export const escapeTableCell = (value: string): string =>
  value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replaceAll("\n", " ");

export const escapeLinkDestination = (value: string): string => {
  if (value.length === 0) {
    return "";
  }

  if (/[\s()<>]/.test(value)) {
    return `<${value.replaceAll("\\", "\\\\").replaceAll("<", "\\<").replaceAll(">", "\\>")}>`;
  }

  return value.replaceAll("\\", "\\\\").replaceAll(")", "\\)");
};

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const inlineCode = (value: string): string => {
  if (!value.includes("`")) {
    return `\`${value}\``;
  }

  const fence = "`".repeat(longestBacktickRun(value) + 1);
  return `${fence} ${value} ${fence}`;
};

export const codeFence = (value: string, language?: string): string => {
  const fence = "`".repeat(Math.max(3, longestBacktickRun(value) + 1));
  const info = language === undefined || language.length === 0 ? "" : language;
  return `${fence}${info}\n${value.replace(/\n$/, "")}\n${fence}`;
};

const longestBacktickRun = (value: string): number => {
  let longest = 0;
  let current = 0;

  for (const character of value) {
    if (character === "`") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
};
