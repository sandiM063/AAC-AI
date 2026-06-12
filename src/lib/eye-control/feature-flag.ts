/**
 * Master switch for eye navigation in the live app.
 * Set to `true` when re-enabling the feature — all implementation code stays in the repo.
 */
export const EYE_CONTROL_FEATURE_ENABLED = false;

export function isEyeControlFeatureEnabled(): boolean {
  return EYE_CONTROL_FEATURE_ENABLED;
}
