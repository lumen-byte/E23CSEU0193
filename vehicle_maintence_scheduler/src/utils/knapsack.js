import { Log } from '../../../logging_middleware/src/logger.js';

/**
 * 0/1 Knapsack using bottom-up DP.
 * Returns the selected subset that maximizes total impact within capacity.
 */
export function knapsack(capacity, items) {
  const n = items.length;

  if (n === 0 || capacity <= 0) {
    Log('backend', 'warn', 'utils', `Knapsack called with empty inputs — n=${n}, capacity=${capacity}`);
    return [];
  }

  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const dur = Math.floor(items[i - 1].Duration);
    const imp = items[i - 1].Impact;

    for (let w = 0; w <= capacity; w++) {
      if (dur <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - dur] + imp);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // backtrack to find selected items
  const selected = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(items[i - 1]);
      w -= Math.floor(items[i - 1].Duration);
    }
  }

  return selected;
}
