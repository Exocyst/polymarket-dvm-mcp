import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import WebSocket from 'ws';
// Required for NDK in Node.js
// @ts-ignore
global.WebSocket = WebSocket;
export const DVM_PUBKEY = '813c654f1b7a4996c8f4769079288a0eace4380dd55e71949116100759b9dddc';
export const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net'];
export const KIND_SEARCH_REQUEST = 5005;
export const KIND_SEARCH_RESULT = 6005;
export const KIND_SUMMARY_REQUEST = 5001;
export const KIND_SUMMARY_RESULT = 6001;
export const KIND_FEEDBACK = 7000;
export class NostrClient {
    ndk;
    constructor(signer) {
        this.ndk = new NDK({
            explicitRelayUrls: RELAYS,
            signer: signer || NDKPrivateKeySigner.generate(),
        });
    }
    async connect() {
        await this.ndk.connect();
        console.error('Connected to relays');
    }
    async requestSearch(query) {
        const event = new NDKEvent(this.ndk);
        event.kind = KIND_SEARCH_REQUEST;
        event.content = query;
        event.tags = [
            ['p', DVM_PUBKEY],
            ['i', query],
        ];
        await event.publish();
        return await this.waitForDVM(event, [KIND_SEARCH_RESULT, KIND_FEEDBACK]);
    }
    async requestSummary(marketId) {
        const event = new NDKEvent(this.ndk);
        event.kind = KIND_SUMMARY_REQUEST;
        event.content = marketId;
        event.tags = [
            ['p', DVM_PUBKEY],
            ['i', marketId],
        ];
        await event.publish();
        return this.waitForDVM(event, [KIND_SUMMARY_RESULT, KIND_FEEDBACK]);
    }
    async waitForDVM(requestEvent, kinds, timeoutMs = 60000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const filter = {
                kinds: kinds,
                '#e': [requestEvent.id],
            };
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    sub.stop();
                    reject(new Error(`Timeout waiting for DVM response (Event ID: ${requestEvent.id})`));
                }
            }, timeoutMs);
            const sub = this.ndk.subscribe(filter, { closeOnEose: false });
            sub.on('event', (event) => {
                if (resolved)
                    return;
                resolved = true;
                clearTimeout(timeout);
                sub.stop();
                try {
                    if (event.kind === KIND_FEEDBACK) {
                        const statusTag = event.tags.find(t => t[0] === 'status');
                        const amountTag = event.tags.find(t => t[0] === 'amount');
                        resolve({
                            status: statusTag ? statusTag[1] : 'unknown',
                            amount: amountTag ? amountTag[1] : undefined,
                            invoice: amountTag ? amountTag[2] : undefined,
                            content: event.content
                        });
                    }
                    else {
                        resolve(JSON.parse(event.content));
                    }
                }
                catch (e) {
                    reject(new Error(`Failed to parse DVM response: ${e}`));
                }
            });
        });
    }
    async close() {
        // NDK doesn't have a direct close, but we can stop all subs if needed.
        // Relays are handled by NDK internally.
    }
}
