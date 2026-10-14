/** Hook die de tarieven uit de databank leest, met de code als vangnet. */
import { useQuery } from "@tanstack/react-query";
import { fetchPricing } from "./pricing.functions";
import { PRICING_DEFAULTS, priceOf, type PricingMap } from "./pricing";

export function usePricing(): { prices: PricingMap; price: (key: string, fallback?: number) => number } {
  const { data } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => fetchPricing(),
    staleTime: 5 * 60 * 1000,
  });
  const prices = data ?? PRICING_DEFAULTS;
  return { prices, price: (key, fallback) => priceOf(prices, key, fallback) };
}
