import { ArrowLeftRight, CirclePlus, Image, MessageSquare, Users, type LucideIcon } from "lucide-react";

import type {
  AdminWalletTransaction,
  AdminWalletTransactionStatus,
  WalletTransactionCategory,
} from "@/api/types/response";
import type { BadgeStyle } from "@/pages/campaigns/statusStyles";

export const categoryIcons: Record<WalletTransactionCategory, LucideIcon> = {
  funding: CirclePlus,
  sms_campaign: MessageSquare,
  image_campaign: Image,
  audience_rental: Users,
};

/** Icon for an API transaction category (generic for categories the API adds later). */
export const categoryIcon = (category: string): LucideIcon =>
  categoryIcons[category as WalletTransactionCategory] ?? ArrowLeftRight;

export const categoryOptions = [
  { label: "All Types", value: "all" },
  { label: "Wallet Funding", value: "funding" },
  { label: "SMS Campaign", value: "sms_campaign" },
  { label: "Image Campaign", value: "image_campaign" },
  { label: "Audience Rental", value: "audience_rental" },
];

export const walletStatusStyles: Record<AdminWalletTransactionStatus, BadgeStyle> = {
  pending: { label: "Pending", variant: "warning", className: "text-amber-700" },
  processing: { label: "Processing", variant: "warning", className: "text-amber-700" },
  successful: { label: "Successful", variant: "success", className: "text-green-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

/** Badge style for an API status, with a neutral fallback for unknown values. */
export const walletStatusStyle = (status: string): BadgeStyle =>
  walletStatusStyles[status as AdminWalletTransactionStatus] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: "neutral",
  };

export const walletStatusOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(walletStatusStyles).map(([value, { label }]) => ({ label, value })),
];

/** "DebitCard" → "Debit Card", "BankTransfer" → "Bank Transfer". */
export const paymentMethodLabel = (method: string | null) =>
  method ? method.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ") : "—";

/** Signed amount: debits negative. */
export const signedAmount = ({ amount, direction }: Pick<AdminWalletTransaction, "amount" | "direction">) =>
  direction === "debit" ? -Math.abs(amount) : Math.abs(amount);
