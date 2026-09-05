export function format(value: number | null, fraction = 1): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(fraction);
}
