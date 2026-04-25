import type { Adapter, AdapterName } from "./types.js";

const features = (values: Adapter["features"]): Adapter["features"] => values;

export const markdownAdapter: Adapter = {
  features: features(new Set()),
  name: "markdown",
};

export const gfmAdapter: Adapter = {
  features: features(new Set(["gfm", "table", "taskList", "footnote"])),
  name: "gfm",
};

export const githubAdapter: Adapter = {
  features: features(
    new Set([
      "gfm",
      "github",
      "table",
      "taskList",
      "alert",
      "details",
      "suggestion",
      "diagram",
      "html",
      "footnote",
    ]),
  ),
  name: "github",
};

export const adapterFromName = (name: AdapterName): Adapter => {
  if (name === "markdown") {
    return markdownAdapter;
  }

  if (name === "gfm") {
    return gfmAdapter;
  }

  return githubAdapter;
};
