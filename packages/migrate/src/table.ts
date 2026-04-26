import type { PhrasingContent, Table } from "mdast";
import { indent, quoteAttribute, wrap } from "./format.js";
import type { MigrationState } from "./state.js";

interface TableToTsxApi {
  readonly inlineNodesToTsx: (nodes: readonly PhrasingContent[], state: MigrationState) => string;
}

interface TableToTsxOptions {
  readonly api: TableToTsxApi;
  readonly node: Table;
  readonly state: MigrationState;
}

interface RowToTsxOptions {
  readonly alignment: readonly (string | null | undefined)[];
  readonly api: TableToTsxApi;
  readonly cellTag: "td" | "th";
  readonly cells: readonly Table["children"][number]["children"][number][];
  readonly state: MigrationState;
}

export const tableToTsx = ({ api, node, state }: TableToTsxOptions): string => {
  const [head, ...body] = node.children;
  const alignment = node.align ?? [];
  const header =
    head === undefined
      ? ""
      : rowToTsx({
          alignment,
          api,
          cellTag: "th",
          cells: head.children,
          state,
        });
  const rows = body.map((row) =>
    rowToTsx({
      alignment,
      api,
      cellTag: "td",
      cells: row.children,
      state,
    }),
  );
  return `<table>\n  <thead>\n${indent(header, 4)}\n  </thead>\n  <tbody>\n${indent(
    rows.join("\n"),
    4,
  )}\n  </tbody>\n</table>`;
};

const rowToTsx = ({ alignment, api, cellTag, cells, state }: RowToTsxOptions): string =>
  `<tr>\n${indent(
    cells
      .map((cell, index) =>
        wrap(
          `${cellTag}${alignAttribute(alignment[index])}`,
          api.inlineNodesToTsx(cell.children, state),
        ),
      )
      .join("\n"),
    2,
  )}\n</tr>`;

const alignAttribute = (value: string | null | undefined): string =>
  value === "left" || value === "center" || value === "right"
    ? ` align=${quoteAttribute(value)}`
    : "";
