import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function geminiCall(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini API error:', error.response?.data || error.message);
    throw error;
  }
} 