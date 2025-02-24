import axios from "axios";
import {
  sqala_base_url,
  sqala_app_id,
  sqala_app_secret,
  sqala_refresh_token,
} from "../config";
import { encode } from "base-64";
import { validate_pix_key, validate_pix_amount } from "./pix.service";
import {
  SqalaBalanceResponse,
  SqalaDepositResponse,
  SqalaDictLookupResponse,
  SqalaWithdrawalResponse,
} from "../types/sqala";
import {
  get_user,
  insert_user_pix_payment,
  update_user_balance_sats,
} from "./supabase.service";
import { UserPixPayment } from "../types/supabase";
import { CustomError } from "./error.service";
import { check_lightning_deposit_statuses } from "./strike.service";

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
    throw new CustomError(
      "Could not connect to Pix service",
      {},
      response.data
    );
  }
  access_token = response.data.token as string;
  token_expiry_time = Date.now() + response.data.expiresIn * 1000;
  return access_token;
};

export const get_admin_deposit_qr = async ({
  amount_brl_decimal,
}: {
  amount_brl_decimal: number;
}): Promise<{
  adjusted_amount_brl: number;
  deposit_qr_code: string;
}> => {
  const { adjusted_amount_brl_cents, adjusted_amount_brl_decimal } =
    await validate_pix_amount(amount_brl_decimal, true);
  const { payload: deposit_qr_code } = await sqala_api_client
    .post(`/pix-qrcode-payments`, {
      amount: adjusted_amount_brl_cents,
    })
    .then((response) => response.data as SqalaDepositResponse);
  return { adjusted_amount_brl: adjusted_amount_brl_decimal, deposit_qr_code };
};

export const get_admin_balance_brl = async (): Promise<{
  balance_brl: number;
}> => {
  const { available: balance_brl_cents } = await sqala_api_client
    .get(`/recipients/DEFAULT/balance`)
    .then((response) => response.data as SqalaBalanceResponse);
  return { balance_brl: balance_brl_cents / 100 };
};

export const pay_pix_via_qr = async ({
  qr_code,
  user_id,
}: {
  qr_code: string;
  user_id: string;
}): Promise<
  UserPixPayment & {
    status: string;
  }
> => {
  await check_lightning_deposit_statuses(user_id);
  const { balance_sats } = await get_user(user_id);
  const {
    hash,
    amount: amount_brl_cents,
    key: pix_key,
    recipient: { name: payee_name },
  } = await sqala_api_client
    .get(`/dict/barcode?qrcode=${qr_code}`)
    .then((response) => response.data as SqalaDictLookupResponse);
  const amount_brl_decimal = amount_brl_cents / 100;
  const { adjusted_amount_sats } = await validate_pix_amount(
    amount_brl_decimal
  );
  if (adjusted_amount_sats > balance_sats) {
    const minimum_topup_amount = adjusted_amount_sats - balance_sats;
    const recommended_topup_amount = Math.floor(minimum_topup_amount * 1.05);
    const maximum_topup_amount = 10000; // in sats

    if (recommended_topup_amount > maximum_topup_amount) {
      throw new CustomError(
        `The recommended top-up amount (${recommended_topup_amount} sats) exceeds the maximum allowed limit of ${maximum_topup_amount} sats.`,
        { recommended_topup_amount, maximum_topup_amount }
      );
    }
    
    throw new CustomError(
      `Insufficient balance for payment - have ${balance_sats} sats, need >${adjusted_amount_sats} sats - need to top up ~${recommended_topup_amount} sats`,
      {
        balance_sats,
        minimum_topup_amount,
        recommended_topup_amount,
      }
    );
  }
  const { status, id: sqala_id } = await sqala_api_client
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX_QRCODE",
      pixQrCode: qr_code,
      hash,
      amount: amount_brl_cents,
    })
    .then((response) => response.data as SqalaWithdrawalResponse);
  await update_user_balance_sats(user_id, -adjusted_amount_sats);
  const pix_payment_record = await insert_user_pix_payment({
    amount_brl: amount_brl_decimal,
    amount_sats: adjusted_amount_sats,
    payee_name,
    pix_key,
    pix_qr_code: qr_code,
    sqala_id,
    user_id,
    paid: true,
  });
  return { ...pix_payment_record, status };
};

export const pay_pix_via_key = async ({
  pix_key,
  amount_brl_decimal,
  user_id,
}: {
  pix_key: string;
  amount_brl_decimal: number;
  user_id: string;
}): Promise<
  UserPixPayment & {
    status: string;
  }
> => {
  await check_lightning_deposit_statuses(user_id);
  const { balance_sats } = await get_user(user_id);
  const { amount_brl_cents, adjusted_amount_sats } = await validate_pix_amount(
    amount_brl_decimal
  );
  if (adjusted_amount_sats > balance_sats) {
    const minimum_topup_amount = adjusted_amount_sats - balance_sats;
    const recommended_topup_amount = Math.floor(minimum_topup_amount * 1.05);
    throw new CustomError(
      `Insufficient balance for payment - have ${balance_sats} sats, need >${adjusted_amount_sats} sats - need to top up ~${recommended_topup_amount} sats`,
      {
        balance_sats,
        minimum_topup_amount,
        recommended_topup_amount,
      }
    );
  }
  const { formatted_key } = validate_pix_key(pix_key);
  const {
    status,
    id: sqala_id,
    pixKey: payee_name,
  } = await sqala_api_client
    .post(`/recipients/DEFAULT/withdrawals`, {
      method: "PIX",
      amount: amount_brl_cents,
      pixKey: formatted_key,
    })
    .then((response) => response.data as SqalaWithdrawalResponse);
  await update_user_balance_sats(user_id, -adjusted_amount_sats);
  const pix_payment_record = await insert_user_pix_payment({
    amount_brl: amount_brl_decimal,
    amount_sats: adjusted_amount_sats,
    payee_name,
    pix_key,
    user_id,
    sqala_id,
    paid: true,
  });
  return { ...pix_payment_record, status };
};
