const { prisma } = require('./lib/prisma');

async function test() {
  try {
    const recentTransactions = await prisma.transaction.findMany({
      take: 1,
      include: {
        product: {
          select: {
            ProductName: true
          }
        },
        billing: {
          select: {
            CustomerName: true
          }
        }
      }
    });
    console.log('Successfully fetched transaction:', recentTransactions.length > 0 ? 'Yes' : 'No data, but query worked');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

test();
