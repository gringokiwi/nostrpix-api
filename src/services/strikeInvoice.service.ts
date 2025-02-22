// src/services/strikeInvoice.service.ts

import fetch from "node-fetch";

export interface StrikeInvoiceOptions {
  correlationId: string;
  description: string;
  amount: {
    currency: string;
    amount: string;
  };
}

export interface StrikeInvoiceResponse {
  invoiceId: string;
  amount: {
    amount: string;
    currency: string;
  };
  state: string;
  created: string;
  correlationId: string;
  description: string;
  issuerId: string;
  receiverId: string;
  // Additional fields may be present…
}

const API_KEY = process.env.STRIKE_API_KEY;
if (!API_KEY) {
  throw new Error("Strike API key not defined in environment variables");
}
console.log("STRIKE_API_KEY:", process.env.STRIKE_API_KEY);
const STRIKE_API_URL = "https://api.strike.me/v1/invoices"; // Use 'https://api.strike.me' in production
//const API_KEY = "YOUR_STRIKE_API_KEY_HERE"; // Replace with your Strike API key

export const createStrikeInvoice = async (
  options: StrikeInvoiceOptions
): Promise<StrikeInvoiceResponse> => {
  const response = await fetch(STRIKE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Strike invoice creation failed: ${errorText}`);
  }

  const data = (await response.json()) as StrikeInvoiceResponse;
  return data;
};
