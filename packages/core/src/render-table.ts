import type { MarkdownElement, MarkdownNode } from "./types.js";
import {
  type RenderContext,
  childrenToArray,
  isMarkdownNodeArray,
  requireFeature,
  supportsFeature,
} from "./render-shared.js";
import { escapeTableCell } from "./escape.js";
import { isElement } from "./runtime.js";

interface TableRenderApi {
  readonly renderInline: (node: MarkdownNode, context: RenderContext) => string;
  readonly resolveComponent: (node: MarkdownNode, context: RenderContext) => MarkdownNode;
}

interface TableCell {
  readonly align?: "left" | "center" | "right";
  readonly value: string;
}

interface NormalizedRows {
  readonly body: readonly (readonly TableCell[])[];
  readonly header: readonly TableCell[];
}

interface TableVisitState {
  readonly api: TableRenderApi;
  readonly context: RenderContext;
  readonly rows: TableCell[][];
}

export const renderTable = (
  element: MarkdownElement,
  context: RenderContext,
  api: TableRenderApi,
): string => {
  const rows = collectRows(element, context, api);
  if (!supportsFeature(context, "table")) {
    return renderUnsupportedTable(rows, context);
  }

  return rows.length === 0 ? "" : renderTableRows(rows);
};

const renderUnsupportedTable = (
  rows: readonly (readonly TableCell[])[],
  context: RenderContext,
): string => {
  if (context.unsupported === "error") {
    requireFeature(context, "table", "table");
  }

  return rows.map((row) => row.map((cell) => cell.value).join(" | ")).join("\n");
};

const renderTableRows = (rows: readonly (readonly TableCell[])[]): string => {
  const normalizedRows = normalizeRows(rows);
  const escapedRows = escapeRows([normalizedRows.header, ...normalizedRows.body]);
  const widths = columnWidths(escapedRows, normalizedRows.header);
  const separator = normalizedRows.header.map((cell, index) =>
    separatorFor(cell.align, widths[index] ?? 3),
  );
  return formatTableLines(escapedRows, separator, widths).join("\n");
};

const normalizeRows = (rows: readonly (readonly TableCell[])[]): NormalizedRows => {
  const [header, ...body] = rows;
  const columnCount = Math.max(...rows.map((row) => row.length));
  return {
    body: body.map((row) => normalizeRow(row, columnCount)),
    header: normalizeRow(header ?? [], columnCount),
  };
};

const escapeRows = (rows: readonly (readonly TableCell[])[]): readonly (readonly string[])[] =>
  rows.map((row) => row.map((cell) => escapeTableCell(cell.value)));

const formatTableLines = (
  escapedRows: readonly (readonly string[])[],
  separator: readonly string[],
  widths: readonly number[],
): readonly string[] => [
  formatTableRow(escapedRows[0] ?? [], widths),
  formatTableRow(separator, widths),
  ...escapedRows.slice(1).map((row) => formatTableRow(row, widths)),
];

const collectRows = (
  element: MarkdownElement,
  context: RenderContext,
  api: TableRenderApi,
): readonly (readonly TableCell[])[] => {
  const rows: TableCell[][] = [];
  visitTableNode(element.props.children, { api, context, rows });
  return rows;
};

const visitTableNode = (node: MarkdownNode, state: TableVisitState): void => {
  const resolved = state.api.resolveComponent(node, state.context);
  if (isMarkdownNodeArray(resolved)) {
    visitTableNodeArray(resolved, state);
    return;
  }

  if (!isElement(resolved)) {
    return;
  }

  if (resolved.type === "tr") {
    state.rows.push([...rowCells(resolved, state.context, state.api)]);
    return;
  }

  visitTableNode(resolved.props.children, state);
};

const visitTableNodeArray = (nodes: readonly MarkdownNode[], state: TableVisitState): void => {
  for (const child of nodes) {
    visitTableNode(child, state);
  }
};

const rowCells = (
  row: MarkdownElement,
  context: RenderContext,
  api: TableRenderApi,
): readonly TableCell[] =>
  childrenToArray(row.props.children)
    .map((child) => api.resolveComponent(child, context))
    .filter((cell) => isElement(cell))
    .filter((cell) => cell.type === "th" || cell.type === "td")
    .map((cell) => tableCell(cell, context, api));

const tableCell = (
  cell: MarkdownElement,
  context: RenderContext,
  api: TableRenderApi,
): TableCell => {
  const value = api.renderInline(cell.props.children, context);
  const { align } = cell.props;
  return isTableAlign(align) && align !== undefined ? { align, value } : { value };
};

const isTableAlign = (value: unknown): value is TableCell["align"] =>
  value === "left" || value === "center" || value === "right";

const separatorFor = (align: TableCell["align"], width: number): string => {
  if (align === "left") {
    return `:${"-".repeat(Math.max(3, width - 1))}`;
  }

  if (align === "center") {
    return `:${"-".repeat(Math.max(3, width - 2))}:`;
  }

  if (align === "right") {
    return `${"-".repeat(Math.max(3, width - 1))}:`;
  }

  return "-".repeat(Math.max(3, width));
};

const normalizeRow = (row: readonly TableCell[], columnCount: number): readonly TableCell[] => {
  const next = [...row];
  while (next.length < columnCount) {
    next.push({ value: "" });
  }
  return next;
};

const columnWidths = (
  rows: readonly (readonly string[])[],
  header: readonly TableCell[],
): readonly number[] =>
  header.map((_cell, index) => Math.max(3, ...rows.map((row) => row[index]?.length ?? 0)));

const formatTableRow = (row: readonly string[], widths: readonly number[]): string =>
  `| ${widths.map((width, index) => padTableCell(row[index] ?? "", width)).join(" | ")} |`;

const padTableCell = (value: string, width: number): string =>
  value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;
