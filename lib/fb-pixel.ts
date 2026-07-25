export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const cookies = document.cookie.split(";");
  let fbp: string | undefined;
  let fbc: string | undefined;

  for (const cookie of cookies) {
    const [name, val] = cookie.trim().split("=");
    if (name === "_fbp") fbp = val;
    if (name === "_fbc") fbc = val;
  }

  return { fbp, fbc };
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

  const cookies = getMetaCookies();
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
