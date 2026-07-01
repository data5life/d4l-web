import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getEnrollment } from '@/lib/getEnrollment';

export async function GET(_: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;

    // Get the current user session
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Fetch the current enrollment status for the user and program
    const enrollment = await getEnrollment(session.user.id!, programId);

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;

    const session = await auth();

    const { donorIdentity, subjectId } = await req.json();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const userId = session.user!.id as string;

    await prisma.enrollment.create({
      data: {
        userId: userId,
        programId,
        did: donorIdentity,
        subjectId: subjectId,
      },
    });

    return NextResponse.json({ enrolled: true }, { status: 200 });
  } catch (error) {
    console.error('Error enrolling user:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;

    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await prisma.enrollment.deleteMany({
      where: {
        userId: session.user.id!,
        programId,
      },
    });

    return NextResponse.json({ enrolled: false }, { status: 200 });
  } catch (error) {
    console.error('Error unenrolling user:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
