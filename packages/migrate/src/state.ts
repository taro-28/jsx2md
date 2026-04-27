export interface MigrationState {
  readonly gfmImports: Set<string>;
  readonly githubImports: Set<string>;
  readonly diagnostics: string[];
  readonly source: string;
}
