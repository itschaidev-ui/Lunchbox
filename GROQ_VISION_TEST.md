# Groq Vision API Test

## Setup

1. **Set your Groq API Key** in your `.env.local` file:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

2. **Start the Next.js server**:
```bash
npm run dev
```

3. **Run the test**:
```bash
node test-groq-vision.js
```

## Test Endpoints

### GET Request
```bash
curl "http://localhost:9002/api/test/groq-vision?imageUrl=http://localhost:9002/images/lunchbox-ai-logo.png&prompt=Describe%20this%20image&model=llama-4-scout"
```

### POST Request
```bash
curl -X POST http://localhost:9002/api/test/groq-vision \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "http://localhost:9002/images/lunchbox-ai-logo.png",
    "prompt": "Describe this image in detail",
    "model": "llama-4-scout"
  }'
```

## Custom Test

You can test with different images and prompts:

```bash
node test-groq-vision.js "https://example.com/image.jpg" "What colors are in this image?" "llama-4-maverick"
```

## Available Models

- `llama-4-scout` - Fast Groq vision model (default)
- `llama-4-maverick` - More powerful Groq vision model

## Troubleshooting

If you see "All AI providers failed":
1. Check that `GROQ_API_KEY` is set in `.env.local`
2. Restart the Next.js server after adding the API key
3. Verify the API key is valid at https://console.groq.com

If you see connection errors:
1. Make sure the Next.js server is running on port 9002
2. Check that the image URL is accessible

