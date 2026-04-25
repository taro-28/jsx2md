export { Fragment, createElement as jsx, createElement as jsxs } from "./runtime.js";
export type { MarkdownElement as Element } from "./types.js";
import type {
  BlockquoteProps,
  CodeProps,
  HeadingElementProps,
  ImageProps,
  LinkProps,
  ListItemProps,
  ListProps,
  ParagraphProps,
  TableCellProps,
} from "./types.js";

interface EmptyProps {
  readonly children?: never;
}

export namespace JSX {
  export type Element = import("./types.js").MarkdownNode;
  export interface ElementChildrenAttribute {
    readonly children: unknown;
  }
  export interface IntrinsicAttributes {
    readonly key?: string | number;
  }
  export interface IntrinsicElements {
    readonly a: LinkProps;
    readonly blockquote: BlockquoteProps;
    readonly br: EmptyProps;
    readonly code: CodeProps;
    readonly del: ParagraphProps;
    readonly em: ParagraphProps;
    readonly h1: HeadingElementProps;
    readonly h2: HeadingElementProps;
    readonly h3: HeadingElementProps;
    readonly h4: HeadingElementProps;
    readonly h5: HeadingElementProps;
    readonly h6: HeadingElementProps;
    readonly hr: EmptyProps;
    readonly img: ImageProps;
    readonly li: ListItemProps;
    readonly ol: ListProps;
    readonly p: ParagraphProps;
    readonly pre: CodeProps;
    readonly strong: ParagraphProps;
    readonly table: ParagraphProps;
    readonly tbody: ParagraphProps;
    readonly td: TableCellProps;
    readonly th: TableCellProps;
    readonly thead: ParagraphProps;
    readonly tr: ParagraphProps;
    readonly ul: ListProps;
  }
}
