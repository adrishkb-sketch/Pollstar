const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  console.log("Current plans in DB:");
  plans.forEach(p => {
    console.log(`- ${p.name} (${p.planType}): Price=${p.price}, isFree=${p.isFree}, durations=`, JSON.stringify(p.durations));
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
