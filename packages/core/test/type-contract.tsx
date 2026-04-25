/** @jsxImportSource jsx2md */
import { Doc, render } from "jsx2md";
import { Alert } from "@jsx2md/github";

render(
  <Doc>
    <a href="https://example.com">Example</a>
    <img src="logo.png" alt="Logo" />
    <Alert variant="note">Typed GitHub component</Alert>
  </Doc>,
  { adapter: "github" },
);

// @ts-expect-error links require href.
<a>Missing href</a>;

// @ts-expect-error images require src.
<img alt="Missing source" />;

// @ts-expect-error alerts accept only documented variants.
<Alert variant="unknown">Invalid variant</Alert>;
