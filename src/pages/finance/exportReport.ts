import type { FinanceRange } from "@/api/services/finance";
import { handleApiError } from "@/api/utils";
import { downloadFinanceReport } from "@/store/financeStore";
import { appToast } from "@/utils/appToast";
import type { FinanceReport } from "./reports";

/** Downloads a report's CSV from the API, with a toast while it's prepared. Resolves when done. */
export const exportReportCsv = async (report: FinanceReport, range: FinanceRange) => {
  appToast.show("Preparing export", `${report.title} will download shortly.`, "info");
  try {
    await downloadFinanceReport(report.api, range);
  } catch (error) {
    handleApiError(error, { fallbackMessage: `We couldn't export the ${report.title.toLowerCase()}.` });
  }
};
