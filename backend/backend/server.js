const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const AFFILIATE_TAGS = {
  amazon_ae: process.env.AMAZON_AE_TAG || 'gulfdupe-21',
  amazon_sa: process.env.AMAZON_SA_TAG || 'gulfdupe-sa-21',
  noon: process.env.NOON_AFFILIATE_ID || 'GULFDUPENOON',
  arabclicks_redirect: process.env.ARABCLICKS_BASE_URL || 'https://track.arabclicks.com/aff_c?offer_id=123&aff_id=456&url='
};

function attachAffiliateLink(storeName, searchQuery) {
  const encodedQuery = encodeURIComponent(searchQuery);
  switch (storeName.toLowerCase()) {
    case 'amazon.ae':
      return `https://www.amazon.ae/s?k=${encodedQuery}&tag=${AFFILIATE_TAGS.amazon_ae}`;
    case 'amazon.sa':
      return `https://www.amazon.sa/s?k=${encodedQuery}&tag=${AFFILIATE_TAGS.amazon_sa}`;
    case 'noon':
      return `https://www.noon.com/uae-en/search/?q=${encodedQuery}&utm_source=affiliate&utm_medium=${AFFILIATE_TAGS.noon}`;
    default:
      const targetUrl = `https://www.google.com/search?q=${encodedQuery}+site:${storeName.toLowerCase()}.com`;
      return `${AFFILIATE_TAGS.arabclicks_redirect}${encodeURIComponent(targetUrl)}`;
  }
}

async function findGulfDupes(productDescription, imageBuffer = null, mimeType = null) {
  const prompt = `
    You are a Gulf (GCC - UAE, Qatar, Saudi Arabia) shopping and dupe-finding expert.
    Identify the product described or shown, estimate its luxury/original price in AED/QAR/SAR, 
    and suggest 4 to 6 high-value, lower-priced alternatives ("dupes" or better-priced equivalents) 
    widely available to buy online in the Gulf (on Noon, Amazon.ae, Amazon.sa, Namshi, Shein, AliExpress, or Temu).

    Return ONLY a valid JSON object with no markdown formatting, structured exactly like this:
    {
      "originalProduct": {
        "name": "Detected Product Name",
        "estimatedOriginalPrice": "1,200 AED",
        "category": "Fragrance / Fashion / Electronics / Beauty / Home"
      },
      "dupes": [
        {
          "name": "Alternative Product Name & Brand",
          "store": "Noon",
          "estimatedPrice": "145 AED",
          "savingsPercentage": "88%",
          "whyItsAGoodDupe": "Short explanation of why this matches the original quality/look/scent",
          "searchKeywords": "Exact search term to find this item on the store"
        }
      ]
    }
  `;

  const contents = [prompt];
  if (productDescription) contents.push(`Product Details: ${productDescription}`);
  if (imageBuffer && mimeType) {
    contents.push({
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
  });

  const responseText = response.text.replace(/```json|```/g, '').trim();
  const parsedData = JSON.parse(responseText);

  parsedData.dupes = parsedData.dupes.map(dupe => ({
    ...dupe,
    affiliateUrl: attachAffiliateLink(dupe.store, dupe.searchKeywords)
  }));

  return parsedData;
}

app.post('/api/search/name', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Product name is required' });
    const data = await findGulfDupes(query);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find dupes for this product name.' });
  }
});

app.post('/api/search/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    });
    const $ = cheerio.load(html);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text();
    const description = $('meta[property="og:description"]').attr('content') || '';

    const extractedInfo = `URL: ${url} | Title: ${title} | Description: ${description}`;
    const dupeResults = await findGulfDupes(extractedInfo);
    res.json(dupeResults);
  } catch (error) {
    console.error(error);
    const fallbackResults = await findGulfDupes(`Product from link: ${req.body.url}`);
    res.json(fallbackResults);
  }
});

app.post('/api/search/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });
    const data = await findGulfDupes(
      'Identify the main shopping product in this image and find cheaper Gulf alternatives.',
      req.file.buffer,
      req.file.mimetype
    );
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze image.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`GulfDupe Backend running on port ${PORT}`));
