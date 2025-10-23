import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Force Node runtime (needed for fs)
export const runtime = "nodejs";

// Public: POST /api/applications  (multipart/form-data)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const vacancyId   = formData.get("vacancyId") as string;
    const fullName    = formData.get("fullName") as string;
    const email       = formData.get("email") as string;
    const phone       = formData.get("phone") as string;
    const coverLetter = formData.get("coverLetter") as string;
    const resume      = formData.get("resume") as File;

    if (!vacancyId || !fullName || !email || !phone || !coverLetter || !resume) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Save resume under public/uploads/resumes
    const bytes = Buffer.from(await resume.arrayBuffer());
    const uploadsDir = join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadsDir, { recursive: true });
    const fileName = `${Date.now()}-${resume.name.replace(/\s+/g, "_")}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, bytes);

    const resumeUrl = `/uploads/resumes/${fileName}`;

    const application = await prisma.application.create({
      data: {
        vacancyId,
        fullName,
        email,
        phone,
        coverLetter,
        resumeUrl,
        status: "Pending",
        appliedDate: new Date(),
      },
    });

    return NextResponse.json({
      message: "Application submitted successfully",
      applicationId: application.id,
    });
  } catch (error: any) {
    console.error("POST /api/applications:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
