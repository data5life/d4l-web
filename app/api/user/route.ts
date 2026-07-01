import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/user
 *
 * Permanently deletes the user account and all associated data.
 * Due to cascade delete configuration in the schema, this also deletes:
 * - All Account records (OAuth connections)
 * - All Session records
 * - All QuestionnaireResponse records
 * - All Consent records
 *
 */
export async function DELETE() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Delete the user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
