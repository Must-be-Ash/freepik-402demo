import {
  type FetchBuyOptions,
  type OnrampBuyOptionsSnakeCaseResponse,
} from "@coinbase/cdp-react";
import { NextRequest, NextResponse } from "next/server";

import { generateCDPJWT, getCDPCredentials, ONRAMP_API_BASE_URL } from "@/lib/cdp-auth";
import { convertSnakeToCamelCase } from "@/lib/to-camel-case";

type OnrampBuyOptionsResponseRaw = OnrampBuyOptionsSnakeCaseResponse;
type OnrampBuyOptionsResponse = Awaited<ReturnType<FetchBuyOptions>>;

/**
 * Fetches available buy options (payment currencies and purchasable assets) for onramp
 *
 * @param request - NextRequest object
 * @returns NextResponse object
 */
export async function GET(request: NextRequest) {
  try {
    // Validate CDP credentials are configured
    try {
      getCDPCredentials();
    } catch (_error) {
      return NextResponse.json({ error: "CDP API credentials not configured" }, { status: 500 });
    }

    /**
     * Extract query parameters
     * Note: While the API documentation shows all parameters as optional,
     * the backend currently requires the 'country' parameter
     */
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const subdivision = searchParams.get("subdivision");
    const networks = searchParams.get("networks");

    // Build query string
    const queryParams = new URLSearchParams();
    if (country) queryParams.append("country", country);
    if (subdivision) queryParams.append("subdivision", subdivision);
    if (networks) queryParams.append("networks", networks);

    const queryString = queryParams.toString();
    const apiPath = "/onramp/v1/buy/options";
    const fullPath = apiPath + (queryString ? `?${queryString}` : "");

    // Generate JWT for CDP API authentication
    const jwt = await generateCDPJWT({
      requestMethod: "GET",
      requestHost: new URL(ONRAMP_API_BASE_URL).hostname,
      requestPath: apiPath,
    });

    // Call CDP API to get buy options
    const response = await fetch(`${ONRAMP_API_BASE_URL}${fullPath}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("CDP API error:", response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);

      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorData.message || "Failed to fetch buy options" },
          { status: response.status },
        );
      } catch {
        return NextResponse.json(
          { error: "Failed to fetch buy options" },
          { status: response.status },
        );
      }
    }

    const data: OnrampBuyOptionsResponseRaw = await response.json();
    const dataCamelCase: OnrampBuyOptionsResponse = convertSnakeToCamelCase(data);
    return NextResponse.json(dataCamelCase);
  } catch (error) {
    console.error("Error fetching buy options:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
