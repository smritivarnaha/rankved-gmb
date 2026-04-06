import { Post as PrismaPost } from "@prisma/client";

export class GBPApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "GBPApiError";
    this.status = status;
    this.body = body;
  }
}

export class GBPApiService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchAPI(url: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
    const maxRetries = 4;
    const baseWaitTime = 2000; // 2 seconds

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limit hit, apply exponential backoff
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseWaitTime * Math.pow(2, retryCount);
        
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.fetchAPI(url, options, retryCount + 1);
      }

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        throw new GBPApiError(`GBP API Error: ${response.statusText}`, response.status, errorBody);
      }

      // Check if response has content before parsing
      const contentLength = response.headers.get("content-length");
      if (contentLength === "0" || response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof GBPApiError) throw error;
      throw new Error(`Failed to call GBP API: ${(error as Error).message}`);
    }
  }

  /**
   * Fetches all accounts accessible by the authenticated user
   */
  async listAccounts(): Promise<any[]> {
    // Note: The new My Business Account Management API uses v1
    const data = await this.fetchAPI("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
    return data.accounts || [];
  }

  /**
   * Fetches all locations for a specific account
   */
  async listLocations(accountId: string): Promise<any[]> {
    // Note: The Business Information API uses v1
    // Pass readMask to specify the fields to return (minimizing payload)
    const name = accountId.includes("accounts/") ? accountId : `accounts/${accountId}`;
    const data = await this.fetchAPI(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${name}/locations?readMask=name,title,storefrontAddress,regularHours,phoneNumbers,categories`
    );
    return data.locations || [];
  }

  /**
   * Creates a local post for a location
   */
  async createPost(accountId: string, locationId: string, postParams: any): Promise<any> {
    // Local Posts still primarily use v4
    const acctStr = accountId.includes("accounts/") ? accountId : `accounts/${accountId}`;
    const locStr = locationId.includes("locations/") ? locationId.split("/")[1] : locationId;
    
    // Construct the payload according to Google API spec
    const payload = this.mapPrismaPostToGBPFormat(postParams);

    const data = await this.fetchAPI(
      `https://mybusiness.googleapis.com/v4/${acctStr}/locations/${locStr}/localPosts`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    
    return data;
  }

  /**
   * Transforms our generic post params into the specific shape expected by GBP API
   */
  private mapPrismaPostToGBPFormat(post: any): any {
    const payload: any = {
      languageCode: "en-US",
      summary: post.summary,
      topicType: post.topicType || "STANDARD",
    };

    // Add CTA if provided
    if (post.ctaType && post.ctaUrl) {
      payload.callToAction = {
        actionType: post.ctaType,
        url: post.ctaUrl,
      };
    }

    // Add media if provided
    if (post.mediaUrl) {
      payload.media = [
        {
          mediaFormat: post.mediaType === "VIDEO" ? "VIDEO" : "PHOTO",
          sourceUrl: post.mediaUrl,
        },
      ];
    }

    // Add Event specific fields
    if (post.topicType === "EVENT" && post.eventTitle) {
      payload.event = {
        title: post.eventTitle,
        schedule: {
          startDate: this.formatGBPEntrDate(post.eventStartDate),
          startTime: this.formatGBPTime(post.eventStartDate),
          endDate: this.formatGBPEntrDate(post.eventEndDate),
          endTime: this.formatGBPTime(post.eventEndDate),
        },
      };
    }

    // Add Offer specific fields
    if (post.topicType === "OFFER" && post.offerCouponCode) {
      payload.offer = {
        couponCode: post.offerCouponCode,
        redeemOnlineUrl: post.offerRedeemUrl,
        termsConditions: post.offerTerms,
      };
    }

    return payload;
  }

  private formatGBPEntrDate(dateStr?: string | Date): any {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }

  private formatGBPTime(dateStr?: string | Date): any {
    if (!dateStr) return undefined;
    const d = new Date(dateStr);
    return {
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes(),
      seconds: 0,
      nanos: 0,
    };
  }
}
