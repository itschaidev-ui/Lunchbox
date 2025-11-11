import { NextRequest, NextResponse } from 'next/server';
import { checkAndUnlockAchievements } from '@/lib/firebase-achievements';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await checkAndUnlockAchievements(userId);

    return NextResponse.json({
      success: true,
      newlyUnlocked: result.newlyUnlocked,
      allCompleted: result.allCompleted,
    });
  } catch (error: any) {
    console.error('Error checking achievements:', error);
    // Return success with empty results instead of 500 (non-critical feature)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to check achievements',
      newlyUnlocked: [],
      allCompleted: false,
    }, { status: 200 }); // Return 200 so it doesn't show as error in console
  }
}

