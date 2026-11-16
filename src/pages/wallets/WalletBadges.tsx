import { createElement } from "react";

import { WebAppBadge } from "@/components/Badge";
import { cn } from "@/utils/cn";
import { formatNaira } from "@/utils/format";
import { categoryIcon, walletStatusStyle } from "./walletOptions";

/** Signed naira amount: credits in green with "+", debits plain with "-". */
export const SignedAmount = ({ amount, className }: { amount: number; className?: string }) => (
  <span className={cn("font-medium", amount > 0 ? "text-green-700" : "text-gray-900", className)}>
    {formatNaira(amount, { signed: true })}
  </span>
);

/** Status badge for an API wallet transaction. */
export const WalletStatusBadge = ({ status }: { status: string }) => {
  const style = walletStatusStyle(status);
  return (
    <WebAppBadge dot variant={style.variant} className={style.className}>
      {style.label}
    </WebAppBadge>
  );
};

/** Icon for an API transaction category. */
export const CategoryIcon = ({ category, className }: { category: string; className?: string }) =>
  createElement(categoryIcon(category), { className });
