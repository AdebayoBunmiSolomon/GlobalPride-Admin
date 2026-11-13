type CsvValue = string | number | null | undefined;

const escapeCell = (value: CsvValue) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows of cells → CSV text. */
export const toCsv = (rows: CsvValue[][]) => rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

/** Save CSV text (or rows) as a file in the browser. */
export const downloadCsv = (filename: string, content: string | CsvValue[][]) => {
  const text = typeof content === "string" ? content : toCsv(content);
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
