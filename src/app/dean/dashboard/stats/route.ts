// src/app/api/dashboard/stats/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // DEAN or HR

    // Get counts by stage
    const stageCounts = await prisma.application.groupBy({
      by: ['stage'],
      _count: true
    });

    const stageMap = stageCounts.reduce((acc: any, curr: any) => {
      acc[curr.stage] = curr._count;
      return acc;
    }, {});

    // Pipeline data for chart
    const pipeline = [
      { stage: 'APPLICATIONS', count: stageMap['APPLIED'] || 0 },
      { stage: 'SCREENING', count: stageMap['ENDORSED'] || 0 },
      { stage: 'INTERVIEWS', count: stageMap['INTERVIEW_SCHEDULED'] || 0 },
      { stage: 'OFFERS', count: stageMap['FOR_HIRING'] || 0 },
      { stage: 'ACCEPTED', count: stageMap['HIRED'] || 0 }
    ];

    // Pending actions
    const pendingActions = {
      toReview: role === 'DEAN' 
        ? await prisma.application.count({ where: { stage: 'APPLIED' } })
        : await prisma.application.count({ where: { stage: 'ENDORSED' } }),
      offersToApprove: await prisma.application.count({ where: { stage: 'FOR_HIRING' } }),
      contractsToRenew: await prisma.renewal.count({ where: { status: 'PENDING_DEAN' } })
    };

    // Positions filled (this month, quarter, year)
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const firstOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthFilled, quarterFilled, yearFilled] = await Promise.all([
      prisma.application.count({
        where: {
          stage: 'HIRED',
          hiredAt: { gte: firstOfMonth }
        }
      }),
      prisma.application.count({
        where: {
          stage: 'HIRED',
          hiredAt: { gte: firstOfQuarter }
        }
      }),
      prisma.application.count({
        where: {
          stage: 'HIRED',
          hiredAt: { gte: firstOfYear }
        }
      })
    ]);

    // Open positions by department
    const vacancies = await prisma.vacancy.findMany({
      where: { status: 'OPEN' },
      include: {
        applications: {
          select: {
            appliedDate: true
          }
        }
      }
    });

    const openByDept: Record<string, { dept: string; open: number; avgDaysOpen: number }> = {};
    
    vacancies.forEach(v => {
      if (!openByDept[v.college]) {
        openByDept[v.college] = { dept: v.college, open: 0, avgDaysOpen: 0 };
      }
      openByDept[v.college].open++;
      
      const daysOpen = Math.floor((now.getTime() - new Date(v.postedDate).getTime()) / (1000 * 60 * 60 * 24));
      openByDept[v.college].avgDaysOpen += daysOpen;
    });

    // Calculate average days open per department
    Object.keys(openByDept).forEach(dept => {
      if (openByDept[dept].open > 0) {
        openByDept[dept].avgDaysOpen = Math.round(openByDept[dept].avgDaysOpen / openByDept[dept].open);
      }
    });

    // Time to fill by department (for hired positions)
    const hiredApps = await prisma.application.findMany({
      where: {
        stage: 'HIRED',
        hiredAt: { not: null }
      },
      include: {
        vacancy: {
          select: {
            college: true
          }
        }
      }
    });

    const ttfByDept: Record<string, { dept: string; avgDays: number; count: number }> = {};
    
    hiredApps.forEach(app => {
      const dept = app.vacancy.college;
      if (!ttfByDept[dept]) {
        ttfByDept[dept] = { dept, avgDays: 0, count: 0 };
      }
      
      const daysTaken = Math.floor(
        (new Date(app.hiredAt!).getTime() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      ttfByDept[dept].avgDays += daysTaken;
      ttfByDept[dept].count++;
    });

    // Calculate average
    Object.keys(ttfByDept).forEach(dept => {
      if (ttfByDept[dept].count > 0) {
        ttfByDept[dept].avgDays = Math.round(ttfByDept[dept].avgDays / ttfByDept[dept].count);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        pipeline,
        pendingActions,
        positionsFilled: {
          month: { value: monthFilled, target: 18 },
          quarter: { value: quarterFilled, target: 45 },
          year: { value: yearFilled, target: 120 }
        },
        openByDept: Object.values(openByDept),
        ttfByDept: Object.values(ttfByDept).map(d => ({
          dept: d.dept,
          avgDays: d.avgDays
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    }, { status: 500 });
  }
}