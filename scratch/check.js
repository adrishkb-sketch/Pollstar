const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      include: { plan: true },
      take: 5
    });

    const plans = await prisma.plan.findMany();

    const invoices = await prisma.invoice.findMany({
      include: { plan: true },
      take: 10
    });

    console.log("=== USERS ===");
    console.log(JSON.stringify(users, null, 2));
    console.log("=== PLANS ===");
    console.log(JSON.stringify(plans, null, 2));
    console.log("=== INVOICES ===");
    console.log(JSON.stringify(invoices, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
