import { createClient } from "@supabase/supabase-js";
import {
  User,
  UserLightningDeposit,
  UserLightningDepositInsert,
  UserPixPaymentInsert,
  UserPixPayment,
} from "../types/database";
import { supabase_url, supabase_key } from "../config";

const supabase = createClient(supabase_url, supabase_key);

export const get_user = async ({
  user_id,
  public_key,
}: {
  user_id?: string;
  public_key?: string;
}): Promise<User> => {
  console.log("HERE", user_id, public_key);
  if (user_id) {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("id", user_id)
      .single();
    if (error) throw error;
    return data;
  }
  if (public_key) {
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("public_key", public_key)
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("users")
    .insert({
      balance_sats: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const link_public_key_to_user = async ({
  public_key,
  user_id,
}: {
  public_key: string;
  user_id: string;
}): Promise<User> => {
  const { data, error } = await supabase
    .from("users")
    .update({ public_key })
    .eq("id", user_id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const update_user_balance = async ({
  balance_change_sats,
  user_id,
  public_key,
}: {
  balance_change_sats: number;
  user_id?: string;
  public_key?: string;
}): Promise<User> => {
  const { balance_sats: current_balance_sats } = await get_user({
    user_id,
    public_key,
  });
  const updated_balance_sats = current_balance_sats + balance_change_sats;
  if (user_id) {
    const { data, error } = await supabase
      .from("users")
      .update({ balance_sats: updated_balance_sats })
      .eq("id", user_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  if (public_key) {
    const { data, error } = await supabase
      .from("users")
      .update({ balance_sats: updated_balance_sats })
      .eq("public_key", public_key)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  throw new Error("No user_id or public_key provided");
};

export const record_user_lightning_deposit = async (
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

export const record_user_pix_payment = async (
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

export const get_lightning_deposit_via_lnurl = async (
  lnurl: string
): Promise<UserLightningDeposit | null> => {
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
