import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getEnrollment = cache(async (userId: string, programId: string) => {
  return prisma.enrollment
    .findUnique({
      where: {
        userId_programId: { userId, programId },
      },
    })
    .catch(() => null);
});
