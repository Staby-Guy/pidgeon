import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { createUser, emailExists, usernameExists } from '@/lib/redis';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, username, password } = body;

        // Validation
        if (!email || !username || !password) {
            return NextResponse.json(
                { error: 'Email, username, and password are required' },
                { status: 400 }
            );
        }

        // Username validation (alphanumeric, 3-20 chars)
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json(
                { error: 'Username must be 3-20 characters, alphanumeric and underscores only' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Password validation (min 6 chars)
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if email already exists
        if (await emailExists(email)) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Check if username already exists
        if (await usernameExists(username)) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 409 }
            );
        }

        // Create user
        const userId = nanoid();
        const passwordHash = await bcrypt.hash(password, 12);

        await createUser({
            id: userId,
            email: email.toLowerCase(),
            username,
            passwordHash,
            createdAt: Date.now(),
        });

        return NextResponse.json(
            { message: 'Account created successfully', userId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
