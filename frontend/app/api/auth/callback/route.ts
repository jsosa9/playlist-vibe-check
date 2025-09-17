// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';

// Helper function to get absolute URL
function getAbsoluteUrl(path: string = '') {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
    return `${baseUrl}${path}`;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    console.log("code")
    console.log(code)

    if (!code) {
        // Use absolute URL for redirect
        return NextResponse.redirect(getAbsoluteUrl('/?error=auth_failed'));
    }


    try {
        const response = await fetch('http://127.0.0.1:8000/api/exchange-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
        if (response.ok) {
            const { access_token, refresh_token } = await response.json();
            // Use absolute URL for redirect
            const res = NextResponse.redirect(getAbsoluteUrl('/dashboard'));
            res.cookies.set('spotify_access_token', access_token, {
                httpOnly: false, // Allow client-side access for our auth context
                secure: false, // Set to true in production with HTTPS
                sameSite: 'lax',
                maxAge: 3600 // 1 hour
            });
            return res;
        } else {
            // Use absolute URL for redirect
            return NextResponse.redirect(getAbsoluteUrl('/?error=token_exchange_failed'));
        }
    } catch (error) {
        console.error('Token exchange error:', error);
        // Use absolute URL for redirect
        return NextResponse.redirect(getAbsoluteUrl('/?error=server_error'));
    }
}