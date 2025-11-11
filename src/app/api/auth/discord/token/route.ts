import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri: clientRedirectUri } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = '1426983253666955324';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || '2jDsHLCEk03gPruwr5cLwl3T1nVtZ1gy';
    
    // Use the redirect URI from the client (must match exactly what was sent to Discord)
    // Fallback to constructing from request headers or environment variables
    const redirectUri = clientRedirectUri || 
      (() => {
        const origin = request.headers.get('origin') || 
                       request.headers.get('referer')?.split('/').slice(0, 3).join('/') ||
                       process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.WEBSITE_URL ||
                       'https://studio-7195653935-eecd8.web.app';
        return `${origin}/auth/discord/callback`;
      })();

    if (!clientSecret || clientSecret === 'your_discord_client_secret_here') {
      return NextResponse.json({ 
        error: 'Discord client secret not configured. Please add DISCORD_CLIENT_SECRET to your .env.local file.' 
      }, { status: 500 });
    }

    // Log the parameters being sent
    console.log('Discord token exchange parameters:', {
      clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
      codeLength: code.length
    });

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return NextResponse.json({ 
        error: `Discord token exchange failed: ${errorData}`,
        status: tokenResponse.status,
        details: errorData
      }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    return NextResponse.json({ access_token: tokenData.access_token });

  } catch (error) {
    console.error('Discord token exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
