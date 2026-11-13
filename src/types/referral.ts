export type ReferralStatus = "pending" | "successful";

/** Derived from the referral and its bonus wallet transaction. */
export type ReferralBonusStatus = "pending" | "paid" | "failed";

export interface Referral {
  /** e.g. "REF-001860". */
  id: string;
  /** Code the referred user signed up with, e.g. "GP-REF-1860". */
  code: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredUserName: string;
  /** Date only, "YYYY-MM-DD": when the referred user signed up. */
  createdAt: string;
  status: ReferralStatus;
  /** ISO date-time the referral qualified; successful referrals only. */
  qualifiedAt?: string;
  /** Wallet transaction that credited (or tried to credit) the referrer's bonus. */
  bonusTransactionId?: string;
}
