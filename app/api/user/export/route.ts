import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/export
 *
 * Returns all server-side exportable user data.
 * The client augments this with raw D4L Dispatcher data before downloading.
 *
 * Authentication: Required
 * Response: JSON
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
          },
        },
        enrollments: {
          select: {
            programId: true,
            did: true,
            subjectId: true,
            enrolledAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      linkedAccounts: user.accounts,
      enrollments: user.enrollments.map((enrollment) => ({
        programId: enrollment.programId,
        did: enrollment.did,
        subjectId: enrollment.subjectId,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      })),
    };

    return NextResponse.json(exportData, { status: 200 });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Failed to export user data' }, { status: 500 });
  }
}
