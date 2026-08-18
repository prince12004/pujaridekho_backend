export interface PriceablePackage {
  price: number;
  cityPrices?: { city: string; price: number }[] | null;
}

/** The price for a pooja package in a given city — the package's own
 * `cityPrices` override wins when the customer's city matches (case-
 * insensitively), otherwise it falls back to the package's base price. */
export function resolvePackagePrice(pkg: PriceablePackage, city?: string | null): number {
  if (!city) return pkg.price;
  const override = pkg.cityPrices?.find((cp) => cp.city.trim().toLowerCase() === city.trim().toLowerCase());
  return override?.price ?? pkg.price;
}
