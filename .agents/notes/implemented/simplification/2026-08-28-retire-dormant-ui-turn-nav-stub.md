# Agent Note: Remove the dormant ui-turn-nav stub

Status: implemented

English | [中文](2026-08-28-retire-dormant-ui-turn-nav-stub.zh.md)

## Problem

The fork shipped `packages/client/ui-turn-nav` as its turn-navigation rail while upstream had none. Upstream's dsh-0.1.2-alpha.1 release, synced into master on 2026-08-28, rewrote the web client and now ships the capability itself: `packages/client/ui-chat` renders the rail (`TurnNavigator`, wired into `ChatView`). What remained on master was the PR #3 placeholder stub — `apply()` was a no-op — so the package held a web-app bundle entry, a bundle dependency line, a `tsconfig.client.json` project reference, and lockfile weight while contributing nothing. The fuller left-rail reimplementation lives only on the retired branch `fix/bypass-ui-conversation`, whose code targets the pre-rewrite client architecture (`@deepseek-ai/dsh-client-runtime`, the `conversation.rail` slot point) that no longer exists on master.

## Decision

Master no longer carries `ui-turn-nav`. The removal deletes the package, its web-app bundle entry and dependency, and its client-face project reference, and regenerates `pnpm-lock.yaml`. Turn navigation ships from `packages/client/ui-chat`; the `apps/web` e2e coverage addresses the rail through the `Turn navigation` navigation role, which ui-chat's locale provides, so that coverage does not depend on the removed package.

## Alternatives considered

**Keep the stub dormant.** Rejected: it held bundle wiring, a project reference, and lockfile weight for a no-op plugin, and its name invites confusion with ui-chat's live implementation.

**Port the branch's left-rail design onto the new implementation now.** Rejected for this change: the upstream rail owns the integration points (chat-view rendering, snapshot turn items), so the port is product work with no standing demand. The retired branch keeps the design as history; a future port would extend ui-chat's `TurnNavigator`, not revive this package.

## Consequences

- The web client has exactly one turn-navigation implementation, upstream's; on this fork's master the removal also returns the client UI i18n gate to green.
- Reintroducing a fork rail variant means extending ui-chat's `TurnNavigator`; nothing on the removed path survives to build on.
