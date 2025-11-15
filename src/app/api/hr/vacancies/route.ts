// src/app/api/hr/vacancies/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/hr/vacancies
export async function GET() {
  try {
    console.log("🔍 API: Fetching vacancies...");
    
    const rows = await prisma.vacancy.findMany({
      include: { 
        _count: { 
          select: { 
            applications: true
          } 
        }
      },
      orderBy: { postedDate: "desc" },
    });

    console.log(`✅ API: Found ${rows.length} vacancies`);

    return NextResponse.json({ 
      data: rows,
      success: true,
      total: rows.length 
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (e: any) {
    console.error("❌ API ERROR:", e.message);
    console.error("Error stack:", e.stack);
    
    return NextResponse.json({ 
      error: "Failed to fetch vacancies",
      message: e?.message,
      code: e?.code
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// POST /api/hr/vacancies
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📝 API: Creating vacancy with body:", body);

    // Required fields based on your schema
    const title        = body.title?.trim();
    const college      = body.college?.trim();
    const status       = (body.status ?? "OPEN").toString().trim().toUpperCase();
    const description  = body.description?.trim() || "";
    const requirements = body.requirements?.trim() || "";
    const postedDate   = body.postedDate ? new Date(body.postedDate) : new Date();

    // Validation
    if (!title || !college || !requirements) {
      return NextResponse.json(
        { error: "Missing required fields: title, college, requirements" },
        { status: 400 }
      );
    }

    console.log("📦 Data to create:", {
      title,
      college,
      status,
      description,
      requirements,
      postedDate
    });

    // Create vacancy - using only fields from your schema
    const created = await prisma.vacancy.create({
      data: { 
        title,
        college,
        status,
        description,
        requirements,
        postedDate,
      },
    });

    console.log("✅ API: Created vacancy:", created.id);

    return NextResponse.json({ 
      data: created,
      success: true,
      message: "Vacancy created successfully"
    }, { status: 201 });

  } catch (e: any) {
    console.error("❌ API POST ERROR:", e.message);
    console.error("Error details:", e);
    
    // Check for Prisma-specific errors
    if (e.code === 'P2002') {
      return NextResponse.json({ 
        error: "A vacancy with this information already exists"
      }, { status: 409 });
    }
    
    if (e.code?.startsWith('P')) {
      return NextResponse.json({ 
        error: "Database error: " + e.message,
        details: process.env.NODE_ENV === 'development' ? e.meta : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: e?.message || "Failed to create vacancy",
      details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
    }, { status: 500 });
  }
}