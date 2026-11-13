import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, Download } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppSelectInput } from "@/components/Select";
import { dateRangeOptions } from "@/utils/dateRange";
import { exportReportCsv, financeReports } from "./reports";

export const PeriodSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <WebAppSelectInput
    id="reportPeriod"
    options={dateRangeOptions}
    value={value}
    onChange={onChange}
    leftIcon={<CalendarDays className="h-4 w-4" />}
    size="sm"
    fullWidth={false}
    className="text-sm"
    containerClassName="w-44"
  />
);

/** "Export Report" button with a menu of every report's CSV. */
export const ExportReportMenu = ({ period }: { period: string }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <WebAppButton
        size="sm"
        className="h-9"
        aria-haspopup="menu"
        aria-expanded={open}
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={<ChevronDown className="h-4 w-4" />}
        onClick={() => setOpen((value) => !value)}
      >
        Export Report
      </WebAppButton>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {financeReports.map((report) => (
            <button
              key={report.id}
              type="button"
              role="menuitem"
              onClick={() => {
                exportReportCsv(report, period);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <report.icon className="h-4 w-4 text-gray-500" />
              {report.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface BreakdownTableProps {
  columns: string[];
  rows: ReactNode[][];
  total: ReactNode[];
}

/** Small summary table with a highlighted total row. */
export const BreakdownTable = ({ columns, rows, total }: BreakdownTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-120 text-left text-sm">
      <thead className="border-b border-gray-200 text-xs text-gray-600">
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col" className="px-5 py-3 font-semibold">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-5 py-3.5 text-gray-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
        <tr className="bg-stone-50 font-semibold text-gray-900">
          {total.map((cell, index) => (
            <td key={index} className="px-5 py-3.5">
              {cell}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </div>
);
