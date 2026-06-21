import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { base64Data, mimeType } = await request.json();

    if (!base64Data || !mimeType) {
      return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert OCR receipt parser. Extract the food/drink items and bill totals from this receipt.
Return ONLY a valid JSON object. Do not wrap it in markdown block quotes like \`\`\`json.
The JSON object must have the exact following structure:
{
  "items": [
    {
      "name": "Name of the item",
      "unitPrice": <number>,
      "quantity": <number>
    }
  ],
  "total": <number | null>
}

CRITICAL RULES:
1. Do NOT include subtotals, tax, service charge, rounding, or total amounts in the "items" array. The "items" array must ONLY contain actual purchased goods/services.
2. For "total", look for GRAND TOTAL, TOTAL, NET TOTAL, or AMOUNT DUE in that priority order. Use the final receipt total.`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ error: 'Failed to process receipt with AI', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      return NextResponse.json({ items: [] });
    }

    const parsed = JSON.parse(textContent);
    let rawItems = [];
    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      rawItems = parsed.items;
    } else {
      rawItems = [parsed];
    }

    return NextResponse.json({
      items: rawItems,
      total: parsed.total ?? null
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
