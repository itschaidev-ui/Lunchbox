#!/bin/bash

# Test Groq Vision API
# Usage: ./test-groq-vision.sh [imageUrl] [prompt] [model]

BASE_URL="http://localhost:9002"
IMAGE_URL="${1:-http://localhost:9002/images/lunchbox-ai-logo.png}"
PROMPT="${2:-Describe this image in detail. What do you see?}"
MODEL="${3:-llama-4-scout}"

echo "🧪 Testing Groq Vision API"
echo "=========================="
echo "Image URL: $IMAGE_URL"
echo "Prompt: $PROMPT"
echo "Model: $MODEL"
echo ""

# Test GET request
echo "📤 Testing GET request..."
curl -X GET "$BASE_URL/api/test/groq-vision?imageUrl=$IMAGE_URL&prompt=$PROMPT&model=$MODEL" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo ""

# Test POST request
echo "📤 Testing POST request..."
curl -X POST "$BASE_URL/api/test/groq-vision" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageUrl\": \"$IMAGE_URL\",
    \"prompt\": \"$PROMPT\",
    \"model\": \"$MODEL\"
  }" \
  | jq '.'

echo ""
echo "✅ Test complete!"

