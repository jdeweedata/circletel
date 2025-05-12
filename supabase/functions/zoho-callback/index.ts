
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Get the authorization code from the query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code is missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("Received authorization code:", code);
    
    // Exchange the authorization code for access and refresh tokens
    const clientId = Deno.env.get("ZOHO_CLIENT_ID");
    const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
    const redirectUri = "https://agyjovdugmtopasyvlng.supabase.co/functions/v1/zoho-callback";
    
    if (!clientId || !clientSecret) {
      throw new Error("Missing Zoho credentials");
    }
    
    const tokenResponse = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );
    
    const tokenData = await tokenResponse.json();
    console.log("Token response:", JSON.stringify(tokenData));
    
    if (!tokenResponse.ok) {
      console.error("Error exchanging authorization code:", tokenData);
      throw new Error(`Failed to exchange code: ${JSON.stringify(tokenData)}`);
    }
    
    // Display the refresh token to copy
    const refreshToken = tokenData.refresh_token;
    
    // Create a simple HTML page to display the refresh token
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zoho OAuth Integration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f5f5f5; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #ff6600; }
          .token-box { background-color: #eee; padding: 15px; border-radius: 4px; margin: 20px 0; word-break: break-all; font-family: monospace; }
          .instructions { background-color: #fffde7; padding: 15px; border-left: 4px solid #ffeb3b; margin-bottom: 20px; }
          .copy-btn { background-color: #ff6600; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Zoho OAuth Integration Complete</h1>
          <div class="instructions">
            <p><strong>Important:</strong> Copy the refresh token below and add it to your Supabase Edge Function secrets with the name <code>ZOHO_REFRESH_TOKEN</code>.</p>
          </div>
          <h2>Your Refresh Token:</h2>
          <div class="token-box" id="refreshToken">${refreshToken}</div>
          <button class="copy-btn" onclick="copyToken()">Copy Refresh Token</button>
          <p>After adding this token to your Supabase Edge Function secrets, your Zoho CRM integration will be complete.</p>
        </div>
        <script>
          function copyToken() {
            const tokenText = document.getElementById('refreshToken').textContent;
            navigator.clipboard.writeText(tokenText)
              .then(() => alert('Refresh token copied to clipboard!'))
              .catch(err => console.error('Failed to copy: ', err));
          }
        </script>
      </body>
      </html>
    `;
    
    return new Response(htmlResponse, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Unknown error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
