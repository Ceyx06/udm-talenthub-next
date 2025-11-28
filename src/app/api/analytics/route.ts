import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all applications with related data
    const applications = await prisma.application.findMany({
      include: {
        vacancy: true,
        interviews: true,
        evaluation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate time to fill for each hired applicant
    const hiredApps = applications.filter(app => app.stage === 'HIRED');

    const timeToFillData = hiredApps.map(app => {
      const startDate = new Date(app.createdAt);
      // use hiredAt
      const endDate = app.hiredAt ? new Date(app.hiredAt) : new Date();
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        applicationId: app.id,
        college: app.vacancy?.college || app.department || 'Unknown',
        days,
        month: startDate.toLocaleString('default', { month: 'short' }),
        year: startDate.getFullYear(),
      };
    });

    // Calculate average time to fill
    const avgTimeToFill =
      timeToFillData.length > 0
        ? Math.round(
            timeToFillData.reduce((sum, d) => sum + d.days, 0) /
              timeToFillData.length
          )
        : 0;

    // Group by month for trend
    const last6Months = getLast6Months();
    const trendData = last6Months.map(monthKey => {
      const monthData = timeToFillData.filter(d => {
        const key = `${d.year}-${d.month}`;
        return key === monthKey.key;
      });

      const avgDays =
        monthData.length > 0
          ? Math.round(
              monthData.reduce((sum, d) => sum + d.days, 0) / monthData.length
            )
          : avgTimeToFill; // Use overall average if no data

      return {
        month: monthKey.label,
        days: avgDays,
      };
    });

    // Calculate by department
    const deptStats: { [key: string]: number[] } = {};
    timeToFillData.forEach(d => {
      if (!deptStats[d.college]) deptStats[d.college] = [];
      deptStats[d.college].push(d.days);
    });

    const deptPerformance = Object.entries(deptStats)
      .map(([dept, days]) => ({
        dept: dept.replace(/College of /gi, '').trim(),
        avgDays: Math.round(days.reduce((sum, d) => sum + d, 0) / days.length),
      }))
      .sort((a, b) => a.avgDays - b.avgDays);

    // Find fastest department
    const fastestDept = deptPerformance[0] || { dept: 'N/A', avgDays: 0 };

    // Calculate improvement (compare last 2 months)
    const thisMonth = trendData[trendData.length - 1]?.days || 0;
    const lastMonth = trendData[trendData.length - 2]?.days || 0;
    const improvement = lastMonth - thisMonth;

    // Calculate process steps timing
    const processSteps = await calculateProcessSteps(applications);

    // ALWAYS compute a numeric total here (no null)
    const totalProcessTime = processSteps.reduce(
      (sum, s) => sum + (s.avgDays ?? 0),
      0
    );

    // AI Predictions based on historical data
    const predictions = await calculatePredictions(applications);

    // Calculate stages needing attention
    const criticalSteps = processSteps.filter(s => s.status === 'critical')
      .length;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          avgTimeToFill,
          fastestDept,
          improvement,
          trendData,
          deptPerformance,
        },
        process: {
          steps: processSteps,
          criticalSteps,
          totalProcessTime,
        },
        predictions,
        stats: {
          totalApplications: applications.length,
          totalHired: hiredApps.length,
          inProgress: applications.filter(
            a => !['HIRED', 'REJECTED'].includes(a.stage || '')
          ).length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper: Get last 6 months
function getLast6Months() {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${date.toLocaleString('default', {
        month: 'short',
      })}`,
      label: date.toLocaleString('default', { month: 'short' }),
    });
  }

  return months;
}

// Helper: Calculate process step timings
async function calculateProcessSteps(applications: any[]) {
  const steps = [
    { step: 'Post → Screen', avgDays: 0, status: 'good' as const, count: 0 },
    {
      step: 'Screen → Interview',
      avgDays: 0,
      status: 'good' as const,
      count: 0,
    },
    {
      step: 'Interview → Evaluation',
      avgDays: 0,
      status: 'good' as const,
      count: 0,
    },
    {
      step: 'Evaluation → Offer',
      avgDays: 0,
      status: 'good' as const,
      count: 0,
    },
    { step: 'Offer → Accept', avgDays: 0, status: 'good' as const, count: 0 },
  ];

  applications.forEach(app => {
    const created = new Date(app.createdAt);

    // Post → Screen
    if (app.screenedDate) {
      const screenedDate = new Date(app.screenedDate);
      const days = Math.ceil(
        (screenedDate.getTime() - created.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      steps[0].avgDays += days;
      steps[0].count++;
    }

    // Screen → Interview
    if (app.interviews && app.interviews.length > 0) {
      const firstInterview = new Date(app.interviews[0].scheduledDate);
      const screenedDate = app.screenedDate
        ? new Date(app.screenedDate)
        : created;
      const days = Math.ceil(
        (firstInterview.getTime() - screenedDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      steps[1].avgDays += days;
      steps[1].count++;
    }

    // Interview → Evaluation
    if (app.evaluation && app.interviews && app.interviews.length > 0) {
      const lastInterview = new Date(
        app.interviews[app.interviews.length - 1].scheduledDate
      );
      const evaluatedDate = new Date(app.evaluation.evaluatedAt);
      const days = Math.ceil(
        (evaluatedDate.getTime() - lastInterview.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      steps[2].avgDays += days;
      steps[2].count++;
    }

    // Evaluation → Offer (contract status approved)
    if (app.evaluation?.contractStatus === 'approved') {
      const evaluatedDate = new Date(app.evaluation.evaluatedAt);
      const approvedDate = app.evaluation.contractActionDate
        ? new Date(app.evaluation.contractActionDate)
        : new Date();
      const days = Math.ceil(
        (approvedDate.getTime() - evaluatedDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      steps[3].avgDays += days;
      steps[3].count++;
    }

    // Offer → Accept (contract to hired)
    if (app.stage === 'HIRED' && app.hiredAt) {
      const hiredDate = new Date(app.hiredAt);
      const contractDate = app.evaluation?.contractActionDate
        ? new Date(app.evaluation.contractActionDate)
        : created;
      const days = Math.ceil(
        (hiredDate.getTime() - contractDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      steps[4].avgDays += days;
      steps[4].count++;
    }
  });

  // Calculate averages and determine status
  return steps.map(step => {
    const avgDays = step.count > 0 ? Math.round(step.avgDays / step.count) : 3;
    let status: 'good' | 'warning' | 'critical' = 'good';

    if (avgDays > 10) status = 'critical';
    else if (avgDays > 7) status = 'warning';

    return {
      step: step.step,
      avgDays,
      status,
    };
  });
}

// Helper: Calculate AI predictions
async function calculatePredictions(applications: any[]) {
  const deptStats: { [key: string]: number[] } = {};

  const hiredApps = applications.filter(
    app => app.stage === 'HIRED' && app.hiredAt
  );

  hiredApps.forEach(app => {
    const dept = app.vacancy?.college || app.department || 'Unknown';
    const position = app.vacancy?.title || app.desiredPosition || 'Unknown Position';
    const key = `${dept} - ${position}`;

    const startDate = new Date(app.createdAt);
    const endDate = new Date(app.hiredAt);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (!deptStats[key]) deptStats[key] = [];
    deptStats[key].push(days);
  });

  const predictions = Object.entries(deptStats)
    .map(([position, days]) => {
      const avg = Math.round(
        days.reduce((sum, d) => sum + d, 0) / days.length
      );
      const variance = Math.sqrt(
        days.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / days.length
      );
      const confidence = Math.max(50, Math.min(95, 100 - variance * 2));

      return {
        position,
        predictedDays: avg,
        confidence: Math.round(confidence),
        sampleSize: days.length,
      };
    })
    .sort((a, b) => b.sampleSize - a.sampleSize)
    .slice(0, 3);

  return predictions.length > 0
    ? predictions
    : [
        {
          position: 'No historical data',
          predictedDays: 15,
          confidence: 50,
          sampleSize: 0,
        },
      ];
}
