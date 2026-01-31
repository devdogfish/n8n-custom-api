import { SHEET_NAMES } from "./constants.js";
import { getSheetURL } from "./sheets.utils.js";

interface GoogleSheetResponse {
  table: {
    cols: { label: string }[];
    rows: { c: ({ v: any } | null)[] }[];
  };
}

// Low-level fetcher that returns both headers and rows separately
export async function getSheetDataWithHeaders(
  sheetName: (typeof SHEET_NAMES)[number],
): Promise<{ headers: string[]; rows: string[][] }> {
  const sheetURL = getSheetURL(sheetName); // Replace with dynamic name if needed
  const res = await fetch(sheetURL);
  const text = await res.text();

  const json = JSON.parse(
    text.substring(47).slice(0, -2),
  ) as GoogleSheetResponse;

  const headers = json.table.cols.map((col) => col.label);
  const rows = (json.table.rows || []).map((r) =>
    r.c.map((c) => (c ? String(c.v ?? "") : "")),
  );

  return { headers, rows };
}

// High-level object mapper
export async function getSheetDataAsObjects<T extends Record<string, any>>(
  sheetName: (typeof SHEET_NAMES)[number],
): Promise<T[]> {
  const { headers, rows } = await getSheetDataWithHeaders(sheetName); // always safe

  if (!rows.length) return [];

  return rows.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])),
  ) as T[];
}

/*
Example fetch
const fetchData = async () => {
      setIsPending(true);
      try {
        const result = await getSheetDataAsObjects<T>(sheetName);
        setData(result);
        setError(null);
      } catch (err) {
        setError(`Error fetching ${sheetName}: ${(err as Error).message}`);
        setData(null);
      } finally {
        setIsPending(false);
      }
    };

    fetchData();
*/
