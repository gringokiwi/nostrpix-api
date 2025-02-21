export interface DepositResponse {
  id: string;
  code: string;
  method: string;
  amount: number;
  payer: unknown | null;
  split: unknown[];
  status: string;
  createdAt: string;
  processedAt: string;
  paidAt: string | null;
  failedAt: string | null;
  metadata: {};
  payload: string;
  type: string;
  expiresAt: string;
  receiptUrl: string | null;
}

export interface DictLookupResponse {
  dictId: string;
  amount: number;
  hash: string;
  key: string;
  recipient: {
    name: string;
    type: string;
    taxId: string;
  };
  bankAccount: {
    branchNumber: string;
    accountNumber: string;
    bankId: string;
    bankName: string;
  };
}

export interface WithdrawalResponse {
  id: string;
  code: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failedReason: string | null;
  pixKey: string;
  transactionId: string | null;
  expectedHolderTaxId: string | null;
  receiptUrl: string | null;
  recipient: {
    id: string;
    code: string;
    name: string;
    taxId: string | null;
    type: string;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
    deletedAt: string | null;
  };
  metadata: {
    [key: string]: string;
  };
}

export interface BalanceResponse {
  available: number;
}
