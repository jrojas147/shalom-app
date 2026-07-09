const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formatea un valor numérico como peso colombiano sin decimales. */
export function formatCurrencyCo(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return '';
  }
  return currencyFormatter.format(value);
}

/** Extrae el valor numérico entero de un texto con formato de moneda. */
export function parseCurrencyCo(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Posiciona el cursor tras formatear en vivo según cuántos dígitos había antes. */
export function resolveCurrencyCoCursor(
  formatted: string,
  digitsBeforeCursor: number
): number {
  if (!formatted) {
    return 0;
  }
  if (digitsBeforeCursor <= 0) {
    const firstDigit = formatted.search(/\d/);
    return firstDigit >= 0 ? firstDigit : formatted.length;
  }

  let digitsSeen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitsSeen++;
      if (digitsSeen >= digitsBeforeCursor) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}
