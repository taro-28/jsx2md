import { createElement } from "./runtime.js";
import type {
  AutoHeadingProps,
  CommonProps,
  Component,
  RawMarkdownProps,
  SectionProps,
} from "./types.js";

export const Doc: Component<CommonProps> = ({ children }) => createElement("doc", { children });

export const RawMarkdown: Component<RawMarkdownProps> = ({ children }) =>
  createElement("raw", { children });

export const Heading: Component<AutoHeadingProps> = ({ children, level }) =>
  createElement("heading-auto", { children, level });

export const Section: Component<SectionProps> = ({ children, title }) =>
  createElement("section", { children, title });
