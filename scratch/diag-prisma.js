const { prisma } = require('../lib/prisma');

async function debug() {
  try {
    console.log('Testing findMany with include...');
    const result = await prisma.transaction.findMany({
      take: 1,
      include: {
        product: true,
        billing: true
      }
    });
    console.log('Success! Result count:', result.length);
  } catch (e) {
    console.error('findMany with include FAILED:', e.message);
    if (e.clientVersion) console.log('Client version:', e.clientVersion);
  } finally {
    process.exit(0);
  }
}

debug();
