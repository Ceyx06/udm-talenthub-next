import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.vacancyId || !body.firstName || !body.lastName || !body.email || !body.contactNo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if vacancy exists and is open
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: body.vacancyId }
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Check if vacancy is open (accepts both "OPEN" and "Active")
    if (vacancy.status !== "OPEN" && vacancy.status !== "Active") {
      return NextResponse.json(
        { error: "This vacancy is no longer accepting applications" },
        { status: 400 }
      );
    }

    // Check if vacancy has expired (15 days)
    const postedDate = new Date(vacancy.postedDate).getTime();
    const now = Date.now();
    const daysPassed = (now - postedDate) / (1000 * 60 * 60 * 24);

    if (daysPassed > 15) {
      return NextResponse.json(
        { error: "Application period has expired" },
        { status: 400 }
      );
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        vacancyId: body.vacancyId,
        fullName: body.fullName,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        email: body.email,
        phone: body.contactNo,
        dob: body.dob ? new Date(body.dob) : null,
        gender: body.gender || null,
        civilStatus: body.civilStatus || null,
        presentAddress: body.presentAddress || null,
        permanentAddress: body.permanentAddress || null,
        nationality: body.nationality || null,
        idType: body.idType || null,
        idNumber: body.idNumber || null,
        desiredPosition: body.desiredPosition,
        department: body.department,
        employmentType: body.employmentType || "Full-time",
        highestDegree: body.highestDegree || null,
        trainingHours: body.trainingHours || null,
        licenseName: body.licenseName || null,
        licenseNo: body.licenseNo || null,
        licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
        resumeUrl: body.resumeUrl || null,
        coverLetter: body.coverLetter || null,
        experiences: body.experiences || null,
        references: body.references || null,
        signature: body.signature || null,
        signedAt: body.signedAt ? new Date(body.signedAt) : new Date(),
        qrCode: body.qrCode || `UDM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: "PENDING"
      }
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        applicationId: application.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Application submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to fetch applications
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vacancyId = searchParams.get("vacancyId");
    const status = searchParams.get("status");

    const where: any = {};
    if (vacancyId) where.vacancyId = vacancyId;
    if (status) where.status = status;

    const applications = await prisma.application.findMany({
      where,
      include: {
        vacancy: {
          select: {
            title: true,
            college: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}