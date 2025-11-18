import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch ALL vacancies that are Active/OPEN (including expired ones)
    // We'll calculate expiration on the frontend
    const vacancies = await prisma.vacancy.findMany({
      where: {
        status: {
          in: ['Active', 'OPEN', 'active', 'open']
        }
      },
      select: {
        id: true,
        title: true,
        college: true,
        requirements: true,
        description: true,
        postedDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        postedDate: 'desc'
      }
    });

    // Transform data to match the frontend format
    const formattedJobs = vacancies.map(vacancy => {
      // Calculate days since posted
      const now = new Date();
      const posted = new Date(vacancy.postedDate);
      const daysSincePosted = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if expired (15 days or more)
      const isExpired = daysSincePosted >= 15;

      return {
        id: vacancy.id,
        title: vacancy.title,
        department: vacancy.college,
        requirements: vacancy.requirements,
        description: vacancy.description,
        postedDate: new Date(vacancy.postedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        daysAgo: daysSincePosted === 0 ? 'Today' :
          daysSincePosted === 1 ? 'Yesterday' :
          daysSincePosted < 7 ? `${daysSincePosted} days ago` :
          daysSincePosted < 14 ? '1 week ago' :
          `${daysSincePosted} days ago`,
        status: isExpired ? 'Expired' : 'Active',
        link: `/apply?vacancy=${vacancy.id}`,
        isExpired: isExpired,
        daysSincePosted: daysSincePosted
      };
    });

    return NextResponse.json(formattedJobs);
  } catch (error) {
    console.error('Error fetching public jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}