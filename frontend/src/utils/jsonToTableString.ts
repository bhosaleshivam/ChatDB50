export function jsonToTableString(data: Record<string, any>[]): string {
  if (!Array.isArray(data) || !data.length) return "No data available";

  // Dynamically extract column names (keys from the first object)
  const columnOrder = Object.keys(data[0]);

  // Ensure data rows are mapped in the correct order of columns
  const rows = data.map((obj) =>
    columnOrder.map((col) => String(obj[col] || "")) // Handle missing data gracefully
  );

  // Calculate column widths based on the maximum length of the header or data in that column
  const colWidths = columnOrder.map((col, i) => {
    return Math.max(
      col.length, // Length of the column header
      ...rows.map((row) => row[i].length) // Maximum length of the data in the column
    );
  });

  // Format row with proper padding
  const formatRow = (row: string[]) =>
    "| " +
    row.map((val, i) => val.padEnd(colWidths[i])).join(" | ") +
    " |";

  // Divider row based on column widths
  const divider = "|-" + colWidths.map((w) => "-".repeat(w)).join("-|-") + "-|";

  // Header row formatted
  const headerRow = formatRow(columnOrder);

  // Format all data rows
  const dataRows = rows.map(formatRow);

  // Return the final formatted table as a string
  return [headerRow, divider, ...dataRows].join("\n");
}