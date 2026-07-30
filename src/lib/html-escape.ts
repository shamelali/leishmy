const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const escapeRegex = /[&<>"']/g;

export function escapeHtml(str: string): string {
  return str.replace(escapeRegex, (char) => escapeMap[char]);
}
