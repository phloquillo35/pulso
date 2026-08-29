import type { Platform } from "@/lib/types";
import type { SocialConnector } from "@/lib/connectors/types";
import { MockConnector } from "@/lib/connectors/mock";
import { InstagramConnector } from "@/lib/connectors/instagram";
import { BlueskyConnector } from "@/lib/connectors/bluesky";

// Returns the right connector per platform. Real connectors fall back to
// MockConnector internally when not configured, so the app is always live.
export function getConnector(platform: Platform): SocialConnector {
  switch (platform) {
    case "instagram":
      return new InstagramConnector();
    case "bluesky":
      return new BlueskyConnector();
    default:
      return new MockConnector(platform);
  }
}
