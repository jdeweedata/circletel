
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
      console.error("Missing Zoho credentials");
      throw new Error("Missing Zoho credentials");
    }
    
    // Using refresh token grant type instead of client_credentials
    const response = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: Deno.env.get("ZOHO_REFRESH_TOKEN") || "",
        }),
      }
    );
    
    const data = await response.json();
    console.log("Token response:", JSON.stringify(data));
    
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

// Function to format phone number for Zoho CRM
function formatPhoneForZoho(phone: string) {
  // Remove any non-digit characters
  let formattedPhone = phone.replace(/\D/g, '');
  
  // Check if we have a valid phone number
  if (!formattedPhone) {
    return null; // Return null for empty phone numbers
  }
  
  // Ensure the phone number doesn't exceed a reasonable length (adjust as needed)
  if (formattedPhone.length > 15) {
    formattedPhone = formattedPhone.substring(0, 15);
  }
  
  return formattedPhone;
}

// Helper function to create a lead in Zoho CRM
async function createLeadInZoho(accessToken: string, leadData: any) {
  try {
    console.log("Creating lead with data:", JSON.stringify(leadData));
    console.log("Using access token:", accessToken.substring(0, 10) + "...");
    
    // Format phone number or set to null if invalid
    const formattedPhone = leadData.phone ? formatPhoneForZoho(leadData.phone) : null;
    console.log("Formatted phone:", formattedPhone);
    
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
              Phone: formattedPhone, // Send formatted phone or null
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
    
    const responseText = await response.text();
    console.log("Raw Zoho API response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Zoho response as JSON:", e);
      throw new Error(`Invalid JSON response from Zoho API: ${responseText}`);
    }
    
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
    let requestData;
    try {
      requestData = await req.json();
      console.log("Received data:", JSON.stringify(requestData));
    } catch (e) {
      console.error("Error parsing request JSON:", e);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid JSON in request body" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Basic validation
    if (!requestData.email || !requestData.name || !requestData.company) {
      console.error("Missing required fields:", JSON.stringify(requestData));
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: name, email, or company" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Get Zoho access token
    let accessToken;
    try {
      accessToken = await getZohoAccessToken();
      console.log("Successfully obtained Zoho access token");
    } catch (error) {
      console.error("Failed to get access token:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to authenticate with Zoho CRM" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Create lead in Zoho CRM
    let result;
    try {
      result = await createLeadInZoho(accessToken, requestData);
      console.log("Successfully created lead in Zoho CRM:", JSON.stringify(result));
    } catch (error) {
      console.error("Failed to create lead:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to create lead in Zoho CRM" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
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
