// src/app/api/application/[id]/schedule-interview/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Enhanced email template for interview schedule
function generateInterviewEmail(data: {
  applicantName: string;
  position: string;
  college: string;
  interviewDate: string;
  teachingDemoDate: string;
  interviewTime?: string;
  location?: string;
  interviewType?: string;
  notes?: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 300;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 25px;
      color: #374151;
    }
    .congratulations-box {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-left: 5px solid #10b981;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .congratulations-box p {
      color: #065f46;
      font-size: 16px;
      font-weight: 500;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e40af;
      margin: 35px 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .info-card {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-radius: 10px;
      padding: 20px;
      margin: 15px 0;
      border-left: 5px solid #3b82f6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .info-label {
      font-weight: 700;
      color: #1e40af;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 18px;
      color: #1f2937;
      font-weight: 600;
      margin-left: 28px;
    }
    .checklist-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 10px;
      padding: 25px;
      margin: 20px 0;
      border-left: 5px solid #f59e0b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .checklist-card h3 {
      color: #92400e;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .checklist-card ul {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .checklist-card li {
      padding: 10px 0;
      color: #78350f;
      font-size: 15px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .checklist-card li:before {
      content: "✓";
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    }
    .important-notice {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left: 5px solid #ef4444;
      border-radius: 10px;
      padding: 20px;
      margin: 25px 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .important-notice strong {
      color: #991b1b;
      font-size: 18px;
      display: block;
      margin-bottom: 10px;
    }
    .important-notice p {
      color: #7f1d1d;
      font-size: 15px;
      line-height: 1.6;
    }
    .contact-section {
      background: #f9fafb;
      border-radius: 10px;
      padding: 25px;
      margin: 30px 0;
      border: 2px solid #e5e7eb;
    }
    .contact-section h3 {
      color: #1f2937;
      font-size: 18px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
      color: #4b5563;
      font-size: 15px;
    }
    .closing {
      margin-top: 40px;
      padding-top: 25px;
      border-top: 2px solid #e5e7eb;
    }
    .closing p {
      margin: 10px 0;
      color: #4b5563;
    }
    .signature {
      margin-top: 25px;
      font-weight: 600;
      color: #1f2937;
    }
    .footer {
      background: #1f2937;
      color: #9ca3af;
      padding: 30px;
      text-align: center;
      font-size: 13px;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer-brand {
      color: #ffffff;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 10px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 26px;
      }
      .content {
        padding: 25px 20px;
      }
      .section-title {
        font-size: 20px;
      }
      .info-value {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">🎓</div>
      <h1>Interview Invitation</h1>
      <p>Universidad de Manila - Human Resources Department</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Dear <strong>${data.applicantName}</strong>,
      </div>
      
      <div class="congratulations-box">
        <p>🎉 Congratulations! We are pleased to invite you for an interview for the position of <strong>${data.position}</strong> at <strong>${data.college}</strong>.</p>
      </div>
      
      <p style="margin: 20px 0; font-size: 16px; color: #4b5563;">
        Your application has been carefully reviewed by our team, and we are impressed with your qualifications. 
        We would like to meet you to discuss your experience and potential contribution to our institution.
      </p>
      
      <!-- Interview Schedule Section -->
      <div class="section-title">
        📅 Interview Schedule Details
      </div>
      
      <div class="info-card">
        <div class="info-label">
          📋 Initial Interview
        </div>
        <div class="info-value">
          ${formatDate(data.interviewDate)}
        </div>
        ${data.interviewTime ? `
        <div class="info-value" style="font-size: 16px; color: #4b5563; margin-top: 5px;">
          ⏰ ${formatTime(data.interviewTime)}
        </div>
        ` : ''}
      </div>
      
      <div class="info-card">
        <div class="info-label">
          🎓 Teaching Demonstration
        </div>
        <div class="info-value">
          ${formatDate(data.teachingDemoDate)}
        </div>
      </div>
      
      ${data.location ? `
      <div class="info-card">
        <div class="info-label">
          📍 Venue
        </div>
        <div class="info-value">
          ${data.location}
        </div>
      </div>
      ` : ''}
      
      ${data.interviewType ? `
      <div class="info-card">
        <div class="info-label">
          💼 Interview Format
        </div>
        <div class="info-value">
          ${data.interviewType}
        </div>
      </div>
      ` : ''}
      
      ${data.notes ? `
      <div class="info-card" style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-left-color: #9333ea;">
        <div class="info-label" style="color: #6b21a8;">
          📝 Additional Information
        </div>
        <div class="info-value" style="font-size: 15px; line-height: 1.8; color: #4b5563; margin-top: 10px;">
          ${data.notes}
        </div>
      </div>
      ` : ''}
      
      <!-- Requirements Section -->
      <div class="section-title">
        📋 Required Documents
      </div>
      
      <div class="checklist-card">
        <h3>Please bring the following on interview day:</h3>
        <ul>
          <li>Valid government-issued ID (original and photocopy)</li>
          <li>Updated resume/curriculum vitae</li>
          <li>Original copies of all academic credentials and certifications</li>
          <li>Teaching portfolio (if available)</li>
          <li>Professional license (if applicable - PRC, etc.)</li>
          <li>Any supporting documents mentioned in your application</li>
        </ul>
      </div>
      
      <div class="checklist-card" style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-left-color: #6366f1;">
        <h3 style="color: #312e81;">Teaching Demonstration Guidelines:</h3>
        <ul>
          <li style="color: #3730a3;">Prepare a 20-30 minute lesson demonstration</li>
          <li style="color: #3730a3;">Bring your detailed lesson plan and instructional materials</li>
          <li style="color: #3730a3;">Be ready to discuss your teaching philosophy and methodology</li>
          <li style="color: #3730a3;">The specific topic will be communicated to you prior to the demo</li>
          <li style="color: #3730a3;">Demonstrate your classroom management and engagement techniques</li>
        </ul>
      </div>
      
      <!-- Important Notice -->
      <div class="important-notice">
        <strong>⚠️ Important Reminder</strong>
        <p>
          If you need to reschedule or have any concerns regarding the interview schedule, 
          please contact our Human Resources Department <strong>at least 24 hours in advance</strong>. 
          We appreciate your prompt communication and professionalism.
        </p>
      </div>
      
      <!-- Contact Information -->
      <div class="contact-section">
        <h3>📞 Contact Information</h3>
        <div class="contact-item">
          <span>📧</span>
          <span><strong>Email:</strong> hr@udm.edu.ph</span>
        </div>
        <div class="contact-item">
          <span>☎️</span>
          <span><strong>Phone:</strong> (02) 8123-4567</span>
        </div>
        <div class="contact-item">
          <span>📍</span>
          <span><strong>Address:</strong> Universidad de Manila, Mehan Garden, Manila</span>
        </div>
      </div>
      
      <!-- Closing -->
      <div class="closing">
        <p style="font-size: 16px; color: #1f2937; font-weight: 500;">
          We look forward to meeting you and learning more about how your qualifications 
          align with our institutional goals and values.
        </p>
        
        <div class="signature">
          <p>Best regards,</p>
          <p style="color: #1e40af; font-size: 18px; margin-top: 5px;">Human Resources Department</p>
          <p style="color: #4b5563; font-weight: 500;">Universidad de Manila</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-brand">UDM TalentHub System</p>
      <p>This is an automated notification. Please do not reply directly to this email.</p>
      <p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #374151;">
        © ${new Date().getFullYear()} Universidad de Manila. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      interviewDate, 
      teachingDemoDate,
      interviewTime,
      location,
      interviewType,
      notes 
    } = body;

    console.log('📅 Scheduling interview:', { 
      id, 
      interviewDate, 
      teachingDemoDate,
      interviewTime,
      location 
    });

    if (!interviewDate || !teachingDemoDate) {
      return NextResponse.json(
        { error: 'Both interview and demo dates are required' },
        { status: 400 }
      );
    }

    // Check if application exists with vacancy details
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        vacancy: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Find or create interview record
    const existingInterview = await prisma.interview.findFirst({
      where: { applicationId: id }
    });

    let interview;

    if (existingInterview) {
      // Update existing interview
      interview = await prisma.interview.update({
        where: { id: existingInterview.id },
        data: {
          interviewDate: new Date(interviewDate),
          teachingDemoDate: new Date(teachingDemoDate),
          status: 'Scheduled',
        }
      });
    } else {
      // Create new interview
      interview = await prisma.interview.create({
        data: {
          interviewId: `INT-${Date.now()}`,
          applicationId: id,
          interviewDate: new Date(interviewDate),
          teachingDemoDate: new Date(teachingDemoDate),
          status: 'Scheduled',
        }
      });
    }

    // Update the application status and stage
    await prisma.application.update({
      where: { id },
      data: {
        stage: 'INTERVIEW_SCHEDULED',
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: new Date(interviewDate),
        demoDate: new Date(teachingDemoDate),
        statusUpdatedAt: new Date(),
      }
    });

    // Validate applicant email exists
    if (!application.email) {
      return NextResponse.json(
        { error: 'Applicant email not found' },
        { status: 400 }
      );
    }

    // Send email notification
    let emailSent = false;
    let emailError = null;
    
    try {
      console.log('📧 Preparing to send email to applicant:', application.email);
      console.log('📝 Applicant details:', {
        name: application.fullName,
        email: application.email,
        position: application.vacancy?.title || application.desiredPosition
      });

      const emailHtml = generateInterviewEmail({
        applicantName: application.fullName,
        position: application.vacancy?.title || application.desiredPosition || 'Faculty Position',
        college: application.vacancy?.college || application.department || 'Universidad de Manila',
        interviewDate: interviewDate,
        teachingDemoDate: teachingDemoDate,
        interviewTime: interviewTime,
        location: location,
        interviewType: interviewType,
        notes: notes,
      });

      const mailOptions = {
        from: `"UDM Human Resources" <${process.env.EMAIL_USER}>`,
        to: application.email, // This sends to the APPLICANT's email
        replyTo: process.env.EMAIL_USER, // HR can receive replies
        subject: `Interview Invitation - ${application.vacancy?.title || 'Faculty Position'} | Universidad de Manila`,
        html: emailHtml,
      };

      console.log('📮 Sending email to:', mailOptions.to);
      
      const info = await transporter.sendMail(mailOptions);
      emailSent = true;
      
      console.log('✅ Interview invitation email sent successfully!');
      console.log('📬 Message ID:', info.messageId);
      console.log('📧 Sent to:', application.email);
      
    } catch (error: any) {
      emailError = error.message;
      console.error('❌ Failed to send email:', error);
      console.error('📧 Attempted recipient:', application.email);
      // Don't fail the whole request if email fails
      // The interview is still scheduled in the database
    }

    console.log('✅ Interview scheduled successfully');

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Interview scheduled successfully! Invitation email has been sent to the applicant.' 
        : 'Interview scheduled successfully, but email notification failed to send.',
      data: interview,
      emailSent,
      emailError: emailError || undefined,
    });

  } catch (error: any) {
    console.error('❌ Schedule interview error:', error);
    return NextResponse.json({
      error: 'Failed to schedule interview',
      message: error.message
    }, { status: 500 });
  }
}