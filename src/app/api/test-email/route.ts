// src/app/api/test-email/route.ts
// Create this file to test if email sending works

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    console.log('🧪 Testing email configuration...');
    
    // Check if environment variables exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Email credentials not configured',
        details: {
          EMAIL_USER: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
          EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing',
        }
      }, { status: 500 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection
    console.log('📧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"UDM HR Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ UDM TalentHub Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #0d9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>🎉 Email Configuration Successful!</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2>Test Results:</h2>
            <ul>
              <li><strong>✅ SMTP Connection:</strong> Working</li>
              <li><strong>✅ Email Sending:</strong> Successful</li>
              <li><strong>✅ Configuration:</strong> Complete</li>
            </ul>
            <p>Your email notification system is ready to use!</p>
            <hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #666;">
              Sent from UDM TalentHub System<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully! Check your inbox.',
      details: {
        messageId: info.messageId,
        recipient: process.env.EMAIL_USER,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Email test failed',
      details: {
        message: error.message,
        code: error.code,
        command: error.command,
      }
    }, { status: 500 });
  }
}