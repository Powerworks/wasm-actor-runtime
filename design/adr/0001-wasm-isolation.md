# ADR 0001 — WASM linear memory as isolation boundary

## Status

Accepted

## Context

Actor isolation can be enforced at several layers:
1. **OS processes** (C message passing, repo #1) — heavy, slow context switch
2. **BEAM processes** (Elixir/OTP, repo #4) — lightweight, VM-managed
3. **WASM linear memory** (this repo) — bytecode-level sandbox, fast, portable

We chose WASM because:
- Isolation is enforced by the runtime, not by convention
- Modules are portable across browsers, edge, and server
- Linear memory is a hard boundary — code cannot escape its sandbox
- Fast startup, low memory overhead compared to processes

## Decision

Actor logic compiles to WASM. Each actor gets its own linear memory instance. Messages are deep-copied between instances by the host.

## Consequences

### Positive

- **Hard sandbox** — actors cannot read/write each other's memory
- **Portable** — same `.wasm` runs in browser, Node.js, Wasmtime, Wasmer
- **Fast** — sub-millisecond cold start, no process overhead

### Negative

- **No preemption** — a WASM actor that loops forever blocks the host thread (unless the host uses time-slicing)
- **Copy cost** — every message payload is copied between linear memories
- **No native threads** — parallelism requires multiple host threads, each running its own WASM instance

## Related

- [[../architecture/ARCHITECTURE]] — principal extract
- [[../../c-message-passing/architecture/ARCHITECTURE|C message passing]] — same mailbox/send/receive semantics, different isolation boundary
- [[../../elixir-supervision-pool/architecture/ARCHITECTURE|Elixir supervision]] — WASM has no built-in supervisor; host must implement restart logic
