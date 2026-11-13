import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface WebAppPageLayoutProps {
  children: ReactNode;

  /** Left side of the top bar — usually a menu icon + page title. */
  headerLeft?: ReactNode;
  /** Right side of the top bar — usually icon actions (search, bell, etc). */
  headerRight?: ReactNode;

  /** Skip rendering the top bar entirely, e.g. for auth/onboarding screens. */
  hideHeader?: boolean;

  headerClassName?: string;
  mainClassName?: string;
  containerClassName?: string;
}

export const WebAppPageLayout = ({
  children,

  headerLeft,
  headerRight,
  hideHeader = false,

  headerClassName,
  mainClassName,
  containerClassName,
}: WebAppPageLayoutProps) => {
  return (
    <div
      className={cn("h-screen w-screen overflow-y-auto", containerClassName)}
    >
      {!hideHeader && (headerLeft || headerRight) && (
        <div
          className={cn(
            "flex items-center justify-between p-4",
            headerClassName,
          )}
        >
          {headerLeft && (
            <div className="flex items-center space-x-2">{headerLeft}</div>
          )}

          {headerRight && (
            <div className="flex items-center space-x-4">{headerRight}</div>
          )}
        </div>
      )}

      <main className={cn("p-4", mainClassName)}>{children}</main>
    </div>
  );
};
