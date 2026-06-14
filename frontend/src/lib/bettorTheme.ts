const themes = [
  { text: "text-blue-300", bar: "bg-blue-500" },
  { text: "text-red-300", bar: "bg-red-500" },
  { text: "text-emerald-300", bar: "bg-emerald-500" },
  { text: "text-amber-300", bar: "bg-amber-500" },
  { text: "text-violet-300", bar: "bg-violet-500" },
];

function hashName(value: string): number {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export function getBettorTheme(name: string) {
  return themes[hashName(name) % themes.length];
}
