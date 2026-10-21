// Host side with supervisor: restarts crashed WASM actors.
// Advanced: host tracks actor health, restarts on crash with backoff.

class WasmActorHost {
  constructor() {
    this.actors = new Map();
    this.nameToId = new Map();
    this.nextId = 1;
    this.currentActorId = null;
    this.restartCounts = new Map(); // id -> count
    this.maxRestarts = 3;
    this.restartDelayMs = 1000;
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
          this.requestStop(this.currentActorId);
        },
        host_crash: (reasonPtr, reasonSize) => {
          // Actor signals it has crashed; host schedules a restart
          this.handleCrash(this.currentActorId);
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
      stopped: false,
      crashed: false
    };
    this.actors.set(id, actor);
    this.restartCounts.set(id, 0);
    if (name) this.nameToId.set(name, id);

    const apiPtr = this.allocateApiStruct(id);
    actor.exports.actor_main(apiPtr, 0);

    return id;
  }

  lookupActor(name) {
    return this.nameToId.get(name);
  }

  routeMessage(destId, type, payloadPtr, payloadSize) {
    const dest = this.actors.get(destId);
    if (!dest || dest.stopped || dest.crashed) return;
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

  requestStop(actorId) {
    const actor = this.actors.get(actorId);
    if (actor) actor.stopped = true;
  }

  handleCrash(actorId) {
    const actor = this.actors.get(actorId);
    if (!actor) return;
    actor.crashed = true;
    const count = (this.restartCounts.get(actorId) || 0) + 1;
    this.restartCounts.set(actorId, count);
    console.warn(`[supervisor] actor ${actor.name} (${id}) crashed, restart ${count}/${this.maxRestarts}`);

    if (count <= this.maxRestarts) {
      setTimeout(() => this.restartActor(actorId), this.restartDelayMs);
    } else {
      actor.stopped = true;
      console.error(`[supervisor] actor ${actor.name} exceeded max restarts, stopping`);
    }
  }

  async restartActor(actorId) {
    const actor = this.actors.get(actorId);
    if (!actor) return;
    actor.crashed = false;
    actor.stopped = false;
    actor.mailbox = [];
    console.info(`[supervisor] restarting actor ${actor.name}`);
    // Re-invoke actor_main
    try {
      const apiPtr = this.allocateApiStruct(actorId);
      actor.exports.actor_main(apiPtr, 0);
    } catch (e) {
      console.error(`[supervisor] restart failed for ${actor.name}:`, e);
      actor.crashed = true;
    }
  }

  allocateApiStruct(actorId) {
    return 0;
  }

  get memory() {
    const first = this.actors.values().next().value;
    return first ? first.instance.exports.memory : null;
  }
}

module.exports = { WasmActorHost };
