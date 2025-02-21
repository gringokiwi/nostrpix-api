// src/services/conversion.service.ts
import axios from "axios";
import cache from "./cache.service";
import { BTCPriceData } from "../types/BTCPriceData";

// Function to fetch Bitcoin price in BRL from CoinGecko
export const fetchBTCPriceInBRL = async (): Promise<BTCPriceData> => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: { ids: "bitcoin", vs_currencies: "brl" },
      }
    );
    const btcPrice = response.data.bitcoin?.brl;
    if (!btcPrice) {
      throw new Error("BTC price not found in response.");
    }
    return { price: btcPrice, lastUpdated: Date.now() };
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    throw error;
  }
};

// Function to get BTC price data with caching
export const getBTCPriceData = async (): Promise<BTCPriceData> => {
  let cachedData = cache.get<BTCPriceData>("btcPriceData");
  if (cachedData !== undefined) {
    console.log("Using cached BTC price data.");
    return cachedData;
  }
  const priceData = await fetchBTCPriceInBRL();
  cache.set("btcPriceData", priceData);
  console.log("Fetched new BTC price data and updated cache:", priceData);
  return priceData;
};

// Function to convert BRL to satoshis (1 BTC = 100,000,000 satoshis)
export const convertBRLToSats = (
  brlAmount: number,
  btcPrice: number
): number => {
  const sats = (brlAmount / btcPrice) * 100_000_000;
  return Math.floor(sats);
};
