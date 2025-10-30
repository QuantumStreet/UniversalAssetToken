/**
 * QuickBooks OAuth Callback Route
 * 
 * Handles the OAuth redirect from QuickBooks after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const code = searchParams.get('code');
  const realmId = searchParams.get('realmId');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      new URL(`/?qb_error=${encodeURIComponent(error)}`, request.url)
    );
  }
  
  // Validate required params
  if (!code || !realmId) {
    return NextResponse.redirect(
      new URL('/?qb_error=missing_params', request.url)
    );
  }
  
  // In production: Verify state parameter to prevent CSRF
  // const storedState = request.cookies.get('qb_oauth_state')?.value;
  // if (state !== storedState) {
  //   return NextResponse.redirect(new URL('/?qb_error=invalid_state', request.url));
  // }
  
  // Send tokens back to the main window
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QuickBooks Connected</title>
      </head>
      <body>
        <script>
          // Send tokens to opener window
          if (window.opener) {
            window.opener.postMessage({
              type: 'QUICKBOOKS_AUTH_SUCCESS',
              code: '${code}',
              realmId: '${realmId}',
              state: '${state}'
            }, window.location.origin);
            
            // Show success message
            document.body.innerHTML = \`
              <div style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #22c55e; font-size: 32px; margin-bottom: 20px;">✅ QuickBooks Connected!</h1>
                <p style="color: #666; margin-bottom: 30px;">Extracting your financial data...</p>
                <p style="color: #999; font-size: 14px;">This window will close automatically.</p>
              </div>
            \`;
            
            // Close after 2 seconds
            setTimeout(() => window.close(), 2000);
          } else {
            window.location.href = '/?qb_code=${code}&qb_realmId=${realmId}';
          }
        </script>
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

