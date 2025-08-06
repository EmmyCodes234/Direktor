import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

// --- IMPORTANT: Set these in your Supabase project's environment variables ---
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY"); // Or your preferred conversational AI key

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, conversationHistory } = await req.json();

    // Step 1: Transcribe Audio to Text (using a service like Gemini)
    // For this to work, the audio must be sent as a base64 encoded string
    const transcriptionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: "Transcribe this audio:" },
                    { inline_data: { mime_type: "audio/webm", data: audio.split(',')[1] } }
                ]
            }]
        })
    });

    if (!transcriptionResponse.ok) {
        throw new Error(`Transcription API failed: ${await transcriptionResponse.text()}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    const transcribedText = transcriptionData.candidates[0].content.parts[0].text;

    const newConversation = `${conversationHistory}\nUser: ${transcribedText}`;

    // Step 2: Get a Text Response from Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `You are a Scrabble tournament planning assistant. Based on the following conversation, ask the next logical question to help the user build their tournament plan. Keep your response to a single, short sentence.\n\n${newConversation}` }]
            }]
        })
    });
    
    if (!geminiResponse.ok) {
        throw new Error(`Gemini API failed: ${await geminiResponse.text()}`);
    }

    const geminiData = await geminiResponse.json();
    const aiTextResponse = geminiData.candidates[0].content.parts[0].text;

    // Step 3: Convert the AI's Text Response to Audio using ElevenLabs
    const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", { // Using a default voice ID
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: aiTextResponse,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        })
    });

    if (!elevenLabsResponse.ok) {
        throw new Error(`ElevenLabs API failed with status: ${elevenLabsResponse.statusText}`);
    }

    const audioResponseBlob = await elevenLabsResponse.blob();

    // Step 4: Return the audio to the client
    return new Response(audioResponseBlob, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
        },
        status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});