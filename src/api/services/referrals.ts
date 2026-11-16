import { apiClient } from "@/api/axios/client";
import { unwrap } from "@/api/utils";
import { fetchAllPages, MAX_PAGE_SIZE } from "@/api/utils/fetchAllPages";
import type {
  AdminReferral,
  AdminReferralDetails,
  AdminReferralSummary,
  AdminResponse,
  PagedResult,
  ReferralBonusStatus,
  ReferralStatus,
} from "@/api/types/response";

/*
 * Swagger documents no body for the referral list or details (and the sample
 * list was empty), so rows are read defensively: each field is taken from the
 * first of a few likely names, and nested `referrer` / `referredUser` objects
 * are accepted too. Replace these readers with plain types once documented.
 */
type Raw = Record<string, unknown>;

const isRaw = (value: unknown): value is Raw => typeof value === "object" && value !== null;

const pick = (raw: Raw, ...names: string[]) => names.map((name) => raw[name]).find((value) => value != null);
const text = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  return value == null || value === "" || isRaw(value) ? null : String(value);
};
const amount = (raw: Raw, ...names: string[]) => {
  const value = pick(raw, ...names);
  const number = Number(value);
  return value == null || value === "" || !Number.isFinite(number) ? null : number;
};
const nested = (raw: Raw, ...names: string[]): Raw => {
  const value = pick(raw, ...names);
  return isRaw(value) ? value : {};
};

/** Comparable form of an enum name: "Bonus_Credited" → "bonuscredited". */
const key = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// The mobile API's ReferralStatus enum is 0 = invited, 1 = joined, 2 = bonus credited.
const SUCCESSFUL = new Set(["successful", "success", "qualified", "completed", "bonuscredited", "credited", "rewarded", "paid", "2"]);
const PAID = new Set(["paid", "credited", "bonuscredited", "successful", "success", "completed"]);
const FAILED = new Set(["failed", "failure", "reversed", "cancelled", "canceled"]);

const toReferral = (raw: Raw): AdminReferralDetails => {
  const referrer = nested(raw, "referrer");
  const referred = nested(raw, "referredUser", "referee", "invitee");
  const bonus = nested(raw, "bonus");

  const status: ReferralStatus = SUCCESSFUL.has(key(pick(raw, "status", "referralStatus"))) ? "successful" : "pending";
  const rawBonusStatus = key(pick(raw, "bonusStatus") ?? pick(bonus, "status"));
  const bonusStatus: ReferralBonusStatus = PAID.has(rawBonusStatus)
    ? "paid"
    : FAILED.has(rawBonusStatus)
      ? "failed"
      : rawBonusStatus
        ? "pending"
        : // No bonus status: a successful referral is one whose bonus was credited.
          status === "successful"
          ? "paid"
          : "pending";

  return {
    id: String(pick(raw, "id", "referralId", "guid") ?? ""),
    code: text(raw, "referralCode", "code", "reference"),
    referrerId: text(raw, "referrerId", "referrerUserId", "inviterId") ?? text(referrer, "id", "userId"),
    referrerName: text(raw, "referrerName", "referrerFullName", "inviterName") ?? text(referrer, "name", "fullName"),
    inviteeContact: text(raw, "inviteeContact", "contact", "invitedContact", "inviteeEmail", "inviteePhone"),
    referredUserId:
      text(raw, "referredUserId", "refereeId", "inviteeUserId", "inviteeId", "joinedUserId") ?? text(referred, "id", "userId"),
    referredUserName:
      text(raw, "referredUserName", "refereeName", "inviteeName", "joinedUserName") ?? text(referred, "name", "fullName"),
    status,
    bonusStatus,
    bonusAmount: amount(raw, "bonusAmount", "bonus", "rewardAmount") ?? amount(bonus, "amount"),
    createdAt: text(raw, "createdAt", "invitedAt", "referralDate", "date"),
    joinedAt: text(raw, "joinedAt", "registeredAt", "signedUpAt") ?? text(referred, "joinedAt", "createdAt"),
    qualifiedAt: text(raw, "qualifiedAt", "successfulAt", "completedAt"),
    bonusTransactionId:
      text(raw, "bonusTransactionReference", "bonusTransactionId", "transactionReference", "walletTransactionId", "transactionId") ??
      text(bonus, "transactionReference", "transactionId", "reference"),
    bonusCreditedAt: text(raw, "bonusCreditedAt", "bonusPaidAt", "creditedAt", "paidAt") ?? text(bonus, "creditedAt", "paidAt", "createdAt"),
  };
};

/** Admin Referral Management (`/admin/referrals`). Every call rejects with a normalized `ApiError`. */
export const referralsService = {
  summary: async () => {
    const { data } = await apiClient.get<AdminResponse<AdminReferralSummary>>("/admin/referrals/summary", {
      useAuth: true,
    });
    return unwrap(data, "We couldn't load the referral summary.");
  },

  /** Every referral, newest first (all pages). Search, filters and paging are then done in the browser. */
  listAll: async (): Promise<AdminReferral[]> => {
    const pages = await fetchAllPages(async (page) => {
      const { data } = await apiClient.get<AdminResponse<PagedResult<unknown>>>("/admin/referrals", {
        params: { page, pageSize: MAX_PAGE_SIZE },
        useAuth: true,
      });
      return unwrap(data, "We couldn't load referrals.");
    });
    return pages.flatMap((page) => page.items).filter(isRaw).map(toReferral);
  },

  /** `id` is the referral GUID. */
  referral: async (id: string): Promise<AdminReferralDetails> => {
    const { data } = await apiClient.get<AdminResponse<unknown>>(`/admin/referrals/${encodeURIComponent(id)}`, {
      useAuth: true,
    });
    const result = unwrap(data, "We couldn't load this referral.");
    // The details may come flat or wrapped, e.g. `{ referral: {...} }`.
    const raw = isRaw(result) && isRaw(result.referral) ? { ...result, ...result.referral } : result;
    return toReferral(isRaw(raw) ? raw : {});
  },
};
