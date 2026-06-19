import { decryptToken } from "./encryption";

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
  apiResponse?: string;
}

/**
 * Publishes SmmPost content to a connected SocialAccount (Facebook, Instagram, LinkedIn).
 * Currently simulates the external API request and returns detailed logs.
 */
export async function publishToSocialPlatform(
  post: { caption: string; hashtags?: string | null; mediaUrls: string[] },
  account: { platform: string; accountId: string; accountName: string; accessToken: string | null }
): Promise<PublishResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const decryptedToken = account.accessToken ? decryptToken(account.accessToken) : "";
  
  // Basic token check simulation
  if (decryptedToken.includes("expired") || account.accessToken === "EXPIRED") {
    return {
      success: false,
      errorMessage: `OAuth Token Expired: The credentials for ${account.accountName} on ${account.platform} have expired. Please reconnect in Connections.`,
      apiResponse: JSON.stringify({
        status: "error",
        code: 190,
        subcode: 463,
        message: "Session has expired at unix time or password changed.",
        platform: account.platform
      })
    };
  }

  // Random failure simulation (5% chance of network glitch for testing)
  if (Math.random() < 0.05) {
    return {
      success: false,
      errorMessage: `Failed to connect to ${account.platform} API endpoint. Gateway timeout.`,
      apiResponse: JSON.stringify({
        status: "timeout",
        code: 504,
        message: "Gateway Timeout"
      })
    };
  }

  // Simulated successful post payloads
  const externalPostId = `${account.platform.toLowerCase().slice(0, 2)}_${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const apiResponse = {
    status: "success",
    id: externalPostId,
    timestamp: new Date().toISOString(),
    account: {
      id: account.accountId,
      name: account.accountName,
      platform: account.platform
    },
    payload: {
      message: `${post.caption} ${post.hashtags || ""}`.trim(),
      media_count: post.mediaUrls.length,
      media_urls: post.mediaUrls
    }
  };

  return {
    success: true,
    externalPostId,
    apiResponse: JSON.stringify(apiResponse, null, 2)
  };
}
