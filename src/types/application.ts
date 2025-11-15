// src/types/application.ts

export interface Application {
  id: string;
  vacancyId: string;
  
  // Required fields
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  resumeUrl: string;
  
  status: string;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Personal Information
  firstName?: string;
  middleName?: string;
  lastName?: string;
  contactNo?: string;
  dob?: Date;
  gender?: string;
  civilStatus?: string;
  presentAddress?: string;
  permanentAddress?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  
  // Position Information
  desiredPosition?: string;
  department?: string;
  employmentType?: string;
  
  // Education
  highestDegree?: string;
  trainingHours?: number;
  licenseName?: string;
  licenseNo?: string;
  licenseExpiry?: Date;
  
  // JSON fields
  experiences?: any[];
  references?: any[];
  
  // Document URLs
  pdsUrl?: string;
  transcriptUrl?: string;
  trainingsUrl?: string;
  employmentUrl?: string;
  
  // Application tracking
  signature?: string;
  signedAt?: Date;
  qrCode?: string;
  message?: string;
  stage?: string;
  
  // Stage dates
  endorsedDate?: Date;
  employeeId?: string;
  hiredAt?: Date;
  interviewDate?: Date;
  demoDate?: Date;
  statusUpdatedAt?: Date;
  
  // Evaluation
  evaluationScore?: number;
  evaluationNotes?: string;
  rejectionReason?: string;
  
  // Relations
  vacancy?: {
    title: string;
    college: string;
  };
}