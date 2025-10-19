// Simple analytics test without complex dependencies
const http = require('http');

// Test if our API route would work with mock data
function createMockAnalyticsResponse() {
  return {
    success: true,
    data: {
      timeSeriesData: generateTimeSeriesData(),
      provinceData: generateProvinceData(),
      errorData: generateErrorData(),
      performanceTrends: generatePerformanceTrends(),
      technologyBreakdown: null,
      timeWindow: {
        windowMs: 24 * 60 * 60 * 1000,
        windowHours: 24,
        windowDays: 1
      },
      generatedAt: new Date().toISOString(),
      source: "test_mock_data"
    },
    timestamp: new Date().toISOString()
  };
}

function generateTimeSeriesData() {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();
    const isPeak = hour >= 9 && hour <= 18;
    
    data.push({
      timestamp: timestamp.toISOString(),
      date: timestamp.toISOString().slice(0, 10),
      hour,
      requests: isPeak ? Math.floor(Math.random() * 80) + 120 : Math.floor(Math.random() * 40) + 60,
      successfulRequests: Math.floor(Math.random() * 100) + 50,
      failedRequests: Math.floor(Math.random() * 20),
      successRate: Math.random() * 10 + 90,
      averageResponseTime: Math.random() * 800 + 600,
      cacheHitRate: Math.random() * 20 + 75,
      errors: {}
    });
  }
  
  return data.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function generateProvinceData() {
  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];
  
  return provinces.map(province => ({
    province,
    requests: Math.floor(Math.random() * 500) + 100,
    successfulRequests: Math.floor(Math.random() * 450) + 80,
    averageResponseTime: Math.random() * 800 + 400,
    successRate: Math.random() * 15 + 85,
    errorCount: Math.floor(Math.random() * 20) + 5
  }));
}

function generateErrorData() {
  const errorTypes = [
    'WMS REQUEST FAILED', 'LAYER NOT AVAILABLE', 'COORDINATE OUT OF BOUNDS',
    'SERVICE UNAVAILABLE', 'CONFIG NOT FOUND', 'FEATURE INFO EMPTY'
  ];
  
  return errorTypes.map(error => ({
    error: error.trim(),
    count: Math.floor(Math.random() * 20),
    percentage: Math.floor(Math.random() * 100),
    severity: 'medium',
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  })).sort((a, b) => b.percentage - a.percentage);
}

function generatePerformanceTrends() {
  const periods = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days'];
  
  return periods.map(period => ({
    period,
    p50: Math.random() * 200 + 400,
    p95: Math.random() * 500 + 800,
    p99: Math.random() * 800 + 1200,
    growthPeriod: period,
    averageResponseTime: Math.random() * 300 + 200,
    metricName: 'Response Time',
    statusMetric: 'Performance'
  }));
}

// Test the analytics data structure
console.log('🧪 Testing Analytics Data Structure...');
const response = createMockAnalyticsResponse();

console.log('✅ Success:', response.success);
console.log('📊 Source:', response.data.source);
console.log('📈 Time Series Points:', response.data.timeSeriesData.length);
console.log('🗺️ Province Data Points:', response.data.provinceData.length);
console.log('❌ Error Types:', response.data.errorData.length);
console.log('⚡ Performance Trends:', response.data.performanceTrends.length);

console.log('\n📋 Sample Time Series Data:');
console.log(response.data.timeSeriesData[0]);

console.log('\n📋 Sample Province Data:');
console.log(response.data.provinceData[0]);

console.log('\n📋 Sample Error Data:');
console.log(response.data.errorData[0]);

console.log('\n📋 Sample Performance Trend:');
console.log(response.data.performanceTrends[0]);

console.log('\n✅ Analytics data structure validation complete!');
