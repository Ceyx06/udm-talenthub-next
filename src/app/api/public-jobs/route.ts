import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch only active/open vacancies
        const vacancies = await prisma.vacancy.findMany({
            where: {
                status: 'Active'
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
                        `${daysSincePosted} days ago`,
                status: vacancy.status,
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