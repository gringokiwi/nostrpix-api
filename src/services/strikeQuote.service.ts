// src/services/strikeQuote.service.ts

import fetch from "node-fetch";

export interface StrikeQuoteResponse {
  quoteId: string;
  lnInvoice: string; // The Lightning invoice (Bolt11 string)
  // Other fields that Strike returns, e.g., expiration, conversion rates, etc.
}

/**
 * Calls Strike's quote generation endpoint for a given invoiceId.
 * @param invoiceId The invoice ID from the initial invoice creation.
 * @returns The response from Strike, including the Bolt11 Lightning invoice.
 */
export const createStrikeQuote = async (
  invoiceId: string
): Promise<StrikeQuoteResponse> => {
  const apiUrl = `https://api.strike.me/v1/invoices/${invoiceId}/quote`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
    },
    // The quote endpoint may not require a request body; adjust if needed.
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Strike quote generation failed: ${errorText}`);
  }

  const data = await response.json();
  return data as StrikeQuoteResponse;
};
