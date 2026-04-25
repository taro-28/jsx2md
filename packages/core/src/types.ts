export const elementSymbol = Symbol.for("jsx2md.element");

export type AdapterName = "markdown" | "gfm" | "github";

export type AdapterFeature =
  | "gfm"
  | "github"
  | "table"
  | "taskList"
  | "alert"
  | "details"
  | "suggestion"
  | "diagram"
  | "html"
  | "footnote";

export interface Adapter {
  readonly name: AdapterName;
  readonly features: ReadonlySet<AdapterFeature>;
}

type MarkdownPrimitive = string | number | boolean | null | undefined;

export type MarkdownNode = MarkdownPrimitive | MarkdownElement | readonly MarkdownNode[];

export type MarkdownChildren = MarkdownNode;

export type ElementType<Props extends object = Record<string, unknown>> = string | Component<Props>;

export interface MarkdownElement {
  readonly [elementSymbol]: true;
  readonly type: string | Component<Record<string, unknown>>;
  readonly props: Readonly<Record<string, unknown>> & {
    readonly children?: MarkdownChildren;
  };
  readonly key: string | number | null;
}

export interface ComponentContext {
  readonly adapter: Adapter;
  readonly headingLevel: number;
  readonly renderBlock: (node: MarkdownNode) => string;
  readonly renderInline: (node: MarkdownNode) => string;
  readonly requireAdapter: (feature: AdapterFeature, componentName: string) => void;
}

export type Component<Props extends object = Record<string, unknown>> = (
  props: Props & {
    readonly children?: MarkdownChildren;
  },
  context: ComponentContext,
) => MarkdownNode;

export interface RenderOptions {
  readonly adapter?: Adapter | AdapterName;
}

export interface CommonProps {
  readonly children?: MarkdownChildren;
}

export interface HeadingElementProps extends CommonProps {
  readonly id?: string;
}

export interface ParagraphProps extends CommonProps {}

export interface ListProps extends CommonProps {
  readonly start?: number;
}

export interface ListItemProps extends CommonProps {
  readonly checked?: boolean;
}

export interface BlockquoteProps extends CommonProps {}

export interface CodeProps extends CommonProps {
  readonly lang?: string;
  readonly language?: string;
}

export interface LinkProps extends CommonProps {
  readonly href: string;
  readonly title?: string;
}

export interface ImageProps {
  readonly alt?: string;
  readonly src: string;
  readonly title?: string;
}

export interface TableCellProps extends CommonProps {
  readonly align?: "left" | "center" | "right";
}

export interface RawMarkdownProps {
  readonly children: string;
}

export interface SectionProps extends CommonProps {
  readonly title?: MarkdownChildren;
}

export interface AutoHeadingProps extends CommonProps {
  readonly level?: number;
}
