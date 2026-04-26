/** @jsxRuntime automatic */
/** @jsxImportSource jsx2md */
import { Doc } from "jsx2md";
import { TaskItem, TaskList } from "@jsx2md/github";

export default (
  <Doc>
    <h1>{"Migration Example"}</h1>
    <p>{"Markdown can be converted to TSX while preserving the document structure."}</p>
    <TaskList>
      <TaskItem checked>{"Keep task list state"}</TaskItem>
      <TaskItem>{"Review generated components"}</TaskItem>
    </TaskList>
    <table>
      <thead>
        <tr>
          <th>{"Area"}</th>
          <th>{"Status"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{"API"}</td>
          <td>{"Stable"}</td>
        </tr>
      </tbody>
    </table>
    <pre lang="ts">{'export const value = "from markdown";'}</pre>
  </Doc>
);
