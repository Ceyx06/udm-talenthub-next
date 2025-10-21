import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    let vacancies = await prisma.vacancy.findMany({
      where: {
        status: 'OPEN',
        postedDate: {
          gte: fifteenDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        college: true,
        description: true,
        requirements: true,
        postedDate: true,
      },
      orderBy: { postedDate: 'desc' },
    });

    if (query) {
      const lowerQuery = query.toLowerCase();
      vacancies = vacancies.filter(v =>
        v.title.toLowerCase().includes(lowerQuery) ||
        v.college.toLowerCase().includes(lowerQuery) ||
        v.description.toLowerCase().includes(lowerQuery)
      );
    }

    const vacanciesWithDeadline = vacancies.map(v => {
      const deadline = new Date(v.postedDate);
      deadline.setDate(deadline.getDate() + 15);
      
      return {
        ...v,
        deadline: deadline.toISOString().split('T')[0],
        postedDate: v.postedDate.toISOString(),
      };
    });

    return NextResponse.json({ data: vacanciesWithDeadline });
  } catch (error: any) {
    console.error("GET /api/public/vacancies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancies" },
      { status: 500 }
    );
  }
}