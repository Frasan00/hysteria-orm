import { WebPlatformAdapter } from "./web_platform";

/**
 * React Native: no window/document and no global crypto. Only the registry key
 * differs from web — fs inherits the throwing web fs (env.ts swallows it),
 * timing and path inherit the web-standard implementations.
 */
export class ReactNativePlatformAdapter extends WebPlatformAdapter {
  readonly name = "react-native" as const;
}
