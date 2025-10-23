import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/public/applications - Submit job application
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      vacancyId,
      // Basic info
      firstName,
      middleName,
      lastName,
      email,
      contactNo,
      dob,
      gender,
      civilStatus,
      presentAddress,
      permanentAddress,
      nationality,
      idType,
      idNumber,
      // Position
      desiredPosition,
      department,
      employmentType,
      // Education
      highestDegree,
      trainingHours,
      licenseName,
      licenseNo,
      licenseExpiry,
      // Dynamic arrays
      experiences,
      references,
      // Consent
      signature,
      signedAt,
      qrCode,
      message,
      // In case you already prepared a resume URL elsewhere, accept it here
      resumeUrl: resumeUrlFromBody,
    } = body;

    // Basic validation (and ensure vacancyId is provided because schema requires it)
    if (!vacancyId) {
      return NextResponse.json(
        { error: "Missing required field: vacancyId" },
        { status: 400 }
      );
    }
    if (!firstName || !lastName || !email || !contactNo) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, lastName, email, contactNo" },
        { status: 400 }
      );
    }

    // Build full name from parts if not given
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    // Map to columns that actually exist in the Prisma model:
    // Application { id, vacancyId, fullName, email, phone, coverLetter, resumeUrl, status?, appliedDate... }
    const created = await prisma.application.create({
      data: {
        vacancyId,
        fullName,
        email,
        phone: contactNo,              // map your contactNo -> phone
        coverLetter: message ?? "",    // put your "message" into coverLetter
        resumeUrl: resumeUrlFromBody ?? "", // ensure a string (schema requires String, not null)
        // status, appliedDate, createdAt are handled by your defaults in schema
      },
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: created.id,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/public/applications:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
