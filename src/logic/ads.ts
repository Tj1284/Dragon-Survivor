/** States a Bridge rewarded ad goes through: loading, opened, rewarded, closed, failed. */
export type AdOutcome = 'rewarded' | 'declined' | 'pending';

/**
 * Whether a rewarded ad paid out, from the states seen so far. The reward is only granted when the
 * `rewarded` state was reached; an ad closed early or failed gives nothing (Playgama 2.2.5).
 */
export function rewardedResult(states: readonly string[]): AdOutcome {
  const last = states[states.length - 1];
  if (last !== 'closed' && last !== 'failed') return 'pending';
  return states.includes('rewarded') ? 'rewarded' : 'declined';
}
