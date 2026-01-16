import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nanoid } from 'nanoid';
import { authOptions } from '@/lib/auth';
import { getMessages, sendMessage, getRoomId, isContact } from '@/lib/redis';
import { pusherServer, getPrivateChatChannel, getUserChannel, PUSHER_EVENTS } from '@/lib/pusher';

// GET /api/messages?roomId=xxx&limit=50&before=timestamp
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        const limit = parseInt(searchParams.get('limit') ?? '50');
        const before = searchParams.get('before');

        if (!roomId) {
            return NextResponse.json(
                { error: 'Room ID required' },
                { status: 400 }
            );
        }

        // Verify user is part of this chat room
        const [userId1, userId2] = roomId.split('_');
        if (userId1 !== session.user.id && userId2 !== session.user.id) {
            return NextResponse.json(
                { error: 'Access denied to this chat' },
                { status: 403 }
            );
        }

        const messages = await getMessages(
            roomId,
            limit,
            before ? parseInt(before) : undefined
        );

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { recipientId, content, optimisticId } = body;

        if (!recipientId || !content) {
            return NextResponse.json(
                { error: 'Recipient ID and content are required' },
                { status: 400 }
            );
        }

        // Validate content length
        if (content.length > 2000) {
            return NextResponse.json(
                { error: 'Message too long (max 2000 characters)' },
                { status: 400 }
            );
        }

        // Check if they are contacts
        const areContacts = await isContact(session.user.id, recipientId);
        if (!areContacts) {
            return NextResponse.json(
                { error: 'Can only message contacts' },
                { status: 403 }
            );
        }

        const roomId = getRoomId(session.user.id, recipientId);
        const message = {
            id: nanoid(),
            senderId: session.user.id,
            content: content.trim(),
            timestamp: Date.now(),
        };

        // Save to Redis
        await sendMessage(roomId, message);

        // Broadcast via Pusher (include optimisticId so sender can deduplicate)
        await pusherServer.trigger(
            getPrivateChatChannel(roomId),
            PUSHER_EVENTS.NEW_MESSAGE,
            {
                ...message,
                senderUsername: session.user.username,
                optimisticId, // Pass this back to client
            }
        );

        // Notify recipient globally (for sidebar update)
        // Only notify if they are not the sender (obviously)
        if (recipientId !== session.user.id) {
            await pusherServer.trigger(
                getUserChannel(recipientId),
                PUSHER_EVENTS.INCOMING_MESSAGE,
                {
                    roomId,
                    senderId: session.user.id,
                    username: session.user.username,
                    content: message.content,
                    timestamp: message.timestamp,
                }
            );
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
