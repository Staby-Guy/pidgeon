import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware() {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Protect /chat routes
                if (req.nextUrl.pathname.startsWith('/chat')) {
                    return !!token;
                }
                // Protect API routes except auth
                if (req.nextUrl.pathname.startsWith('/api') &&
                    !req.nextUrl.pathname.startsWith('/api/auth')) {
                    return !!token;
                }
                return true;
            },
        },
    }
);

export const config = {
    matcher: ['/chat/:path*', '/api/users/:path*', '/api/contacts/:path*', '/api/messages/:path*'],
};
