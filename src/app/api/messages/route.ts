import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nanoid } from 'nanoid';
import { authOptions } from '@/lib/auth';
import { getMessages, sendMessage, getRoomId, isContact, incrementUnreadCount, resetUnreadCount, updateMessage, deleteMessage } from '@/lib/redis';
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

        // Reset unread count for this room
        await resetUnreadCount(session.user.id, roomId);

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
            // Increment unread count for recipient
            await incrementUnreadCount(recipientId, roomId);

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

// PATCH /api/messages - Update a message
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { roomId, messageId, timestamp, content } = body;

        console.log('[API] PATCH Request:', { roomId, messageId, timestamp, content });

        if (!roomId || !messageId || !timestamp || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify ownership
        const [userId1, userId2] = roomId.split('_');
        if (userId1 !== session.user.id && userId2 !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Attempt update
        const success = await updateMessage(roomId, messageId, timestamp, content.trim());

        if (!success) {
            return NextResponse.json({ error: 'Message not found or update failed' }, { status: 404 });
        }

        // Broadcast update
        await pusherServer.trigger(
            getPrivateChatChannel(roomId),
            PUSHER_EVENTS.MESSAGE_UPDATED,
            {
                id: messageId,
                roomId,
                content: content.trim(),
                senderId: session.user.id,
                timestamp,
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/messages - Delete a message
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        const messageId = searchParams.get('messageId');
        const timestamp = searchParams.get('timestamp');

        console.log('[API] DELETE Request:', { roomId, messageId, timestamp });

        if (!roomId || !messageId || !timestamp) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify ownership
        const [userId1, userId2] = roomId.split('_');
        if (userId1 !== session.user.id && userId2 !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Attempt delete
        const success = await deleteMessage(roomId, messageId, parseInt(timestamp));

        if (!success) {
            return NextResponse.json({ error: 'Message not found or delete failed' }, { status: 404 });
        }

        // Broadcast delete
        await pusherServer.trigger(
            getPrivateChatChannel(roomId),
            PUSHER_EVENTS.MESSAGE_DELETED,
            {
                id: messageId,
                roomId,
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
