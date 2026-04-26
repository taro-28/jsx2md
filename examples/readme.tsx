/** @jsxRuntime automatic */
/** @jsxImportSource jsx2md */
import { Doc, Section } from "jsx2md";

export default (
  <Doc>
    <Section title="Example Project">
      <p>This README is generated from a TSX document.</p>
      <Section title="Usage">
        <pre lang="sh">{"pnpm jsx2md render examples/readme.tsx -o README.md"}</pre>
      </Section>
    </Section>
  </Doc>
);
