export interface StrikeInvoice {
  invoiceId: string;
  amount: {
    amount: string;
    currency: "BTC";
  };
  state: "UNPAID" | "PENDING" | "PAID" | "CANCELLED";
  created: string;
  description: string;
  issuerId: string;
  receiverId: string;
}

export interface StrikeQuote {
  quoteId: string;
  description: string;
  lnInvoice: string;
  expiration: string;
  expirationInSec: number;
  targetAmount: {
    amount: string;
    currency: "BTC";
  };
  sourceAmount: {
    amount: string;
    currency: "BTC";
  };
  conversionRate: {
    amount: string;
    sourceCurrency: "BTC";
    targetCurrency: "BTC";
  };
}
