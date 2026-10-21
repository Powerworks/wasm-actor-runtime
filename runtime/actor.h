#ifndef ACTOR_WASM_H
#define ACTOR_WASM_H

#include <stddef.h>
#include <stdbool.h>

/* WASM actor: exposed to the host via WASI-style exports */
typedef struct {
    void (*send)(int dest_actor_id, int msg_type, const void *payload, size_t payload_size);
    int  (*receive)(void *payload_out, size_t payload_out_size);
    void (*stop)(void);
} ActorAPI;

/* Actor main: called by host with a pointer to the host-provided API */
typedef void (*ActorMain)(ActorAPI *api, void *state);

/* Mailbox message */
typedef struct {
    int        src_actor_id;
    int        msg_type;
    uint8_t   *payload;
    size_t     payload_size;
} WasmMessage;

/* Host exports available to WASM actors */
extern void host_send(int dest_actor_id, int msg_type, const void *payload, size_t payload_size);
extern int  host_receive(void *payload_out, size_t payload_out_size);
extern void host_stop(void);

/* Actor entry point signature expected by the host */
void actor_main(ActorAPI *api, void *state);

#endif
