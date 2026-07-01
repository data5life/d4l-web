import { prisma } from '@/lib/prisma';

/**
 * Get all unique program IDs that a user has enrolled in.
 */
export async function getUserPrograms(userId: string): Promise<string[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        select: {
          programId: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return user.enrollments.map((e) => e.programId);
}
