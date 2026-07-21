export function trackFBEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
}

export function trackFBCustom(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  if (params) {
    window.fbq("trackCustom", eventName, params);
  } else {
    window.fbq("trackCustom", eventName);
  }
}
