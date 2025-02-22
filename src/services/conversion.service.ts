import axios from "axios";
import cache from "./cache.service";
import { BtcPriceData } from "../types/btc-price-data";
import { CustomError } from "./error.service";

export const fetch_btc_price_brl = async (): Promise<BtcPriceData> => {
  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price",
    {
      params: { ids: "bitcoin", vs_currencies: "brl" },
    }
  );
  const btc_price_brl = response.data.bitcoin?.brl;
  if (!btc_price_brl) {
    throw new CustomError("Could not fetch BTC price", {}, response.data);
  }
  return { btc_price_brl, last_updated: Date.now() };
};

export const get_btc_price_data = async (): Promise<BtcPriceData> => {
  let cached_price_data = cache.get<BtcPriceData>("btc_price_data");
  if (cached_price_data !== undefined) {
    return cached_price_data;
  }
  const fetched_price_data = await fetch_btc_price_brl();
  cache.set("btc_price_data", fetched_price_data);
  return fetched_price_data;
};

export const convert_brl_to_sats = (
  amount_brl_decimal: number,
  btc_price_brl: number
): number => {
  const amount_sats = (amount_brl_decimal / btc_price_brl) * 100_000_000;
  return Math.floor(amount_sats);
};
