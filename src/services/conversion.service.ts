import axios from "axios";
import cache from "./cache.service";
import { BtcPriceData } from "../types/btc_price_data";

export const fetch_btc_btc_price_brl = async (): Promise<BtcPriceData> => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: { ids: "bitcoin", vs_currencies: "brl" },
      }
    );
    const btc_btc_price_brl = response.data.bitcoin?.brl;
    if (!btc_btc_price_brl) {
      throw new Error("BTC price not found in response.");
    }
    return { btc_price_brl: btc_btc_price_brl, last_updated: Date.now() };
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    throw error;
  }
};

export const get_btc_price_data = async (): Promise<BtcPriceData> => {
  let cached_price_data = cache.get<BtcPriceData>("btc_price_data");
  if (cached_price_data !== undefined) {
    console.log("Using cached BTC price data.");
    return cached_price_data;
  }
  const fetched_price_data = await fetch_btc_btc_price_brl();
  cache.set("btc_price_data", fetched_price_data);
  console.log(
    "Fetched new BTC price data and updated cache:",
    fetched_price_data
  );
  return fetched_price_data;
};

export const convert_brl_to_sats = (
  amount_brl_decimal: number,
  btc_btc_price_brl: number
): number => {
  const sats = (amount_brl_decimal / btc_btc_price_brl) * 100_000_000;
  return Math.floor(sats);
};
