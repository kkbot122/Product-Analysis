// src/lib/analytics-sdk.ts

type InitOptions = {
  endpoint?: string;
  debug?: boolean;
};

type AnalyticsState = {
  initialized: boolean;
  apiKey: string | null;
  endpoint: string | null;
  debug: boolean;
  currentUserId: string | null;
  anonymousId: string | null;
};

const state: AnalyticsState = {
  initialized: false,
  apiKey: null,
  endpoint: null,
  debug: false,
  currentUserId: null,
  anonymousId: null,
};

const ANON_KEY = "analytics_anonymous_id";
const USER_KEY = "analytics_user_id";

function isBrowser() {
  return typeof window !== "undefined";
}

function logDebug(...args: unknown[]) {
  if (state.debug && isBrowser()) {
    // eslint-disable-next-line no-console
    console.log("[Analytics SDK]", ...args);
  }
}

function getAnonymousId(): string | null {
  if (!isBrowser()) return null;

  if (state.anonymousId) return state.anonymousId;

  let anon = window.localStorage.getItem(ANON_KEY);
  if (!anon) {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      anon = (crypto as any).randomUUID();
    } else {
      anon = Math.random().toString(36).slice(2);
    }
    window.localStorage.setItem(ANON_KEY, anon as string);
  }

  state.anonymousId = anon;
  return anon;
}

/**
 * Initialize the analytics SDK.
 */
export function init(apiKey: string, options?: InitOptions) {
  if (!apiKey) {
    throw new Error("Analytics init: apiKey is required");
  }

  state.apiKey = apiKey;
  state.debug = options?.debug ?? false;

  if (isBrowser()) {
    const defaultEndpoint = `${window.location.origin}/api/events`;
    state.endpoint = options?.endpoint ?? defaultEndpoint;

    // Restore previously identified user if any
    const storedUser = window.localStorage.getItem(USER_KEY);
    if (storedUser) {
      state.currentUserId = storedUser;
    }
  } else {
    state.endpoint = options?.endpoint ?? null;
  }

  state.initialized = true;
  logDebug("Initialized", { endpoint: state.endpoint });
}

/**
 * Identify the current user.
 * All subsequent events will be associated with this user.
 */
export function identify(userId: string) {
  if (!state.initialized) {
    logDebug("identify() called before init() – ignoring");
    return;
  }

  if (!userId) {
    logDebug("identify() called with empty userId – ignoring");
    return;
  }

  state.currentUserId = userId;

  if (isBrowser()) {
    window.localStorage.setItem(USER_KEY, userId);
  }

  logDebug("Identified user", userId);
}

/**
 * Track an event.
 */
export async function track(
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!state.initialized) {
    logDebug("track() called before init() – ignoring");
    return;
  }

  if (!eventName) {
    logDebug("track() called without eventName – ignoring");
    return;
  }

  if (!isBrowser()) {
    // Do not attempt network calls on the server
    return;
  }

  const apiKey = state.apiKey;
  const endpoint = state.endpoint;

  if (!apiKey || !endpoint) {
    logDebug("track() missing apiKey or endpoint – ignoring");
    return;
  }

  const userId =
    state.currentUserId || getAnonymousId() || "anonymous";

  const payload = {
    api_key: apiKey,
    user_id: userId,
    event_name: eventName,
    properties: properties ?? {},
    timestamp: new Date().toISOString(),
  };

  try {
    logDebug("Sending event", payload);

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    logDebug("Failed to send event", err);
    // Do not throw – SDK must never break the host app
  }
}
