/**
 * Keep-Alive Service for Render.com
 * Prevents the free tier from sleeping by pinging itself every 14 minutes
 */

const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL;

export function startKeepAlive() {
  // Only run keep-alive on Render.com (not in local development)
  if (!RENDER_URL) {
    console.log('⏭️  Keep-alive disabled (not on Render.com)');
    return;
  }

  console.log('🔄 Keep-alive service started');
  console.log(`📡 Will ping ${RENDER_URL} every 14 minutes`);

  // Initial ping after 30 seconds (give time for server to fully start)
  setTimeout(() => {
    ping();
  }, 30000);

  // Then ping every 14 minutes
  setInterval(() => {
    ping();
  }, PING_INTERVAL);
}

async function ping() {
  try {
    const url = `${RENDER_URL}/api/health`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Keep-Alive-Service',
      },
    });

    const duration = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`✅ Keep-alive ping successful (${duration}ms) at ${new Date().toISOString()}`);
    } else {
      console.warn(`⚠️  Keep-alive ping returned status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Keep-alive ping failed:', error instanceof Error ? error.message : error);
  }
}
