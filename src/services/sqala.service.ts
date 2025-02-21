import axios from "axios";
import {
  sqala_base_url,
  sqala_app_id,
  sqala_app_secret,
  sqala_refresh_token,
} from "../config";
import { encode } from "base-64";
import {
  validate_pix_payment_amount,
  validate_pix_key,
  validate_pix_deposit_amount,
} from "../helpers.ts/pix";
import {
  SqalaBalanceResponse,
  SqalaDepositResponse,
  SqalaDictLookupResponse,
  SqalaWithdrawalResponse,
} from "../types/sqala";

const sqala_api_client = axios.create({
  baseURL: sqala_base_url,
  headers: {
    "Content-Type": "application/json",
  },
});

sqala_api_client.interceptors.request.use(
  async (config) => {
    if (config.url === "/access-tokens") {
      config.headers.Authorization =
        "Basic " + encode(sqala_app_id + ":" + sqala_app_secret);
      return config;
    }
    const token = await get_access_token();
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let access_token: string | null = null;
let token_expiry_time: number | null = null;

const get_access_token = async (): Promise<string> => {
  if (access_token && token_expiry_time && Date.now() < token_expiry_time) {
    return access_token;
  }
  const response = await sqala_api_client.post("/access-tokens", {
    refreshToken: sqala_refresh_token,
  });
  if (!response.data?.token) {
    throw new Error("Invalid token response from server");
  }
  access_token = response.data.token as string;
  token_expiry_time = Date.now() + response.data.expiresIn * 1000;
  return access_token;
};

export const get_admin_deposit_qr = async ({
  amount_decimal,
}: {
  amount_decimal: number;
}): Promise<{
  payload: string;
}> => {
  const amount = validate_pix_deposit_amount(amount_decimal);
  const { payload } = await sqala_api_client
    .post(`/pix-qrcode-payments`, {
      amount,
    })
    .then((response) => response.data as SqalaDepositResponse)
    .catch((error) => {
      throw error;
    });
  return { payload };
};

export const get_admin_balance_brl = async (): Promise<{
  balance_brl: number;
}> => {
  const { available: balance_cents } = await sqala_api_client
    .get(`/recipients/DEFAULT/balance`)
    .then((response) => response.data as SqalaBalanceResponse)
    .catch((error) => {
      throw error;
    });
  return { balance_brl: balance_cents / 100 };
};

export const pay_pix_via_qr = async (
  qr_code: string
): Promise<{
  status: string;
  sqala_id: string;
}> => {
  const { hash, amount } = await sqala_api_client
    .get(`/dict/barcode?qrcode=${qr_code}`)
    .then((response) => response.data as SqalaDictLookupResponse);
  const { status, id: sqala_id } = await sqala_api_client
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX_QRCODE",
      pixQrCode: qr_code,
      hash,
      amount,
    })
    .then((response) => response.data as SqalaWithdrawalResponse)
    .catch((error) => {
      throw error;
    });
  return { status, sqala_id };
};

export const pay_pix_via_key = async ({
  pix_key,
  amount_decimal,
}: {
  pix_key: string;
  amount_decimal: number;
}): Promise<{
  status: string;
  sqala_id: string;
}> => {
  const amount = validate_pix_payment_amount(amount_decimal);
  const pixKey = validate_pix_key(pix_key);
  const { status, id: sqala_id } = await sqala_api_client
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX",
      amount,
      pixKey,
    })
    .then((response) => response.data as SqalaWithdrawalResponse)
    .catch((error) => {
      throw error;
    });
  return { status, sqala_id };
};
