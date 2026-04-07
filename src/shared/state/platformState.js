export const PLATFORM_STATE_KEY = 'ir.platform.state';

const defaultState = {
  dataset: 'none',
  importCompleted: false,
  indexBuilt: false,
  relevanceAvailable: false,
};

export function getPlatformState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLATFORM_STATE_KEY) || '{}');
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

export function setPlatformState(nextPartial) {
  const next = { ...getPlatformState(), ...nextPartial };
  localStorage.setItem(PLATFORM_STATE_KEY, JSON.stringify(next));
  return next;
}
