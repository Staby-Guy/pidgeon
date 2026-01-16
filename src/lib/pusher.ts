import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
    if (!pusherClientInstance) {
        pusherClientInstance = new PusherClient(
            process.env.NEXT_PUBLIC_PUSHER_KEY!,
            {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            }
        );
    }
    return pusherClientInstance;
};

// Channel naming conventions
export const getPrivateChatChannel = (roomId: string) => `chat-${roomId}`;
export const getUserChannel = (userId: string) => `user-${userId}`;

// Event names
export const PUSHER_EVENTS = {
    NEW_MESSAGE: 'new-message',
    CONTACT_ADDED: 'contact-added',
    TYPING: 'typing',
    INCOMING_MESSAGE: 'incoming-message',
} as const;
