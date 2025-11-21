const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const result = require('dotenv').config({ path: path.join(__dirname, 'secrets.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-lite",
    generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
    }
}) : null;

const findBrandPosition = (text, brandName) => {
    if (!text || !brandName) return { mentioned: false, position: '-' };
    const lines = text.split('\n');
    const normalizedBrand = brandName.toLowerCase().trim();
    let position = '-';
    let mentioned = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes(normalizedBrand)) {
            mentioned = true;
            const match = lines[i].trim().match(/^(\d+)[\.\)\s]/);
            if (match) {
                position = match[1];
                return { mentioned, position };
            }
        }
    }
    if (mentioned) return { mentioned: true, position: 'Mentioned (No rank)' };
    return { mentioned: false, position: '-' };
};

app.post('/api/check-brand', async (req, res) => {
    const { prompt, brand } = req.body;

    if (!genAI) {
        return res.status(500).json({ 
            success: false, 
            answer: "Server Error: API Key not configured.", 
            mentioned: false, 
            position: 'Error' 
        });
    }

    if (!prompt || !brand) {
        return res.status(400).json({ error: "Prompt and Brand are required" });
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const analysis = findBrandPosition(text, brand);

        res.json({
            success: true,
            answer: text,
            mentioned: analysis.mentioned,
            position: analysis.position
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.json({
            success: false,
            answer: "Service is currently experiencing high traffic. Please try again later.",
            mentioned: false,
            position: 'Error' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});