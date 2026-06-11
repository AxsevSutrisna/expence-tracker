// Menggunakan Deno.serve bawaan (modern API) daripada meng-import module eksternal
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore (Mengabaikan error TypeScript di editor lokal yang di-set untuk Node.js)
Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // @ts-ignore (Mengabaikan error TypeScript di editor lokal yang di-set untuk Node.js)
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not set" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const prompt = `
      Anda adalah asisten AI yang bertugas membaca setruk belanja (receipt OCR).
      Ekstrak informasi berikut dari gambar setruk yang diberikan:
      1. title: Nama toko atau judul pengeluaran singkat (contoh: "Indomaret", "Restoran Sederhana", "SPBU Pertamina").
      2. amount: Total akhir pengeluaran (angka saja, tanpa simbol mata uang atau pemisah ribuan. Contoh: 150000).
      3. date: Tanggal transaksi dalam format YYYY-MM-DD. Jika tidak ada tanggal, tebak hari ini atau kosongkan string.
      4. category: Tebak kategori pengeluaran ini. (opsi: food_drink, transportation, utilities, shopping, entertainment, health, education, other_expense).

      Pastikan Anda HANYA mengembalikan objek JSON yang valid. Jangan tambahkan teks markdown seperti \`\`\`json.
      Struktur yang diharapkan:
      {
        "title": "string",
        "amount": number,
        "date": "string",
        "category": "string"
      }
    `;

    // Using Google Gemini REST API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType || "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", data);
      throw new Error(data.error?.message || "Failed to parse receipt");
    }

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("Empty response from Gemini API");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(textContent);
    } catch (e) {
      // In case Gemini still returns markdown code blocks
      const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
