import {
  type RenderContext,
  childrenToArray,
  isBlockNode,
  isMarkdownNodeArray,
  joinBlocks,
} from "./render-shared.js";
import type { MarkdownNode } from "./types.js";

interface BlockRenderApi {
  readonly renderBlock: (node: MarkdownNode, context: RenderContext) => string;
  readonly renderInline: (node: MarkdownNode, context: RenderContext) => string;
  readonly resolveComponent: (node: MarkdownNode, context: RenderContext) => MarkdownNode;
}

interface BlockRenderState {
  readonly api: BlockRenderApi;
  readonly blocks: string[];
  readonly context: RenderContext;
  inlineChildren: MarkdownNode[];
}

export const renderBlocks = (
  children: readonly MarkdownNode[] | MarkdownNode,
  context: RenderContext,
  api: BlockRenderApi,
): string => {
  const state: BlockRenderState = {
    api,
    blocks: [],
    context,
    inlineChildren: [],
  };

  for (const child of childrenToArray(children)) {
    appendBlockNode(child, state);
  }

  flushInlineChildren(state);
  return joinBlocks(state.blocks);
};

const appendBlockNode = (node: MarkdownNode, state: BlockRenderState): void => {
  const resolved = state.api.resolveComponent(node, state.context);
  if (isMarkdownNodeArray(resolved)) {
    appendBlockArray(resolved, state);
    return;
  }

  appendResolvedBlockNode(resolved, state);
};

const appendBlockArray = (nodes: readonly MarkdownNode[], state: BlockRenderState): void => {
  for (const child of nodes) {
    appendBlockNode(child, state);
  }
};

const appendResolvedBlockNode = (node: MarkdownNode, state: BlockRenderState): void => {
  if (isBlockNode(node)) {
    flushInlineChildren(state);
    state.blocks.push(state.api.renderBlock(node, state.context));
    return;
  }

  state.inlineChildren.push(node);
};

const flushInlineChildren = (state: BlockRenderState): void => {
  if (state.inlineChildren.length > 0) {
    state.blocks.push(
      state.inlineChildren.map((child) => state.api.renderInline(child, state.context)).join(""),
    );
  }

  state.inlineChildren = [];
};
