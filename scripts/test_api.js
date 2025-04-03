/**
 * Test API endpoints
 * 
 * Usage: 
 * 1. Run the development server: npm run dev
 * 2. In a separate terminal, run this script with an API route to test:
 *    node scripts/test_api.js [endpoint] [method] [data]
 * 
 * Examples:
 *    node scripts/test_api.js /api/get_all GET
 *    node scripts/test_api.js /api/art/search GET "city=New%20York&theme=Street%20Art"
 *    node scripts/test_api.js /api/tour POST "{ \"user_id\": \"123\", \"tour_name\": \"Test Tour\", \"city\": \"New York\", \"artworks\": [] }"
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import dotenv from 'dotenv';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Constants
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Parse arguments
const [, , endpoint, method = 'GET', dataArg] = process.argv;

if (!endpoint) {
  console.error('Please provide an API endpoint to test');
  process.exit(1);
}

let data;
try {
  data = dataArg ? JSON.parse(dataArg) : undefined;
} catch (e) {
  // Not JSON, could be query string
  data = dataArg;
}

// Format URL (handle query strings)
let url = `${BASE_URL}${endpoint}`;
if (method === 'GET' && data && typeof data === 'string') {
  // If data is a string and method is GET, assume it's a query string
  url = `${url}?${data}`;
}

console.log(`🔍 Testing ${method} ${url}`);

// Execute request
async function testAPI() {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add body data for non-GET methods if data is available
    if (method !== 'GET' && data) {
      options.body = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    console.log('📊 Status:', response.status);
    console.log('🔄 Response:');
    console.log(JSON.stringify(responseData, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();