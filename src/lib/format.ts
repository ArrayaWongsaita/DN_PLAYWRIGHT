export function formatBaht(n: number): string {
  return `${n.toLocaleString("en-US")} บาท`;
}

export function formatOrderId(n: number): string {
  return `DN-${String(n).padStart(4, "0")}`;
}
