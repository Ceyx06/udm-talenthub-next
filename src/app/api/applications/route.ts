import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/applications - Handle JSON application submission
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Check if it's JSON
    if (contentType.includes("application/json")) {
      const body = await request.json();

      console.log("Received application data:", body);

      const {
        vacancyId,
        firstName,
        middleName,
        lastName,
        fullName,
        dob,
        gender,
        civilStatus,
        contactNo,
        phone,
        email,
        presentAddress,
        permanentAddress,
        nationality,
        idType,
        idNumber,
        desiredPosition,
        department,
        employmentType,
        highestDegree,
        trainingHours,
        licenseName,
        licenseNo,
        licenseExpiry,
        message,
        coverLetter,
        experiences,
        references,
        resumeUrl,
        signature,
        signedAt,
        qrCode
      } = body;

      // Validate required fields
      if (!vacancyId || !email) {
        return NextResponse.json(
          { error: "Missing required fields (vacancyId, email)" },
          { status: 400 }
        );
      }

      // Parse experiences and references
      let experiencesData = [];
      let referencesData = [];

      try {
        experiencesData = experiences ? JSON.parse(experiences) : [];
      } catch (e) {
        console.error("Error parsing experiences:", e);
        experiencesData = [];
      }

      try {
        referencesData = references ? JSON.parse(references) : [];
      } catch (e) {
        console.error("Error parsing references:", e);
        referencesData = [];
      }

      // Create the application
      const application = await prisma.application.create({
        data: {
          vacancyId,
          fullName: fullName || `${firstName || ''} ${middleName || ''} ${lastName || ''}`.trim(),
          email,
          phone: phone || contactNo || '',
          resumeUrl: resumeUrl || '',
          coverLetter: coverLetter || message || '',
          status: 'Pending',
          stage: 'Applied',
          appliedDate: new Date(),
          endorsedDate: null, // Not endorsed yet
          // Personal Details
          firstName: firstName || null,
          middleName: middleName || null,
          lastName: lastName || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          civilStatus: civilStatus || null,
          contactNo: contactNo || phone || null,
          presentAddress: presentAddress || null,
          permanentAddress: permanentAddress || null,
          nationality: nationality || null,
          idType: idType || null,
          idNumber: idNumber || null,
          // Position Info
          desiredPosition: desiredPosition || null,
          department: department || null,
          employmentType: employmentType || null,
          // Education
          highestDegree: highestDegree || null,
          trainingHours: trainingHours || null,
          licenseName: licenseName || null,
          licenseNo: licenseNo || null,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          // Additional Data
          experiences: experiencesData,
          references: referencesData,
          signature: signature || null,
          signedAt: signedAt ? new Date(signedAt) : new Date(),
          qrCode: qrCode || `UDM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          message: message || null
        }
      });

      console.log("Application created successfully:", application.id);

      return NextResponse.json({
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
        application
      }, { status: 201 });
    }

    // If not JSON, return error
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

// GET /api/applications - Fetch applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vacancyId = searchParams.get('vacancyId');
    const status = searchParams.get('status');
    const endorsed = searchParams.get('endorsed'); // New parameter

    let whereClause: any = {};

    if (vacancyId) {
      whereClause.vacancyId = vacancyId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Filter by endorsed status
    if (endorsed === 'true') {
      whereClause.endorsedDate = {
        not: null // Only show endorsed applications
      };
    } else if (endorsed === 'false') {
      whereClause.endorsedDate = null; // Only show non-endorsed applications
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        vacancy: {
          select: {
            title: true,
            college: true,
          }
        },
        interviews: true // Include interview data to check if scheduled
      },
      orderBy: {
        appliedDate: 'desc'
      }
    });

    return NextResponse.json(applications);

  } catch (error: any) {
    console.error('GET /api/applications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}