# @deepseek-ai/dsh-client-ui-turn-nav

English | [中文](README.zh.md)

Turn navigation rail for jumping between loaded conversation rounds in the DeepSeek Harness web GUI.

## Overview

This package provides a vertical navigation rail displayed alongside the conversation scroll area. It shows loaded turn numbers and allows users to quickly navigate between conversation turns.

## Features

- Automatically detects turn markers in the conversation DOM
- Highlights the currently visible turn
- Smooth scroll-to-turn on click
- Responsive to dynamic content changes via MutationObserver

## Model Experience

This package has no model-facing impact. It is a pure UI navigation aid.

## Known Limitations and Deferred Work

- Performance with very large conversation histories (>100 turns) is not optimized
- Keyboard navigation between turns is not yet implementedEOF
