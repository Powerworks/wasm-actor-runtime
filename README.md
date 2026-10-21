# wasm-actor-runtime

Actor model compiled to WebAssembly — sandboxed message passing at the bytecode level.

**Thesis:** WebAssembly brings the actor model to the browser and edge: isolated linear memory per module, asynchronous message passing between instances, no shared mutable state by default. This is the C message-passing runtime (repo #1) re-expressed at the bytecode level — sandboxing as the isolation boundary instead of OS processes.

This is **repo #8** in the compounding series on `github.com/Powerworks`:

```
C message passing  ──►  Ada contracts  ──►  SOA services  ──►  Elixir actors  ──►  Swift mobile  ──►  React Native async  ──►  Kotlin mobile  ──►  WASM actors  ──►  eBPF observability  ──►  HTTP/3 gateway
                                                     └── (healthcare track: hl7-mirth-2019)
```

## What's inside

| Path | Purpose |
|------|---------|
| `runtime/` | C source: actor runtime compiled to WASM (mailbox, send/receive, scheduler) |
| `wasi/` | WASI bindings: host calls for messaging between WASM instances |
| `host/` | Node.js / Python host: loads WASM modules, routes messages between actors |
| `actors/` | Example WASM-compiled actors (ping/pong, worker pool) |
| `design/` | System design narrative, ADRs, Mermaid diagrams |
| `architecture/` | Principal-level architecture extract (Obsidian-friendly) |
| `docs/` | Compounding links to previous/next projects |

## Build & run

Requires **clang/lld** with WASM target (`wasm32-unknown-wasi`) and **Node.js** or **Python** host.

```bash
# Compile actor runtime to WASM
clang --target=wasm32-unknown-wasi -O2 -o runtime/actor.wasm runtime/actor.c

# Run host
node host/actor-host.js runtime/actor.wasm actors/ping.wasm actors/pong.wasm
```

## Design summary

- **Linear memory isolation** — each WASM instance owns its memory; actors cannot touch each other's heap
- **Message passing** — host copies payload bytes between WASM linear memories (deep copy, no shared memory)
- **Asynchronous** — `send` is non-blocking; `receive` polls or waits on host-provided mailbox
- **No threads** — single-threaded event loop per actor; cooperative scheduling by the host

See `design/README.md` for the full system design and `architecture/ARCHITECTURE.md` for the principal-level extract.
