import { elementSymbol } from "./types.js";
import type { Component, ElementType, MarkdownChildren, MarkdownElement } from "./types.js";

export const createElement = <Props extends object>(
  type: ElementType<Props>,
  props: (Props & { readonly children?: MarkdownChildren }) | null,
  key?: string | number | null,
): MarkdownElement => ({
  [elementSymbol]: true,
  key: key ?? null,
  props: (props ?? {}) as Props & { readonly children?: MarkdownChildren },
  type: type as string | Component<Record<string, unknown>>,
});

export const Fragment: Component = ({ children }) => createElement("fragment", { children });

export const isElement = (value: unknown): value is MarkdownElement =>
  typeof value === "object" &&
  value !== null &&
  elementSymbol in value &&
  (value as MarkdownElement)[elementSymbol] === true;
