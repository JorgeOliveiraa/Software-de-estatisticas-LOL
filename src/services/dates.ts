/**
 * Datas das partidas.
 * No banco: texto "AAAA-MM-DD" (fica ordenável).
 * Na tela: "DD/MM/AAAA".
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toIsoDate(d);
}

/** "2026-10-23" -> "23/10/2026" */
export function isoToBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Vai colocando as barras enquanto o usuário digita: "23102026" -> "23/10/2026" */
export function maskBrDate(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "23/10/2026" -> "2026-10-23". Devolve null se a data não existir. */
export function brToIso(text: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (year < 2009) return null; // o LoL nasceu em 2009
  const d = new Date(year, month - 1, day);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}
