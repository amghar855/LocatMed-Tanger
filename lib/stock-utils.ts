export type StockStatus = "available" | "low_stock" | "out_of_stock";

export function calcStatus(quantity: number, minThreshold: number): StockStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= minThreshold) return "low_stock";
  return "available";
}
