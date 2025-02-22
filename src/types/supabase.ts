export interface User {
  id: string;
  public_key?: string;
  balance_sats: number; // integer
  created_at: string;
}

export interface UserPixPayment {
  id: string;
  amount_brl: number; // decimal, 2 places
  amount_sats: number; // integer
  payee_name: string;
  description?: string;
  pix_key?: string;
  pix_qr_code?: string;
  sqala_id: string;
  user_id: string; // foreign key to user.id
  paid: boolean;
  created_at: string;
}

export interface UserLightningDeposit {
  id: string;
  amount_sats: number; // integer
  lnurl: string;
  description?: string;
  strike_id: string;
  user_id: string; // foreign key to user.id
  paid: boolean;
  created_at: string;
}

export type UserInsert = Omit<User, "id" | "created_at">;
export type UserPixPaymentInsert = Omit<UserPixPayment, "id" | "created_at">;
export type UserLightningDepositInsert = Omit<
  UserLightningDeposit,
  "id" | "created_at"
>;
