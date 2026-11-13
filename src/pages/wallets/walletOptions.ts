import { CirclePlus, Gift, Image, MessageSquare, Undo2, Users, type LucideIcon } from "lucide-react";

import type { BadgeStyle } from "@/pages/campaigns/statusStyles";
import type { PaymentMethod, WalletTransactionStatus, WalletTransactionType } from "@/types/wallet";

export const transactionTypes: Record<WalletTransactionType, { label: string; icon: LucideIcon }> = {
  wallet_funding: { label: "Wallet Funding", icon: CirclePlus },
  sms_campaign: { label: "SMS Campaign", icon: MessageSquare },
  image_campaign: { label: "Image Campaign", icon: Image },
  audience_rental: { label: "Audience Rental", icon: Users },
  referral_bonus: { label: "Referral Bonus", icon: Gift },
  refund: { label: "Refund", icon: Undo2 },
};

export const transactionStatusStyles: Record<WalletTransactionStatus, BadgeStyle> = {
  successful: { label: "Successful", variant: "success", className: "text-green-700" },
  pending: { label: "Pending", variant: "warning", className: "text-amber-700" },
  failed: { label: "Failed", variant: "danger", className: "text-red-600" },
  refunded: { label: "Refunded", variant: "neutral" },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export const typeOptions = [
  { label: "All Types", value: "all" },
  ...Object.entries(transactionTypes).map(([value, { label }]) => ({ label, value })),
];

export const statusOptions = [
  { label: "All Statuses", value: "all" },
  ...Object.entries(transactionStatusStyles).map(([value, { label }]) => ({ label, value })),
];
