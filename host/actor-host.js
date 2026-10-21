// Host side: loads WASM actor modules, routes messages between their mailboxes.
// Node.js example using @wasmer/wasi or wasmtime.

class WasmActorHost {
  constructor() {
    this.actors = new Map();   // id -> { instance, mailbox, api }
    this.nextId = 1;
  }

  async loadActor(wasmBytes, name) {
    const instance = await WebAssembly.instantiate(wasmBytes, {
      env: {
        host_send: (dest, type, payloadPtr, payloadSize) => {
          this.routeMessage(dest, type, payloadPtr, payloadSize);
        },
        host_receive: (payloadOutPtr, payloadOutSize) => {
          return this.pollMailbox(this.currentActorId, payloadOutPtr, payloadOutSize);
        },
        host_stop: () => {
          this.stopActor(this.currentActorId);
        }
      }
    });

    const id = this.nextId++;
    const actor = {
      id,
      name,
      instance,
      mailbox: [],
      exports: instance.exports
    };
    this.actors.set(id, actor);

    // Call actor_main with a pointer to the API struct
    const apiPtr = this.allocateApiStruct(id);
    actor.exports.actor_main(apiPtr, 0);

    return id;
  }

  routeMessage(destId, type, payloadPtr, payloadSize) {
    const dest = this.actors.get(destId);
    if (!dest) return;
    const payload = new Uint8Array(this.memory.buffer, payloadPtr, payloadSize);
    dest.mailbox.push({ src: this.currentActorId, type, payload: payload.slice() });
  }

  pollMailbox(actorId, payloadOutPtr, payloadOutSize) {
    const actor = this.actors.get(actorId);
    if (!actor || actor.mailbox.length === 0) return 0;
    const msg = actor.mailbox.shift();
    // Copy msg.payload into actor linear memory at payloadOutPtr
    new Uint8Array(this.memory.buffer, payloadOutPtr, msg.payload.length).set(msg.payload);
    return msg.type;
  }

  stopActor(actorId) {
    const actor = this.actors.get(actorId);
    if (actor) actor.stopped = true;
  }

  allocateApiStruct(actorId) {
    // Allocate a small struct in WASM memory pointing to host_send/receive/stop
    // Simplified: returns a pointer the actor can use to call host functions
    return 0;
  }

  get memory() {
    // Return the shared WASM memory (first actor's memory, or a shared one)
    return this.actors.values().next().value.instance.exports.memory;
  }
}

module.exports = { WasmActorHost };
