// app/api/hr/vacancies/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// GET /api/hr/vacancies/[id] — get single vacancy
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Fetching vacancy with ID:", params.id);

    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!vacancy) {
      console.log("❌ Vacancy not found:", params.id);
      return NextResponse.json(
        { 
          error: "Vacancy not found",
          success: false 
        },
        { status: 404 }
      );
    }

    console.log("✅ Vacancy found:", vacancy.title);

    return NextResponse.json({ 
      data: vacancy,
      success: true 
    }, { status: 200 });

  } catch (e: any) {
    console.error("❌ GET /api/hr/vacancies/[id] ERROR:", e);
    return NextResponse.json({ 
      error: "Failed to fetch vacancy",
      success: false,
      details: process.env.NODE_ENV === 'development' ? e?.message : undefined
    }, { status: 500 });
  }
}

// PUT /api/hr/vacancies/[id] — update vacancy
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ 
        error: "Invalid JSON body" 
      }, { status: 400 });
    }

    console.log("📝 Updating vacancy:", params.id, body);

    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.college !== undefined) updateData.college = body.college.trim();
    if (body.status !== undefined) updateData.status = body.status.toString().trim().toUpperCase();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.requirements !== undefined) updateData.requirements = body.requirements.trim();

    const updated = await prisma.vacancy.update({
      where: { id: params.id },
      data: updateData,
    });

    console.log("✅ Vacancy updated:", updated.id);

    return NextResponse.json({ 
      data: updated,
      success: true,
      message: "Vacancy updated successfully"
    }, { status: 200 });

  } catch (e: any) {
    console.error("❌ PUT /api/hr/vacancies/[id] ERROR:", e);
    
    if (e.code === 'P2025') {
      return NextResponse.json({ 
        error: "Vacancy not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: e?.message || "Failed to update vacancy",
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 });
  }
}

// DELETE /api/hr/vacancies/[id] — delete vacancy
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🗑️ Deleting vacancy:", params.id);

    await prisma.vacancy.delete({
      where: { id: params.id },
    });

    console.log("✅ Vacancy deleted:", params.id);

    return NextResponse.json({ 
      success: true,
      message: "Vacancy deleted successfully"
    }, { status: 200 });

  } catch (e: any) {
    console.error("❌ DELETE /api/hr/vacancies/[id] ERROR:", e);
    
    if (e.code === 'P2025') {
      return NextResponse.json({ 
        error: "Vacancy not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: e?.message || "Failed to delete vacancy",
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 });
  }
}