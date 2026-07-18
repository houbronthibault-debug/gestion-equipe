import { prisma } from "@/lib/prisma";

export function getParametresApparence() {
  return prisma.parametresApparence.findUnique({ where: { id: "singleton" } });
}
