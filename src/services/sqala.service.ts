import axios from "axios";
import {
  sqalaBaseUrl,
  sqalaAppId,
  sqalaAppSecret,
  sqalaRefreshToken,
} from "../config";
import { encode } from "base-64";
import { processPixAmount, processPixKey } from "../helpers.ts/pix";
import {
  BalanceResponse,
  DepositResponse,
  DictLookupResponse,
  WithdrawalResponse,
} from "../types/sqala";

const sqalaApiClient = axios.create({
  baseURL: sqalaBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

sqalaApiClient.interceptors.request.use(
  async (config) => {
    if (config.url === "/access-tokens") {
      config.headers.Authorization =
        "Basic " + encode(sqalaAppId + ":" + sqalaAppSecret);
      return config;
    }
    const token = await getAccessToken();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let accessToken: string | null = null;
let tokenExpiryTime: number | null = null;

const getAccessToken = async (): Promise<string> => {
  if (accessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return accessToken;
  }
  const response = await sqalaApiClient.post("/access-tokens", {
    refreshToken: sqalaRefreshToken,
  });
  if (!response.data?.token) {
    throw new Error("Invalid token response from server");
  }
  accessToken = response.data.token as string;
  tokenExpiryTime = Date.now() + response.data.expiresIn * 1000;
  return accessToken;
};

export const getDepositQr = async ({
  amountDecimal,
}: {
  amountDecimal: number;
}) => {
  const depositResponse = await sqalaApiClient
    .post(`/pix-qrcode-payments`, {
      amount: amountDecimal * 100,
    })
    .then((response) => response.data as DepositResponse);
  return depositResponse.payload;
};

export const getBalance = async () => {
  const { available } = await sqalaApiClient
    .get(`/recipients/DEFAULT/balance`)
    .then((response) => response.data as BalanceResponse);
  return available / 100;
};

export const payPixQr = async (qrcode: string) => {
  const { hash, amount } = await sqalaApiClient
    .get(`/dict/barcode?qrcode=${qrcode}`)
    .then((response) => response.data as DictLookupResponse);
  return await sqalaApiClient
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX_QRCODE",
      pixQrCode: qrcode,
      hash,
      amount,
    })
    .then((response) => response.data as WithdrawalResponse);
};

export const payPixKey = async ({
  pixKey,
  amountDecimal,
}: {
  pixKey: string;
  amountDecimal: number;
}): Promise<string> => {
  const validatedPixKey = processPixKey(pixKey);
  const validatedAmountCents = processPixAmount(amountDecimal);
  const { status } = await sqalaApiClient
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX",
      amount: validatedAmountCents,
      pixKey: validatedPixKey,
    })
    .then((response) => response.data as WithdrawalResponse);
  return status;
};
