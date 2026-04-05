/** Format a number as Indian Rupees — shortens to L (lakh) or Cr (crore) */
export const format_inr = (amount: number): string => {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)}L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
};

/** Format a 0–1 fraction as a percentage string */
export const format_percent = (rate: number): string =>
  `${(rate * 100).toFixed(1)}%`;

/** Average of non-zero values in an array */
export const avg_non_zero = (nums: number[]): number => {
  const non_zero = nums.filter((n) => n > 0);
  if (non_zero.length === 0) return 0;
  return non_zero.reduce((a, b) => a + b, 0) / non_zero.length;
};

/** Clamp a number between min and max */
export const clamp = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, val));
