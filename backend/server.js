import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for handling image uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini API client using the official SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Affiliate URL generation helper for GCC region (UAE, Qatar, Saudi Arabia, Kuwait)
function generateAffiliateUrl(storeName, rawProductUrl) {
  const ARABCLICKS_SMARTLINK = process.env.ARABCLICKS_TRACKING_ID || 'https://arabclicks.com/smartlink?id=DEFAULT_ID&url=';
  const AMAZON_TAG = process.env.AMAZON_AE_TAG || 'gulfdupe-21';
  const NOON_AFF_ID = process.env.NOON_AFF_ID || 'gulfdupe';

  if (!rawProductUrl) rawProductUrl = 'https://www.google.com';

  if (storeName.toLowerCase().includes('amazon')) {
    const separator = rawProductUrl.includes('?') ? '&' : '?';
    return `${rawProductUrl}${separator}tag=${AMAZON_TAG}`;
  }
  if (storeName.toLowerCase().includes('noon')) {
    const separator = rawProductUrl.includes('?') ? '&' : '?';
    return `${rawProductUrl}${separator}nutritionref=${NOON_AFF_ID}`;
  }
  
  // Default fallback through ArabClicks SmartLink for regional stores (Ounass, Namshi, Sephora, etc.)
  return `${ARABCLICKS_SMARTLINK}${encodeURIComponent(rawProductUrl)}`;
}

// Helper to automatically wrap dupe store links with affiliate parameters
function attachAffiliateLinks(data) {
  if (data && data.dupes && Array.isArray(data.dupes)) {
    data.dupes = data.dupes.map(dupe => ({
      ...dupe,
      affiliateUrl: generateAffiliateUrl(dupe.store, dupe.productUrl || dupe.affiliateUrl)
    }));
  }
  return data;
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'GulfDupe Backend is Live & Running with Affiliate Engine 🚀' });
});

// 1. Search by Product Name
app.post('/api/search/name', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Product name/query is required' });

    const prompt = `Act as an expert GCC shopping and price arbitrage assistant. 
    Analyze the luxury product: "${query}".
    Provide 3 to 4 affordable, high-quality alternative "dupes" available in the GCC region (UAE, Qatar, Saudi Arabia, Kuwait) from stores like Amazon UAE, Noon, Ounass, Sephora, or Namshi.
    
    You MUST output valid JSON ONLY with no markdown formatting or backticks, structured exactly like this:
    {
      "originalProduct": {
        "name": "${query}",
        "estimatedOriginalPrice": "Estimated price string"
      },
      "dupes": [
        {
          "name": "Dupe Product Name",
          "store": "Amazon UAE / Noon / etc.",
          "estimatedPrice": "Price string",
          "savingsPercentage": "X%",
          "whyItsAGoodDupe": "Brief description of why it matches quality/look.",
          "productUrl": "https://www.amazon.ae"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(rawText);
    const finalData = attachAffiliateLinks(parsedData);
    res.json(finalData);
  } catch (error) {
    console.error('Error in name search:', error);
    res.status(500).json({ error: 'Failed to process product name search' });
  }
});

// 2. Search by Store URL
app.post('/api/search/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Store URL is required' });

    const prompt = `Act as an expert GCC shopping and price arbitrage assistant. 
    A user provided this luxury item URL: "${url}".
    Identify the product and provide 3 to 4 affordable, high-quality alternative "dupes" available in the GCC region (UAE, Qatar, Saudi Arabia, Kuwait) from stores like Amazon UAE, Noon, Ounass, Sephora, or Namshi.
    
    You MUST output valid JSON ONLY with no markdown formatting or backticks, structured exactly like this:
    {
      "originalProduct": {
        "name": "Extracted Product Name",
        "estimatedOriginalPrice": "Estimated luxury price"
      },
      "dupes": [
        {
          "name": "Dupe Product Name",
          "store": "Amazon UAE / Noon / etc.",
          "estimatedPrice": "Price string",
          "savingsPercentage": "X%",
          "whyItsAGoodDupe": "Brief description",
          "productUrl": "${url}"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(rawText);
    const finalData = attachAffiliateLinks(parsedData);
    res.json(finalData);
  } catch (error) {
    console.error('Error in URL search:', error);
    res.status(500).json({ error: 'Failed to process store URL search' });
  }
});

// 3. Search by Image Upload
app.post('/api/search/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `Analyze this uploaded image of a luxury product. 
    Identify the item and provide 3 to 4 affordable, high-quality alternative "dupes" available in the GCC region (UAE, Qatar, Saudi Arabia, Kuwait) from stores like Amazon UAE, Noon, Ounass, Sephora, or Namshi.
    
    You MUST output valid JSON ONLY with no markdown formatting or backticks, structured exactly like this:
    {
      "originalProduct": {
        "name": "Identified Luxury Product Name",
        "estimatedOriginalPrice": "Estimated price"
      },
      "dupes": [
        {
          "name": "Dupe Product Name",
          "store": "Amazon UAE / Noon / etc.",
          "estimatedPrice": "Price string",
          "savingsPercentage": "X%",
          "whyItsAGoodDupe": "Brief description",
          "productUrl": "https://www.amazon.ae"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [imagePart, prompt],
    });

    let rawText = response.text.trim();
    rawText = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsedData = JSON.parse(rawText);
    const finalData = attachAffiliateLinks(parsedData);
    res.json(finalData);
  } catch (error) {
    console.error('Error in image search:', error);
    res.status(500).json({ error: 'Failed to process image upload search' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`GulfDupe Backend running on port ${PORT}`);
});
