# Compounding series

This is **repo #8** in the compounding sequence.

## Sequence

| # | Repo | Language/Stack | Core idea extracted |
|---|------|----------------|---------------------|
| 1 | `c-message-passing` | C99 | Actor message passing, mailbox isolation |
| 2 | `ada-contract-state-machine` | Ada 2012 | Design-by-contract, protected objects |
| 3 | `soa-contract-first` | C99 / HTTP/JSON | Service contracts as bounded boundaries |
| 4 | `elixir-supervision-pool` | Elixir / OTP | Supervision trees, let-it-crash |
| 5 | `swift-notes-offline-first` | Swift / SwiftUI | Value types, actors, offline-first UI |
| 6 | `react-native-promise-era` | JavaScript / React Native | Promises, async/await, JS↔Native bridge |
| 7 | `kotlin-tasks-multiplatform` | Kotlin Multiplatform | Structured concurrency, repository protocol |
| 8 | `wasm-actor-runtime` | C → WASM | Sandboxed message passing at bytecode level |
| 9 | `ebpf-observability` | C + eBPF | Programmable kernelspace tracing & networking |
| 10 | `http3-message-gateway` | C / HTTP/3 | QUIC-based message transport, datagram-first semantics |

## What this repo contributes downstream

- **From C message passing:** Mailbox semantics → WASM mailboxes; host becomes the scheduler.
- **From Elixir:** Actor isolation → WASM linear memory; no built-in supervisor, host must restart.
- **To eBPF:** WASM message passing → observable via eBPF traces on host syscalls.
- **To HTTP/3:** WASM actors as QUIC datagram handlers; sandboxed per-connection actors.

## Obsidian links

[[Programming/C|c-message-passing]]  
[[Programming/Elixir|elixir-supervision-pool]]  
[[Programming/WebAssembly|WASM actor-runtime]]  
[[Programming/eBPF|ebpf-observability (planned)]]
