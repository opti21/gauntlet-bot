import { PrismaClient } from "@prisma/client";

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV === "development") global.prisma = prisma;

declare global {
  namespace NodeJS {
    interface Global {
      prisma: any;
    }
  }
}

export default prisma;
