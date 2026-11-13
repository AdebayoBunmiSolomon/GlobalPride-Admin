export type WalletTransactionType =
  | "wallet_funding"
  | "sms_campaign"
  | "image_campaign"
  | "audience_rental"
  | "referral_bonus"
  | "refund";

export type WalletTransactionStatus = "successful" | "pending" | "failed" | "refunded";

export type PaymentMethod = "card" | "bank_transfer";

/** A single platform-wide wallet transaction (credit or debit). */
export interface WalletLedgerEntry {
  /** e.g. "TXN-001285". */
  id: string;
  userId: string;
  userName: string;
  type: WalletTransactionType;
  /** Signed, in naira: positive = credit, negative = debit. */
  amount: number;
  status: WalletTransactionStatus;
  /** ISO date-time. */
  createdAt: string;
  /** User's wallet balance before this transaction, in naira. */
  previousBalance: number;
  /** Campaign charged, for campaign deductions and audience rentals. */
  campaignId?: string;
  /** Wallet funding only: the external payment. */
  payment?: { reference: string; method: PaymentMethod };
  /** Referral bonuses only. */
  referralId?: string;
  /** Refunds only: the deduction being refunded. */
  originalTransactionId?: string;
}
