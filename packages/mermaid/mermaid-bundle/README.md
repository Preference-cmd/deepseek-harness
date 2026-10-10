---
description: "Return Mermaid diagram source for browser-side rendering."
kind: "package-bundle"
---

# @deepseek-ai/dsh-mermaid-bundle

English | [中文](README.zh.md)

## Summary

Add the model-facing `mermaid_render` tool to a profile. The tool validates that a diagram is non-empty and returns its source unchanged; the web client renders the returned fenced source as a zoomable diagram. The bundle ships switched off. Select it to enable it.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitensions-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Installation and composition are separate: installing this package does not mount it, and the profile must select the bundle before its row can be configured.

```sh
dsh plugin --profile web add @deepseek-ai/dsh-mermaid-bundle
```

A profile that selects the bundle can then override the inserted row by id. A profile that does not select it never registers the tool.

Enabling or disabling the bundle registers or removes `mermaid_render` in the running Host, so every Agent sees the change on its next request.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation details — click to expand</summary>

[`cordis.patch.yml`](cordis.patch.yml) inserts the row `optional-mermaid-diagrams`, which loads the tool plugin into the global tool layer. The [profile composer](../../boot/app-boot/README.md) owns patch ordering and errors.

This bundle carries no runtime code of its own; [`src/index.ts`](src/index.ts) is empty because every runtime entry is declared in the patch.

The web renderer is **not** part of this bundle. `mermaid.tsx` lives in [`ui-primitives`](../../client/ui-primitives/README.md), because the harness has no seam for a plugin to contribute client UI. A settled ```mermaid fence therefore renders in the web client whether or not this bundle is selected; the bundle only decides whether the model can ask for a diagram directly.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

[Capability implementation](../tool-mermaid/README.md)

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the [capability implementation](../tool-mermaid/README.md), which owns model context and results.

#### KV Cache effect

The layer adds no request content directly; the capability implementation owns cache effects from tools, prompts, and results. Toggling the bundle changes the tool list of live Sessions, which invalidates their cached request prefix once.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The web renderer stays in `ui-primitives`. The fork keeps patching that package until the harness gains a client-UI plugin seam, so the renderer half of this feature still carries upstream merge cost.
- Diagram source is never parsed on the Host. A syntactically invalid diagram reaches the client, which renders a syntax error in place of the diagram.

-----

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Maintainer context — click to expand</summary>

The package name keeps the `@deepseek-ai/dsh-` prefix because `scripts/gen-tsconfig-paths.ts` only emits `tsconfig.base.json` path aliases for that prefix, and `scripts/check-workspace-constraints.ts` applies its `@deepseek-ai/cordis` peer rules to it. Publishing under a fork-owned npm scope means renaming the package and adding the alias generation the fork needs.

</details>