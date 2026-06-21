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
                text: `You are an expert OCR receipt parser. Extract the food/drink items from this receipt. 
Return ONLY a valid JSON array of objects. Do not wrap it in markdown block quotes like \`\`\`json.
Each object must have the exact following structure:
{
  "name": "Name of the item",
  "unitPrice": <number>,
  "quantity": <number>
}
Ignore subtotals, tax, service charge, and total amounts. Only extract the individual items purchased.`
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

    let rawItems = JSON.parse(textContent);
    if (!Array.isArray(rawItems)) {
      if (rawItems.items && Array.isArray(rawItems.items)) {
        rawItems = rawItems.items;
      } else {
        rawItems = [rawItems];
      }
    }

    return NextResponse.json({ items: rawItems });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
