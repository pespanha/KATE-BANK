/* ========================================
   KASE API — User Profile Endpoint
   GET /api/user — get current user profile
   ======================================== */

import { NextResponse } from 'next/server';
import { authService, portfolioService, activityService, notificationsService } from '@/lib/services';
import { calculateCvm88Limit } from '@/lib/stellar';

export async function GET() {
  try {
    const user = await authService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Calculate CVM 88 limits (handle both camelCase mock and snake_case DB)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = user as any;
    const cvmLimits = calculateCvm88Limit(
      u.type as 'PF' | 'PJ' | 'QUALIFICADO',
      u.annualIncome ?? u.annual_income ?? 0,
      u.totalInvested ?? u.total_invested ?? 0,
    );

    // Get portfolio summary
    const portfolio = await portfolioService.getPortfolio(user.id);

    // Get recent activities
    const activities = await activityService.getUserActivities(user.id, 5);

    // Get unread notifications
    const notifications = await notificationsService.getUnread(user.id);

    return NextResponse.json({
      success: true,
      data: {
        user,
        cvmLimits,
        portfolio: portfolio.summary,
        recentActivities: activities,
        unreadNotifications: notifications.count,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
