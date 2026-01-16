import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByUsername } from '@/lib/redis';

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
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: 'Username query parameter required' },
                { status: 400 }
            );
        }

        // Don't allow searching for yourself
        if (username.toLowerCase() === session.user.username.toLowerCase()) {
            return NextResponse.json(
                { users: [] },
                { status: 200 }
            );
        }

        const user = await getUserByUsername(username);

        if (!user) {
            return NextResponse.json(
                { users: [] },
                { status: 200 }
            );
        }

        // Return sanitized user data (no password hash)
        return NextResponse.json({
            users: [{
                id: user.id,
                username: user.username,
                avatar: user.avatar,
            }],
        });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
