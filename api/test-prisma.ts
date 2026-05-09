import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const casos = await prisma.caso.findMany({
    include: {
      mascota: {
        include: {
          tipo: true,
          imagenes: true
        }
      },
      adopcion: true,
      donacion: true
    }
  });
  console.log(JSON.stringify(casos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
