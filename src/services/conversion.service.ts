import axios from "axios";
import cache from "./cache.service";
import { BtcPriceData } from "../types/btc-price-data";
import { CustomError } from "./error.service";
import cron from "node-cron";
import { io } from "../../src/app";

export const fetch_btc_price_brl = async (): Promise<BtcPriceData> => {
  const response = await axios.get(
    "https://api.mercadobitcoin.net/api/v4/tickers?symbols=BTC-BRL"
  );

  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  const btc_price_brl = Number(data.last);

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

// Scheduled updater to refresh the cache every 2 seconds
const updateBtcPriceCache = async () => {
  try {
    const fetched_price_data = await fetch_btc_price_brl();
    cache.set("btc_price_data", fetched_price_data);
    console.log(
      "BTC price updated: without fee",
      fetched_price_data.btc_price_brl,
      "with fee",
      fetched_price_data.btc_price_brl * 1.05
    );
    io.emit("btc-price-update", fetched_price_data.btc_price_brl);
  } catch (error) {
    console.error("Error updating BTC price:", error);
  }
};
// Schedule the update every 2 seconds using cron syntax
cron.schedule("*/2 * * * * *", updateBtcPriceCache);

export const convert_brl_to_sats = (
  amount_brl_decimal: number,
  btc_price_brl: number
): number => {
  const amount_sats = (amount_brl_decimal / btc_price_brl) * 100_000_000;
  return Math.floor(amount_sats);
};
