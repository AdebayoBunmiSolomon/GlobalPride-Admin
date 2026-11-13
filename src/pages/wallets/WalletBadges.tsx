import { WebAppBadge } from "@/components/Badge";
import type { WalletTransactionStatus } from "@/types/wallet";
import { cn } from "@/utils/cn";
import { formatNaira } from "@/utils/format";
import { transactionStatusStyles } from "./walletOptions";

export const TransactionStatusBadge = ({ status }: { status: WalletTransactionStatus }) => {
  const style = transactionStatusStyles[status];
  return (
    <WebAppBadge dot variant={style.variant} className={style.className}>
      {style.label}
    </WebAppBadge>
  );
};

/** Signed naira amount: credits in green with "+", debits plain with "-". */
export const SignedAmount = ({ amount, className }: { amount: number; className?: string }) => (
  <span className={cn("font-medium", amount > 0 ? "text-green-700" : "text-gray-900", className)}>
    {formatNaira(amount, { signed: true })}
  </span>
);
