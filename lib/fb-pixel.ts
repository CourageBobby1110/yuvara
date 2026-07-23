export function trackFBEvent(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  try {
    if (params) {
      window.fbq("track", eventName, params);
    } else {
      window.fbq("track", eventName);
    }
  } catch (e) {
    console.error("[FB Pixel] Event tracking error:", e);
  }
}

export function trackFBCustom(
  eventName: string,
  params?: Record<string, any>
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  try {
    if (params) {
      window.fbq("trackCustom", eventName, params);
    } else {
      window.fbq("trackCustom", eventName);
    }
  } catch (e) {
    console.error("[FB Pixel] Custom event tracking error:", e);
  }
}
