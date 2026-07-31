"use client";

export type RewardHubLockState = {
  locked: boolean;
  lockedAt: number | null;
  backgroundAt: number | null;
};

const LOCK_STATE_KEY =
  "rewardhub_lock";

const DEFAULT_STATE: RewardHubLockState = {
  locked: false,
  lockedAt: null,
  backgroundAt: null,
};

function isBrowser() {
  return (
    typeof window !==
    "undefined"
  );
}

export function getRewardHubLockState():
  RewardHubLockState {
  if (!isBrowser()) {
    return DEFAULT_STATE;
  }

  try {
    const raw =
      localStorage.getItem(
        LOCK_STATE_KEY
      );

    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed =
      JSON.parse(
        raw
      ) as Partial<RewardHubLockState>;

    return {
      locked:
        Boolean(
          parsed.locked
        ),
      lockedAt:
        typeof parsed.lockedAt ===
        "number"
          ? parsed.lockedAt
          : null,
      backgroundAt:
        typeof parsed.backgroundAt ===
        "number"
          ? parsed.backgroundAt
          : null,
    };
  } catch {
    localStorage.removeItem(
      LOCK_STATE_KEY
    );

    return DEFAULT_STATE;
  }
}

export function saveRewardHubLockState(
  state: RewardHubLockState
) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    LOCK_STATE_KEY,
    JSON.stringify(state)
  );
}

export function markRewardHubBackgrounded() {
  const current =
    getRewardHubLockState();

  saveRewardHubLockState({
    ...current,
    backgroundAt:
      Date.now(),
  });
}

export function lockRewardHub() {
  const now =
    Date.now();

  saveRewardHubLockState({
    locked:
      true,
    lockedAt:
      now,
    backgroundAt:
      now,
  });
}

export function unlockRewardHub() {
  saveRewardHubLockState({
    locked:
      false,
    lockedAt:
      null,
    backgroundAt:
      null,
  });
}

export function clearRewardHubLock() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(
    LOCK_STATE_KEY
  );
}