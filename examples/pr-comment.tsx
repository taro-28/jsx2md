/** @jsxRuntime automatic */
/** @jsxImportSource jsx2md */
import { Alert, Details, TaskItem, TaskList } from "@jsx2md/github";
import { Doc, type MarkdownNode, Section } from "jsx2md";

export interface PullRequestCommentProps {
  readonly changedFiles: readonly string[];
  readonly checksPassed: boolean;
  readonly summary: string;
}

const PullRequestComment = (props: PullRequestCommentProps): MarkdownNode => (
  <Doc>
    <Section title="Review Summary">
      <p>{props.summary}</p>
      {props.checksPassed ? (
        <Alert variant="tip">All required checks passed.</Alert>
      ) : (
        <Alert variant="warning">At least one required check is failing.</Alert>
      )}
      <Details summary="Changed files">
        <TaskList>
          {props.changedFiles.map((file) => (
            <TaskItem checked={props.checksPassed}>
              <code>{file}</code>
            </TaskItem>
          ))}
        </TaskList>
      </Details>
    </Section>
  </Doc>
);

// oxlint-disable-next-line import/no-default-export -- TSX entries are loaded by the CLI through their default export.
export default PullRequestComment;
