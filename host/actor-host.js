// Host side: loads multiple WASM actor modules, routes messages between their mailboxes.
// Intermediate: multiple actors with named lookup and host-managed mailbox routing.

class WasmActorHost {
  constructor() {
    this.actors = new Map();   // id -> { instance, mailbox, name, exports, stopped }
    this.nameToId = new Map(); // name -> id
    this.nextId = 1;
    this.currentActorId = null;
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
      exports: instance.exports,
      stopped: false
    };
    this.actors.set(id, actor);
    if (name) this.nameToId.set(name, id);

    // Call actor_main with a pointer to the API struct
    const apiPtr = this.allocateApiStruct(id);
    actor.exports.actor_main(apiPtr, 0);

    return id;
  }

  lookupActor(name) {
    return this.nameToId.get(name);
  }

  routeMessage(destId, type, payloadPtr, payloadSize) {
    const dest = this.actors.get(destId);
    if (!dest || dest.stopped) return;
    const payload = new Uint8Array(this.memory.buffer, payloadPtr, payloadSize);
    dest.mailbox.push({ src: this.currentActorId, type, payload: payload.slice() });
  }

  pollMailbox(actorId, payloadOutPtr, payloadOutSize) {
    const actor = this.actors.get(actorId);
    if (!actor || actor.mailbox.length === 0) return 0;
    const msg = actor.mailbox.shift();
    new Uint8Array(this.memory.buffer, payloadOutPtr, msg.payload.length).set(msg.payload);
    return msg.type;
  }

  stopActor(actorId) {
    const actor = this.actors.get(actorId);
    if (actor) actor.stopped = true;
  }

  allocateApiStruct(actorId) {
    // Simplified: returns a pointer the actor can use to call host functions
    return 0;
  }

  get memory() {
    const first = this.actors.values().next().value;
    return first ? first.instance.exports.memory : null;
  }

  // Run one round: give each live actor one turn
  runRound() {
    for (const [id, actor] of this.actors) {
      if (actor.stopped) continue;
      this.currentActorId = id;
      try {
        // The actor's actor_main was already called at load; 
        // here we'd typically trigger a message-processing tick
        // In this simplified model, actors process on host-driven ticks
      } finally {
        this.currentActorId = null;
      }
    }
  }
}

module.exports = { WasmActorHost };
