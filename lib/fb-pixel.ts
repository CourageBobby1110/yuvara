export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initializes and retrieves Meta _fbc and _fbp cookies according to
 * Meta Parameter Builder Library best practices.
 * - Extracts fbclid from URL if present and sets _fbc cookie preserving case.
 * - Generates _fbp cookie if not present.
 */
export function initMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }

  try {
    const cookies = document.cookie.split(";");
    let fbp: string | undefined;
    let fbc: string | undefined;

    for (const cookie of cookies) {
      const [name, val] = cookie.trim().split("=");
      if (name === "_fbp" && val) fbp = val;
      if (name === "_fbc" && val) fbc = val;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");

    // 1. Capture _fbc cookie from fbclid URL parameter if available
    if (fbclid) {
      const creationTime = Date.now();
      const newFbc = `fb.1.${creationTime}.${fbclid}`;
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `_fbc=${newFbc}; expires=${expires}; path=/; SameSite=Lax`;
      fbc = newFbc;
    }

    // 2. Capture or generate _fbp cookie if missing
    if (!fbp) {
      const creationTime = Date.now();
      const randomNumber = Math.floor(Math.random() * 2147483647);
      const newFbp = `fb.1.${creationTime}.${randomNumber}`;
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `_fbp=${newFbp}; expires=${expires}; path=/; SameSite=Lax`;
      fbp = newFbp;
    }

    return { fbp, fbc };
  } catch (e) {
    console.error("[Meta Parameter Builder Cookie Error]", e);
    return {};
  }
}

export function getMetaCookies(): { fbp?: string; fbc?: string } {
  return initMetaCookies();
}

export interface UserDataParams {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  userId?: string;
  fbp?: string;
  fbc?: string;
}

export function sendMetaCapiEvent(
  eventName: string,
  eventId: string,
  params?: Record<string, any>,
  userData?: UserDataParams
) {
  if (typeof window === "undefined") return;

  const cookies = initMetaCookies();
  const mergedUserData: UserDataParams = {
    fbp: cookies.fbp,
    fbc: cookies.fbc,
    ...userData,
  };

  fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      customData: params || {},
      userData: mergedUserData,
    }),
  }).catch((err) => {
    console.error("[Meta CAPI Fetch Error]", err);
  });
}

export function trackFBEvent(
  eventName: string,
  params?: Record<string, any>,
  userData?: UserDataParams,
  providedEventId?: string
): string {
  const eventId = providedEventId || generateEventId();

  // 1. Browser Pixel tracking
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (params) {
        window.fbq("track", eventName, params, { eventID: eventId });
      } else {
        window.fbq("track", eventName, {}, { eventID: eventId });
      }
    } catch (e) {
      console.error("[FB Pixel] Event tracking error:", e);
    }
  }

  // 2. Server-side Conversions API (CAPI) tracking
  sendMetaCapiEvent(eventName, eventId, params, userData);

  return eventId;
}

export function trackFBCustom(
  eventName: string,
  params?: Record<string, any>,
  userData?: UserDataParams,
  providedEventId?: string
): string {
  const eventId = providedEventId || generateEventId();

  // 1. Browser Pixel tracking
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      if (params) {
        window.fbq("trackCustom", eventName, params, { eventID: eventId });
      } else {
        window.fbq("trackCustom", eventName, {}, { eventID: eventId });
      }
    } catch (e) {
      console.error("[FB Pixel] Custom event tracking error:", e);
    }
  }

  // 2. Server-side Conversions API (CAPI) tracking
  sendMetaCapiEvent(eventName, eventId, params, userData);

  return eventId;
}
