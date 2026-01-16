import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getContacts,
    addContact,
    getUserById,
    isContact,
    getRoomId,
    getLatestMessage
} from '@/lib/redis';
import { pusherServer, getUserChannel, PUSHER_EVENTS } from '@/lib/pusher';

// GET /api/contacts - Get all contacts with latest message preview
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Fetching contacts for user:', session.user.id);
        const contactIds = await getContacts(session.user.id);
        console.log('Contact IDs:', contactIds);

        const contacts = await Promise.all(
            contactIds.map(async (contactId) => {
                try {
                    const user = await getUserById(contactId);
                    if (!user) {
                        console.warn('Contact user not found:', contactId);
                        return null;
                    }

                    const roomId = getRoomId(session.user.id, contactId);
                    const latestMessage = await getLatestMessage(roomId);

                    return {
                        id: user.id,
                        username: user.username,
                        avatar: user.avatar,
                        latestMessage: latestMessage ? {
                            content: latestMessage.content.substring(0, 50),
                            timestamp: latestMessage.timestamp,
                            isOwn: latestMessage.senderId === session.user.id,
                        } : null,
                        roomId,
                    };
                } catch (err) {
                    console.error('Error fetching contact details for:', contactId, err);
                    return null;
                }
            })
        );

        // Filter out nulls and sort by latest message
        const validContacts = contacts
            .filter(Boolean)
            .sort((a, b) => {
                const aTime = a?.latestMessage?.timestamp ?? 0;
                const bTime = b?.latestMessage?.timestamp ?? 0;
                return bTime - aTime;
            });

        return NextResponse.json({ contacts: validContacts });
    } catch (error) {
        console.error('Get contacts error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/contacts - Add a new contact
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
        const { contactId } = body;

        if (!contactId) {
            return NextResponse.json(
                { error: 'Contact ID required' },
                { status: 400 }
            );
        }

        // Can't add yourself
        if (contactId === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot add yourself as a contact' },
                { status: 400 }
            );
        }

        // Check if already a contact
        if (await isContact(session.user.id, contactId)) {
            return NextResponse.json(
                { error: 'Already in contacts' },
                { status: 409 }
            );
        }

        // Verify contact exists
        const contactUser = await getUserById(contactId);
        if (!contactUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        await addContact(session.user.id, contactId);

        // Notify the other user via Pusher
        await pusherServer.trigger(
            getUserChannel(contactId),
            PUSHER_EVENTS.CONTACT_ADDED,
            {
                userId: session.user.id,
                username: session.user.username,
            }
        );

        return NextResponse.json({
            message: 'Contact added',
            contact: {
                id: contactUser.id,
                username: contactUser.username,
                avatar: contactUser.avatar,
                roomId: getRoomId(session.user.id, contactId),
            }
        });
    } catch (error) {
        console.error('Add contact error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
