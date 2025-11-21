Gemini Brand Mention Checker

A full-stack web application that uses Google's Gemini AI to check if a specific brand is recommended in response to a given prompt, and if so, at what position (rank) it appears.


⚙️ Configuration

Model: gemini-2.0-flash-lite (Hardcoded in server.js)

Temperature: 0.4 (Optimized for factual lists)

Database: None (In-memory processing only)

🧪 Testing

Prompt: "List the top 3 CRM tools" | Brand: "Salesforce" -> Expect: Yes, Position 1 or 2.

Prompt: "What is a good email tool?" | Brand: "Mailchimp" -> Expect: Yes, Position 1 (if list) or "Mentioned".