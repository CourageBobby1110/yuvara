interface Window {
  fbq?: (
    action: string,
    eventName: string,
    params?: Record<string, any>,
    options?: { eventID?: string }
  ) => void;
}
