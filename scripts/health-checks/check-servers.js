import http from 'http';

const servers = [
  { name: 'Web Interface', url: 'http://localhost:3003', expectedContent: /<html|<!DOCTYPE html>/i },
  { name: 'HTTP Transport', url: 'http://localhost:3001/health', expectJson: true },
  { name: 'SSE Transport', url: 'http://localhost:3002/health', expectJson: true },
  { name: 'SSE Debug Info', url: 'http://localhost:3002/debug/connections', expectJson: true }
];

async function checkServer(server) {
  return new Promise((resolve) => {
    console.log(`Checking ${server.name} at ${server.url}...`);
    
    const request = http.get(server.url, (response) => {
      let data = '';
      
      // Log response details
      console.log(`  Status code: ${response.statusCode}`);
      console.log(`  Headers: ${JSON.stringify(response.headers)}`);
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          // Try to parse JSON if expected
          let parsedData = data;
          if (server.expectJson) {
            try {
              parsedData = JSON.parse(data);
              console.log(`  Response data: ${JSON.stringify(parsedData, null, 2)}`);
            } catch (e) {
              console.log(`  Warning: Expected JSON but received: ${data.substring(0, 200)}...`);
            }
          } else if (server.expectedContent) {
            // Check for expected content pattern
            const contentMatch = server.expectedContent.test(data);
            console.log(`  Content match: ${contentMatch}`);
            if (!contentMatch) {
              console.log(`  First 200 chars: ${data.substring(0, 200)}...`);
            }
          } else {
            // Just log the first part of the response
            console.log(`  First 200 chars: ${data.substring(0, 200)}...`);
          }
          
          resolve({
            name: server.name,
            url: server.url,
            status: response.statusCode,
            success: response.statusCode >= 200 && response.statusCode < 300,
            data: parsedData
          });
        } catch (error) {
          console.error(`  Error processing response: ${error.message}`);
          resolve({
            name: server.name,
            url: server.url,
            status: response.statusCode,
            success: false,
            error: error.message
          });
        }
      });
    });
    
    request.on('error', (error) => {
      console.error(`  Error accessing ${server.url}: ${error.message}`);
      resolve({
        name: server.name,
        url: server.url,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });
    
    // Handle timeout
    request.setTimeout(5000, () => {
      request.abort();
      console.error(`  Timeout accessing ${server.url}`);
      resolve({
        name: server.name,
        url: server.url,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timed out'
      });
    });
  });
}

async function checkAllServers() {
  console.log('Starting server checks...');
  
  const results = await Promise.all(servers.map(checkServer));
  
  console.log('\n=== SUMMARY ===');
  results.forEach(result => {
    const statusSymbol = result.success ? '✅' : '❌';
    console.log(`${statusSymbol} ${result.name}: ${result.status}`);
  });
  
  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log('\n✅ All servers are running correctly!');
  } else {
    console.log('\n❌ Some servers have issues. Check the logs above.');
  }
  
  return results;
}

// Run the check
checkAllServers().then(results => {
  // Process exit with appropriate code
  const exitCode = results.every(r => r.success) ? 0 : 1;
  setTimeout(() => process.exit(exitCode), 100);
}); 