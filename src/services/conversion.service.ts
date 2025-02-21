import axios from "axios";

// Function to fetch the current BTC price in BRL from CoinGecko
export const getBTCPriceInBRL = async (): Promise<number> => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "bitcoin",
          vs_currencies: "brl",
        },
      }
    );
    const btcPrice = response.data.bitcoin?.brl;
    if (!btcPrice) {
      throw new Error("BTC price not found in the response.");
    }
    return btcPrice;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    throw error;
  }
};

// Function to convert a BRL amount to satoshis.
// Note: 1 BTC = 100,000,000 satoshis.
export const convertBRLToSats = (
  brlAmount: number,
  btcPriceInBRL: number
): number => {
  const sats = (brlAmount / btcPriceInBRL) * 100_000_000;
  return Math.floor(sats);
};
