
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for the function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get Zoho access token
async function getZohoAccessToken() {
  try {
    const clientId = Deno.env.get("ZOHO_CLIENT_ID");
    const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      throw new Error("Missing Zoho credentials");
    }
    
    const response = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "ZohoCRM.modules.ALL",
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error getting Zoho access token:", data);
      throw new Error(`Failed to get access token: ${data.error || "Unknown error"}`);
    }
    
    return data.access_token;
  } catch (error) {
    console.error("Error in getZohoAccessToken:", error);
    throw error;
  }
}

// Helper function to create a lead in Zoho CRM
async function createLeadInZoho(accessToken: string, leadData: any) {
  try {
    const response = await fetch(
      "https://www.zohoapis.com/crm/v2/Leads",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              Last_Name: leadData.name || "Unknown",
              Email: leadData.email,
              Company: leadData.company,
              Lead_Source: "Website IT Assessment",
              Description: `
                IT Assessment Request:
                Employees: ${leadData.employees || "Not specified"}
                IT Challenges: ${leadData.challenges || "Not specified"}
                Assessment Type: ${leadData.assessmentType || "Standard"}
              `,
              $title: "IT Assessment Request",
            },
          ],
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Error creating Zoho lead:", data);
      throw new Error(`Failed to create lead: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error in createLeadInZoho:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse the request body
    const requestData = await req.json();
    console.log("Received data:", requestData);
    
    // Get Zoho access token
    const accessToken = await getZohoAccessToken();
    console.log("Successfully obtained Zoho access token");
    
    // Create lead in Zoho CRM
    const result = await createLeadInZoho(accessToken, requestData);
    console.log("Successfully created lead in Zoho CRM");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Lead created successfully", 
      id: result?.data?.[0]?.details?.id || null 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
