import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();

const GEMINI_20_FLASH_LITE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';
const GEMINI_25_FLASH_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_20_FLASH_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function geminiCallLite(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_20_FLASH_LITE_URL}?key=${GEMINI_API_KEY}`,
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
    console.error('Gemini API error (2.0-flash-lite):', error.response?.data || error.message);
    throw error;
  }
}

async function geminiCall25(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_25_FLASH_URL}?key=${GEMINI_API_KEY}`,
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
    console.error('Gemini API error (2.5-flash):', error.response?.data || error.message);
    throw error;
  }
}

async function geminiCall20(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_20_FLASH_URL}?key=${GEMINI_API_KEY}`,
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
    console.error('Gemini API error (2.0-flash):', error.response?.data || error.message);
    throw error;
  }
}

export { geminiCallLite, geminiCall25, geminiCall20 }; 