import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SuggestionRequest {
  type: 'symptoms' | 'diagnosis' | 'medicines' | 'dosage' | 'dose' | 'frequency' | 'duration' | 'tests';
  context: {
    symptoms?: string;
    diagnosis?: string;
    medicineName?: string;
    medicineType?: string;
    patientInfo?: {
      age?: string;
      gender?: string;
      weight?: string;
    };
  };
  query?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, query } = await req.json() as SuggestionRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `You are a medical AI assistant helping doctors write prescriptions. You provide accurate, evidence-based suggestions. Always respond with valid JSON arrays.`;
    
    let userPrompt = "";

    switch (type) {
      case 'symptoms':
        userPrompt = `Given the partial symptom text "${query || ''}", suggest 5-8 common medical symptoms that match or start with this text. Return as JSON array of strings. Example: ["Fever", "Fatigue", "Headache"]`;
        break;
        
      case 'diagnosis':
        userPrompt = `Based on these symptoms: "${context.symptoms || ''}", suggest 5-8 possible diagnoses. Return as JSON array of objects with format: [{"name": "Diagnosis Name", "confidence": "high/medium/low", "description": "Brief description"}]`;
        break;
        
      case 'medicines':
        userPrompt = `For the diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest 5-10 commonly prescribed medicines. Return as JSON array of objects: [{"name": "Medicine Name", "type": "Tablet/Syrup/Injection/Capsule/Ointment", "genericName": "Generic name if applicable"}]`;
        break;
        
      case 'dosage':
      case 'dose':
        userPrompt = `For the medicine "${context.medicineName || ''}" (${context.medicineType || 'Tablet'}), suggest common dosages. Patient info: ${JSON.stringify(context.patientInfo || {})}. Return as JSON array of strings like: ["500mg", "250mg", "1g"]`;
        break;
        
      case 'frequency':
        userPrompt = `For the medicine "${context.medicineName || ''}" with dosage, suggest common frequencies. Return as JSON array of strings like: ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Before meals", "After meals"]`;
        break;
        
      case 'duration':
        userPrompt = `For the medicine "${context.medicineName || ''}" used for "${context.diagnosis || ''}", suggest common treatment durations. Return as JSON array of strings like: ["5 days", "7 days", "10 days", "2 weeks", "1 month"]`;
        break;
        
      case 'tests':
        userPrompt = `For the diagnosis "${context.diagnosis || ''}" with symptoms "${context.symptoms || ''}", suggest relevant diagnostic tests. Return as JSON array of objects: [{"testName": "Test Name", "testType": "Blood/Urine/Imaging/Other", "reason": "Why this test is recommended"}]`;
        break;
        
      default:
        throw new Error("Invalid suggestion type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let suggestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(content);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions, type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prescription-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
