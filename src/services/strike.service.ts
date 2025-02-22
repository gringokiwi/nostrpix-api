import axios from "axios";
import { strike_api_key, strike_base_url } from "../config";
import { StrikeInvoice, StrikeQuote } from "../types/strike";
import {
  get_user_lightning_deposit,
  get_user,
  list_user_lightning_deposits,
  insert_user_lightning_deposit,
  update_user_lightning_deposit_paid,
  update_user_balance_sats,
} from "./supabase.service";
import { UserLightningDeposit } from "../types/supabase";
import { CustomError } from "./error.service";

const strike_api_client = axios.create({
  baseURL: strike_base_url,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${strike_api_key}`,
  },
});

export const generate_lightning_deposit = async (
  amount_sats: number,
  user_id: string
): Promise<UserLightningDeposit> => {
  const user = await get_user(user_id);
  if (!user) {
    throw new CustomError("User not found", {
      user_id,
    });
  }
  const { invoiceId: strike_id } = await strike_api_client
    .post("/invoices", {
      description: "Topup NostrPIX account",
      amount: {
        amount: amount_sats / 100_000_000,
        currency: "BTC",
      },
    })
    .then((response) => response.data as StrikeInvoice);
  const { lnInvoice: lnurl } = await strike_api_client
    .post(`/invoices/${strike_id}/quote`)
    .then((response) => response.data as StrikeQuote);
  const lightning_deposit = await insert_user_lightning_deposit({
    amount_sats,
    lnurl,
    strike_id,
    user_id,
    paid: false,
  });
  return lightning_deposit;
};

export const check_lightning_deposit_statuses = async (
  user_id: string
): Promise<UserLightningDeposit[]> => {
  const lightning_deposits = await list_user_lightning_deposits(user_id);
  const unpaid_lightning_deposits = lightning_deposits.filter(
    ({ paid }) => !paid
  );
  const updated_lightning_deposits = await Promise.all(
    unpaid_lightning_deposits.map(
      async ({ id: lightning_deposit_id, strike_id, amount_sats }) => {
        const { state } = await strike_api_client
          .get(`/invoices/${strike_id}`)
          .then((response) => response.data as StrikeInvoice);
        const updated_lightning_deposit =
          await update_user_lightning_deposit_paid(
            lightning_deposit_id,
            state === "PAID"
          );
        if (updated_lightning_deposit.paid) {
          await update_user_balance_sats(user_id, amount_sats);
        }
        return updated_lightning_deposit;
      }
    )
  );
  return updated_lightning_deposits;
};

export const check_lightning_deposit_status = async (
  lnurl: string
): Promise<
  UserLightningDeposit & {
    state: StrikeInvoice["state"];
  }
> => {
  const { strike_id, user_id } = await get_user_lightning_deposit(lnurl);
  const { state } = await strike_api_client
    .get(`/invoices/${strike_id}`)
    .then((response) => response.data as StrikeInvoice);
  if (state === "PAID") {
    await check_lightning_deposit_statuses(user_id);
  }
  const updated_lightning_deposit = await get_user_lightning_deposit(lnurl);
  return { ...updated_lightning_deposit, state };
};
