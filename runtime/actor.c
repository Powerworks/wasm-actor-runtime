#include "actor.h"
#include <string.h>

#define MAX_MAILBOX 16

static WasmMessage g_mailbox[MAX_MAILBOX];
static size_t      g_mailbox_len = 0;
static bool        g_stopped = false;

/* Host sends a message into this actor's mailbox.
 * Called from WASI host context; copies payload into mailbox storage. */
void actor_mailbox_push(int src_actor_id, int msg_type, const void *payload, size_t payload_size) {
    if (g_mailbox_len >= MAX_MAILBOX) return; /* backpressure: drop if full */

    WasmMessage *m = &g_mailbox[g_mailbox_len++];
    m->src_actor_id = src_actor_id;
    m->msg_type = msg_type;
    m->payload_size = payload_size;
    m->payload = NULL;

    if (payload_size > 0 && payload) {
        m->payload = malloc(payload_size);
        if (m->payload) memcpy(m->payload, payload, payload_size);
    }
}

/* Actor receives one message from its mailbox.
 * Returns 1 if a message was delivered, 0 if mailbox empty. */
int actor_receive(WasmMessage *out) {
    if (g_mailbox_len == 0) return 0;

    *out = g_mailbox[0];
    memmove(g_mailbox, g_mailbox + 1, (g_mailbox_len - 1) * sizeof(WasmMessage));
    g_mailbox_len--;
    return 1;
}

void actor_stop(void) {
    g_stopped = true;
}

bool actor_is_stopped(void) {
    return g_stopped;
}

/* Exported to host via linker */
void host_send(int dest_actor_id, int msg_type, const void *payload, size_t payload_size) {
    /* Implemented by host: routes message to destination actor's mailbox */
}

int host_receive(void *payload_out, size_t payload_out_size) {
    /* Implemented by host: blocks/polls for next message */
    return 0;
}

void host_stop(void) {
    actor_stop();
}
