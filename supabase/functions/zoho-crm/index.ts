
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
  let formattedPhone = phone.replace(/\D/g, '');
  if (!formattedPhone) return null;
  if (formattedPhone.length > 15) {
    formattedPhone = formattedPhone.substring(0, 15);
  }
  return formattedPhone;
}

// Helper function to create a lead in Zoho CRM with enhanced form type handling
async function createLeadInZoho(accessToken: string, leadData: any) {
  try {
    console.log("Creating lead with data:", JSON.stringify(leadData));
    
    const formattedPhone = leadData.phone ? formatPhoneForZoho(leadData.phone) : null;
    
    // Determine lead source based on form type
    let leadSource = "Website IT Assessment";
    let description = `IT Assessment Request:`;
    
    if (leadData.formType === 'quote') {
      leadSource = "Website Quote Request";
      description = `Quote Request:
        Bundle: ${leadData.bundle || "Not specified"}
        Province: ${leadData.province || "Not specified"}
        City: ${leadData.city || "Not specified"}`;
    } else if (leadData.formType === 'referral') {
      leadSource = "Referral Program";
      description = `Referral Submission:
        Referred Business: ${leadData.referredBusiness || "Not specified"}
        Contact Person: ${leadData.referredContact || "Not specified"}`;
    } else if (leadData.formType === 'founders-club') {
      leadSource = "Founder's Club Gauteng";
      description = `Founder's Club Application:
        Business Type: ${leadData.businessType || "Not specified"}`;
    } else if (leadData.formType === 'rural-adopter') {
      leadSource = "Rural Early Adopter";
      description = `Rural Early Adopter Program:
        Location: ${leadData.province || "Not specified"} - ${leadData.city || "Not specified"}`;
    }
    
    // Add common fields to description
    description += `
      Employees: ${leadData.employees || "Not specified"}
      IT Challenges: ${leadData.challenges || "Not specified"}
      Service Interest: ${leadData.serviceInterest || "Not specified"}
      Assessment Type: ${leadData.assessmentType || "Standard"}`;
    
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
              Phone: formattedPhone,
              Lead_Source: leadSource,
              Description: description,
              // Custom fields for better segmentation
              Province: leadData.province,
              City: leadData.city,
              Service_Interest: leadData.serviceInterest,
              Bundle_Interest: leadData.bundle,
              Form_Type: leadData.formType || 'assessment',
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
    
    // Enhanced validation based on form type
    if (!requestData.email || !requestData.name) {
      console.error("Missing required fields:", JSON.stringify(requestData));
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Missing required fields: name and email are mandatory" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Company is required for most forms except referral
    if (requestData.formType !== 'referral' && !requestData.company) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Company name is required" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
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
