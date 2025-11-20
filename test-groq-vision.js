#!/usr/bin/env node

/**
 * Test Groq Vision API
 * Usage: node test-groq-vision.js [imageUrl] [prompt] [model]
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:9002';
// Default to a publicly accessible image for testing
const IMAGE_URL = process.argv[2] || 'https://images.unsplash.com/photo-1611262588024-d12430b98920';
const PROMPT = process.argv[3] || 'Describe this image in detail. What do you see?';
const MODEL = process.argv[4] || 'llama-4-scout';

async function testGroqVision() {
  console.log('🧪 Testing Groq Vision API');
  console.log('==========================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Image URL: ${IMAGE_URL}`);
  console.log(`Prompt: ${PROMPT}`);
  console.log(`Model: ${MODEL}`);
  console.log('');

  // Check if server is running
  console.log('🔍 Checking if server is running...');
  try {
    const healthCheck = await fetch(`${BASE_URL}`, { method: 'HEAD' });
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Cannot connect to server. Make sure the Next.js server is running:');
    console.error('   npm run dev');
    console.error('   Error:', error.message);
    process.exit(1);
  }

  // Test POST request
  console.log('📤 Testing POST request...');
  try {
    const response = await fetch(`${BASE_URL}/api/test/groq-vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: IMAGE_URL,
        prompt: PROMPT,
        model: MODEL
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:');
      console.error('   Status:', response.status, response.statusText);
      console.error('   Full Response:', responseText);
      if (responseText.length === 0) {
        console.error('   ⚠️ Empty response - check server logs for errors');
      }
      process.exit(1);
    }

    if (data.success) {
      console.log('✅ Test successful!');
      console.log('');
      console.log('📊 Results:');
      console.log(`   Model: ${data.model}`);
      console.log(`   Provider: ${data.provider}`);
      console.log(`   Response length: ${data.response?.length || 0} characters`);
      console.log('');
      console.log('💬 Response:');
      console.log('   ' + data.response?.substring(0, 500) + (data.response?.length > 500 ? '...' : ''));
      console.log('');
      if (data.tokenUsage) {
        console.log('📈 Token Usage:');
        console.log(`   Prompt tokens: ${data.tokenUsage.prompt_tokens || 'N/A'}`);
        console.log(`   Completion tokens: ${data.tokenUsage.completion_tokens || 'N/A'}`);
        console.log(`   Total tokens: ${data.tokenUsage.total_tokens || 'N/A'}`);
      }
    } else {
      console.error('❌ Test failed!');
      console.error('   Error:', data.error);
      if (data.details) {
        console.error('   Details:', JSON.stringify(data.details, null, 2));
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    process.exit(1);
  }

  // Test GET request
  console.log('');
  console.log('📤 Testing GET request...');
  try {
    const getUrl = `${BASE_URL}/api/test/groq-vision?imageUrl=${encodeURIComponent(IMAGE_URL)}&prompt=${encodeURIComponent(PROMPT)}&model=${MODEL}`;
    const response = await fetch(getUrl);

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ GET: Failed to parse JSON:', responseText.substring(0, 200));
      return;
    }

    if (data.success) {
      console.log('✅ GET test successful!');
      console.log(`   Provider: ${data.provider}`);
      console.log(`   Response preview: ${data.response?.substring(0, 200)}...`);
    } else {
      console.error('❌ GET test failed:', data.error);
    }
  } catch (error) {
    console.error('❌ GET request failed:', error.message);
  }

  console.log('');
  console.log('✅ All tests complete!');
}

testGroqVision().catch(console.error);

