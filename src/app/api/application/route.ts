import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ApplicationBody {
  vacancyId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  email: string;
  contactNo: string;
  dob?: string;
  gender?: string;
  civilStatus?: string;
  presentAddress?: string;
  permanentAddress?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  desiredPosition?: string;
  department?: string;
  employmentType?: string;
  highestDegree?: string;
  trainingHours?: number | string; // incoming may be number or string
  licenseName?: string;
  licenseNo?: string;
  licenseExpiry?: string;
  resumeUrl?: string;
  coverLetter?: string;
  experiences?: any;
  references?: any;
  signature?: string;
  signedAt?: string;
  qrCode?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplicationBody;

    // 1) Validate required fields
    if (!body.vacancyId || !body.firstName || !body.lastName || !body.email || !body.contactNo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2) Check vacancy existence & status
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: body.vacancyId },
      select: { id: true, status: true, postedDate: true, title: true, college: true }, // only what we use
    });

    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }

    // Accepts "OPEN" or "Active"
    if (vacancy.status !== "OPEN" && vacancy.status !== "Active") {
      return NextResponse.json(
        { error: "This vacancy is no longer accepting applications" },
        { status: 400 }
      );
    }

    // 3) Enforce 15-day window
    const postedMs = new Date(vacancy.postedDate as any).getTime();
    const daysPassed = (Date.now() - postedMs) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(daysPassed) && daysPassed > 15) {
      return NextResponse.json({ error: "Application period has expired" }, { status: 400 });
    }

    // 4) Coerce trainingHours to STRING if present (schema expects String?)
    const trainingHoursStr =
      body.trainingHours !== undefined && body.trainingHours !== null
        ? String(body.trainingHours)
        : undefined; // omit when absent

    // 5) Required strings in schema: ensure non-null strings
    const resumeUrl = body.resumeUrl ?? "";     // if Prisma requires String
    const coverLetter = body.coverLetter ?? ""; // if Prisma requires String

    // 6) Build data object, omitting optional/undefined fields
    const data = {
      vacancyId: body.vacancyId,
      fullName: body.fullName || `${body.firstName} ${body.lastName}`,
      firstName: body.firstName,
      middleName: body.middleName ?? null,
      lastName: body.lastName,
      email: body.email,
      phone: body.contactNo,

      dob: body.dob ? new Date(body.dob) : null,
      gender: body.gender ?? null,
      civilStatus: body.civilStatus ?? null,
      presentAddress: body.presentAddress ?? null,
      permanentAddress: body.permanentAddress ?? null,
      nationality: body.nationality ?? null,
      idType: body.idType ?? null,
      idNumber: body.idNumber ?? null,

      desiredPosition: body.desiredPosition || vacancy.title,
      department: body.department || (vacancy.college as string), // map college -> department field
      employmentType: body.employmentType || "Full-time",
      highestDegree: body.highestDegree ?? null,

      ...(trainingHoursStr !== undefined ? { trainingHours: trainingHoursStr } : {}),

      licenseName: body.licenseName ?? null,
      licenseNo: body.licenseNo ?? null,
      licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,

      // required strings in schema – send empty string if not provided
      resumeUrl,
      coverLetter,

      experiences: body.experiences ?? null,
      references: body.references ?? null,

      signature: body.signature ?? null,
      signedAt: body.signedAt ? new Date(body.signedAt) : new Date(),
      qrCode: body.qrCode || `UDM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "PENDING" as const,
    };

    const application = await prisma.application.create({ data });
    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
        qrCode: application.qrCode,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit application. Please try again.",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vacancyId = searchParams.get("vacancyId") || undefined;
    const status = searchParams.get("status") || undefined;

    const applications = await prisma.application.findMany({
      where: {
        ...(vacancyId ? { vacancyId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
            // department: true, // ❌ remove; doesn't exist on Vacancy
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}
