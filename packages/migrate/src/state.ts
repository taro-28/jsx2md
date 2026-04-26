export interface MigrationState {
  readonly githubImports: Set<string>;
  readonly diagnostics: string[];
  readonly source: string;
}
