import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from './redis';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                console.log('Authorize called with email:', credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.error('Missing credentials');
                    throw new Error('Email and password are required');
                }

                try {
                    const user = await getUserByEmail(credentials.email);
                    console.log('User lookup result:', user ? 'Found' : 'Not Found');

                    if (!user) {
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.passwordHash
                    );

                    if (!isPasswordValid) {
                        console.error('Invalid password');
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        name: user.username,
                    };
                } catch (error) {
                    console.error('Authorize error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
