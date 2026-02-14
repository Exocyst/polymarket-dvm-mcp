import NDK, { NDKEvent, NDKPrivateKeySigner, type NDKFilter } from '@nostr-dev-kit/ndk';
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

export interface Market {
    id: string;
    question: string;
    description: string;
    outcomes: { name: string; price: number }[];
    volume: number;
    volume24h: number;
    liquidity: number;
    url: string;
    end_date: string;
}

export interface SearchResult {
    results: Market[];
    fee_charged?: number;
}

export interface SummaryResult {
    market_data: Market;
    ai_summary: string;
    fee_charged?: number;
}

export interface FeedbackResult {
    status: string;
    amount?: string;
    invoice?: string;
    content?: string;
}

export class NostrClient {
    private ndk: NDK;

    constructor(signer?: NDKPrivateKeySigner) {
        this.ndk = new NDK({
            explicitRelayUrls: RELAYS,
            signer: signer || NDKPrivateKeySigner.generate(),
        });
    }

    async connect() {
        await this.ndk.connect();
        console.error('Connected to relays');
    }

    async requestSearch(query: string): Promise<SearchResult | FeedbackResult> {
        const event = new NDKEvent(this.ndk);
        event.kind = KIND_SEARCH_REQUEST;
        event.content = query;
        event.tags = [
            ['p', DVM_PUBKEY],
            ['i', query],
        ];

        await event.publish();
        return await this.waitForDVM<SearchResult | FeedbackResult>(event, [KIND_SEARCH_RESULT, KIND_FEEDBACK]);
    }

    async requestSummary(marketId: string): Promise<SummaryResult | FeedbackResult> {
        const event = new NDKEvent(this.ndk);
        event.kind = KIND_SUMMARY_REQUEST;
        event.content = marketId;
        event.tags = [
            ['p', DVM_PUBKEY],
            ['i', marketId],
        ];

        await event.publish();
        return this.waitForDVM<SummaryResult | FeedbackResult>(event, [KIND_SUMMARY_RESULT, KIND_FEEDBACK]);
    }

    private async waitForDVM<T>(requestEvent: NDKEvent, kinds: number[], timeoutMs = 60000): Promise<T> {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const filter: NDKFilter = {
                kinds: kinds,
                '#e': [requestEvent.id],
                authors: [DVM_PUBKEY],
            };

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    sub.stop();
                    reject(new Error(`Timeout waiting for DVM response (Event ID: ${requestEvent.id})`));
                }
            }, timeoutMs);

            const sub = this.ndk.subscribe(filter, { closeOnEose: false });

            sub.on('event', (event: NDKEvent) => {
                if (resolved) return;
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
                        } as unknown as T);
                    } else {
                        resolve(JSON.parse(event.content));
                    }
                } catch (e) {
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
