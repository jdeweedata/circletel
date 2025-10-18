// Simple test script for analytics API
const fetch = require('node-fetch');

async function testAnalyticsAPI() {
  console.log('Testing Analytics API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/coverage/analytics?window=24h');
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Success:', data.success);
    
    if (data.success) {
      console.log('✅ API Response Success!');
      console.log('📊 Data Source:', data.data.source);
      console.log('📈 Time Series Data Points:', data.data.timeSeriesData.length);
      console.log('🗺️ Province Data Points:', data.data.provinceData.length);
      console.log('❌ Error Types:', data.data.errorData.length);
      console.log('⚡ Performance Trend Periods:', data.data.performanceTrends.length);
    } else {
      console.error('❌ API Response Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

testAnalyticsAPI();
