import { proxy, config as proxyConfig } from "./proxy";

export default proxy;
export { proxy as middleware };
export const config = proxyConfig;
