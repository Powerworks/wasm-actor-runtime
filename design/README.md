# System design — wasm-actor-runtime

## Scope

A WebAssembly actor runtime: actor logic compiled from C to WASM, message passing between WASM instances via a host router. Isolation is provided by WASM linear memory boundaries, not OS processes.

This is **C message passing at the bytecode level** — the same mailbox/send/receive semantics as repo #1, but the isolation boundary is a WASM sandbox instead of a process.

## Components

### Actor runtime (`runtime/actor.c` / `.h`)

C code compiled to WASM. Exposes `actor_main(ActorAPI *, void *)` to the host. The API struct contains function pointers to `host_send`, `host_receive`, `host_stop`.

### Mailbox

Per-actor message queue stored in the actor's linear memory. Messages are deep-copied from sender to receiver by the host — actors never share memory.

### Host (`host/actor-host.js`)

Loads WASM modules, provides the `ActorAPI` implementation, routes messages between actor mailboxes, and schedules actor turns (cooperative, round-robin).

## Isolation model

| Boundary | Mechanism |
|----------|-----------|
| Actor → Actor | WASM linear memory isolation; host deep-copies payloads |
| Actor → Host | WASI-style function imports (host_send/receive/stop) |
| Host → Actor | Exported function calls (`actor_main`) |

No shared memory between actors by default. If shared memory is needed, it must be explicitly exported via `WebAssembly.Memory` and shared — an opt-in, dangerous operation.

## Scheduling

Cooperative, single-threaded event loop per actor instance. The host gives each actor one turn per round; actors yield by returning from `actor_main` or by calling `host_receive` when their mailbox is empty.

## Decisions recorded

See `design/adr/0001-wasm-isolation.md`.

## Diagrams

See `design/diagrams/wasm-actor-topology.mmd`.
