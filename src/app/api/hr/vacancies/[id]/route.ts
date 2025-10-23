import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/hr/vacancies/[id] - Get single vacancy
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: { 
        _count: { 
          select: { applications: true } 
        } 
      },
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: vacancy });
  } catch (error: any) {
    console.error("GET /api/hr/vacancies/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch vacancy" },
      { status: 500 }
    );
  }
}

// PUT /api/hr/vacancies/[id] - Update vacancy
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, college, status, requirements, description, postedDate } = body;

    if (!title || !college || !status || !requirements || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const vacancy = await prisma.vacancy.update({
      where: { id: params.id },
      data: {
        title,
        college,
        status,
        requirements,
        description,
        postedDate: postedDate ? new Date(postedDate) : undefined,
      },
    });

    return NextResponse.json({ data: vacancy });
  } catch (error: any) {
    console.error("PUT /api/hr/vacancies/[id]:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update vacancy" },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/vacancies/[id] - Delete vacancy
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vacancy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/hr/vacancies/[id]:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete vacancy" },
      { status: 500 }
    );
  }
}