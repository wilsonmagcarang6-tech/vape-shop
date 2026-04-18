import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Verifying transaction relations...");
  try {
    const transaction = await prisma.transaction.findFirst({
      include: {
        product: true,
        billing: true
      }
    });
    console.log("Success! Transaction found with relations:", !!transaction?.product && !!transaction?.billing);
  } catch (e) {
    console.error("Verification failed:", e);
  }
}

main().catch(console.error);
