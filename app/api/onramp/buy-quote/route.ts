import {
  type FetchBuyQuote,
  type OnrampBuyQuoteSnakeCaseResponse,
} from "@coinbase/cdp-react";
import { NextRequest, NextResponse } from "next/server";

import { generateCDPJWT, getCDPCredentials, ONRAMP_API_BASE_URL } from "@/lib/cdp-auth";
import { convertSnakeToCamelCase } from "@/lib/to-camel-case";

type OnrampBuyQuoteRequest = Parameters<FetchBuyQuote>[0];
type OnrampBuyQuoteResponseRaw = OnrampBuyQuoteSnakeCaseResponse;
type OnrampBuyQuoteResponse = Awaited<ReturnType<FetchBuyQuote>>;

/**
 * Creates a buy quote for onramp purchase
 *
 * @param request - Buy quote request parameters
 * @returns Buy quote with fees and onramp URL
 */
export async function POST(request: NextRequest) {
  try {
    const body: OnrampBuyQuoteRequest = await request.json();

    // Validate CDP credentials are configured
    try {
      getCDPCredentials();
    } catch (_error) {
      return NextResponse.json({ error: "CDP API credentials not configured" }, { status: 500 });
    }

    // Validate required fields

    // Note we don't require the wallet info because this endpoint is used to get an exchange rate. Only the onramp URL requires the wallet info.

    if (
      !body.purchaseCurrency ||
      !body.paymentAmount ||
      !body.paymentCurrency ||
      !body.paymentMethod ||
      !body.country
    ) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Validate US subdivision requirement
    if (body.country === "US" && !body.subdivision) {
      return NextResponse.json({ error: "State/subdivision is required for US" }, { status: 400 });
    }

    // Generate JWT for CDP API authentication
    const jwt = await generateCDPJWT({
      requestMethod: "POST",
      requestHost: new URL(ONRAMP_API_BASE_URL).hostname,
      requestPath: "/onramp/v1/buy/quote",
    });

    // Prepare request body for buy quote API
    const requestBody = {
      purchaseCurrency: body.purchaseCurrency,
      purchaseNetwork: body.purchaseNetwork, // Use the wallet's network
      paymentAmount: body.paymentAmount,
      paymentCurrency: body.paymentCurrency,
      paymentMethod: body.paymentMethod,
      country: body.country,
      subdivision: body.subdivision,
      destinationAddress: body.destinationAddress, // Include to get one-click-buy URL
    };

    // Call CDP Onramp API to get buy quote and URL
    const response = await fetch(`${ONRAMP_API_BASE_URL}/onramp/v1/buy/quote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("CDP API error:", response.statusText);
      const errorText = await response.text();
      console.error("Error details:", errorText);

      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorData.message || "Failed to create buy quote" },
          { status: response.status },
        );
      } catch {
        return NextResponse.json(
          { error: "Failed to create buy quote" },
          { status: response.status },
        );
      }
    }

    // convert response data to camelCase until migration to API v2 which will return camelCase data
    const data: OnrampBuyQuoteResponseRaw = await response.json();
    const dataCamelCase: OnrampBuyQuoteResponse = convertSnakeToCamelCase(data);
    return NextResponse.json(dataCamelCase);
  } catch (error) {
    console.error("Error creating buy quote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
