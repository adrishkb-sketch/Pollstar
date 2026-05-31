const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'asc' }
    });
    console.log("Total plans in DB:", plans.length);
    plans.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.name}, Type: ${p.planType}, Price: ${p.price}, Currency: ${p.currency}, IsActive: ${p.isActive}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
