# Architecture extract — wasm-actor-runtime

**Level:** Principal  
**Purpose:** Extract architecture-relevant bits that compound into the next projects in this series.  
**Format:** Obsidian-friendly markdown with `[[wikilinks]]`.

## Signal (carry forward)

| Pattern | Observation | Why it matters |
|---------|-------------|----------------|
| **WASM linear memory as isolation** | Each actor has private memory; host deep-copies messages. | Sandboxing without processes — the same isolation goal as C actors, cheaper. |
| **Host-router message passing** | Host routes `send`/`receive` between WASM instances. | The host is the mailbox server; actors are pure functions of their mailbox. |
| **Cooperative scheduling** | Host round-robins actors; actors yield on `receive`. | Predictable, no preemption — matches the C scheduler (repo #1). |
| **Deep-copy semantics** | Payloads copied, never shared. | No data races by construction — same guarantee as C actors and Elixir processes. |

## Noise (deliberately skipped at this layer)

- **WASM threads / shared memory** — opt-in, breaks isolation if misused.
- **Component Model / WIT** — future standardization, not needed for the reference.
- **Garbage collection** — WASM GC proposal is emerging; manual memory management for now.

## Principal takeaway

> Isolation is a property of the memory boundary. WASM linear memory gives us process-like isolation at bytecode speed — the same architectural goal as C actors, Elixir processes, and Swift actors, achieved through sandboxing rather than OS or VM mechanisms.

## Compounds into

- [[../../c-message-passing/architecture/ARCHITECTURE|C message passing]] — same semantics, WASM instead of OS processes
- [[../../elixir-supervision-pool/architecture/ARCHITECTURE|Elixir supervision]] — WASM has no built-in supervisor; host must implement restart logic
- [[../../swift-notes-offline-first/architecture/ARCHITECTURE|Swift actors]] — language-level isolation vs WASM sandbox isolation
- [[../ebpf-observability/docs/COMPOUNDING|eBPF (planned)]] — kernelspace observability of WASM message passing
- [[../http3-message-gateway/docs/COMPOUNDING|HTTP/3 (planned)]] — WASM actors as HTTP/3 message handlers
