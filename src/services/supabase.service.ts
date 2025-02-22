import { createClient } from "@supabase/supabase-js";
import {
  User,
  UserLightningDeposit,
  UserLightningDepositInsert,
  UserPixPaymentInsert,
  UserPixPayment,
} from "../types/supabase";
import { supabase_url, supabase_key } from "../config";

const supabase = createClient(supabase_url, supabase_key);

export const insert_user = async (): Promise<User> => {
  const { data, error } = await supabase
    .from("users")
    .insert({ balance_sats: 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const get_user = async (user_id: string): Promise<User> => {
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("id", user_id)
    .single();
  if (error) throw error;
  return data;
};

export const update_user_balance_sats = async (
  user_id: string,
  balance_change_sats: number
): Promise<User> => {
  const { balance_sats: current_balance_sats } = await get_user(user_id);
  const updated_balance_sats = current_balance_sats + balance_change_sats;
  const { data, error } = await supabase
    .from("users")
    .update({ balance_sats: updated_balance_sats })
    .eq("id", user_id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const insert_user_lightning_deposit = async (
  lightning_deposit: UserLightningDepositInsert
): Promise<UserLightningDeposit> => {
  const { data, error } = await supabase
    .from("lightning_deposits")
    .insert(lightning_deposit)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const update_user_lightning_deposit_paid = async (
  lightning_deposit_id: string,
  paid: boolean
): Promise<UserLightningDeposit> => {
  const { data, error } = await supabase
    .from("lightning_deposits")
    .update({ paid })
    .eq("id", lightning_deposit_id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const insert_user_pix_payment = async (
  pix_payment: UserPixPaymentInsert
): Promise<UserPixPayment> => {
  const { data, error } = await supabase
    .from("pix_payments")
    .insert(pix_payment)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const get_user_lightning_deposit = async (
  lnurl: string
): Promise<UserLightningDeposit> => {
  const { data, error } = await supabase
    .from("lightning_deposits")
    .select()
    .eq("lnurl", lnurl)
    .single();
  if (error) throw error;
  return data;
};

export const list_user_pix_payments = async (
  user_id: string
): Promise<UserPixPayment[]> => {
  const { data, error } = await supabase
    .from("pix_payments")
    .select()
    .eq("user_id", user_id);
  if (error) throw error;
  return data;
};

export const list_user_lightning_deposits = async (
  user_id: string
): Promise<UserLightningDeposit[]> => {
  const { data, error } = await supabase
    .from("lightning_deposits")
    .select()
    .eq("user_id", user_id);
  if (error) throw error;
  return data;
};
