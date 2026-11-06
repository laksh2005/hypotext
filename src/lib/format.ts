export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function num(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function ago(time: number): string {
  const s = Math.max(0, (Date.now() - time) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ratio(big: number, small: number): string {
  if (!small) return "–";
  const r = big / small;
  return r >= 10 ? `${Math.round(r)}x` : `${r.toFixed(1)}x`;
}
