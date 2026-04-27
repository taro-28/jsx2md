import {
  type Component,
  type ElementType,
  type MarkdownChildren,
  type MarkdownElement,
  elementSymbol,
} from "./types.js";

interface ElementCandidate {
  readonly [elementSymbol]?: unknown;
}

export const createElement = <Props extends object>(
  type: ElementType<Props>,
  props: (Props & { readonly children?: MarkdownChildren }) | null,
  key?: string | number | null,
): MarkdownElement => ({
  [elementSymbol]: true,
  key: key ?? undefined,
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- JSX runtime props are generic at construction and become typed at call sites.
  props: (props ?? {}) as Props & { readonly children?: MarkdownChildren },
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- ElementType preserves the public runtime union while MarkdownElement stores the normalized shape.
  type: type as string | Component,
});

export const Fragment: Component = ({ children }) => createElement("fragment", { children });

export const isElement = (value: unknown): value is MarkdownElement =>
  typeof value === "object" &&
  value !== null &&
  elementSymbol in value &&
  (value as ElementCandidate)[elementSymbol] === true;
