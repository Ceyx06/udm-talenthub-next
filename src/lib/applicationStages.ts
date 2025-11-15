// src/lib/applicationStages.ts

// Display stages (what users see)
export const APPLICATION_STAGES = {
  APPLIED: 'Applied',
  ENDORSED: 'Endorsed',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  EVALUATED: 'Evaluated',
  FOR_HIRING: 'For Hiring',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
} as const;

// Database stages (stored in DB)
export const DB_STAGES = {
  APPLIED: 'APPLIED',
  ENDORSED: 'ENDORSED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  EVALUATED: 'EVALUATED',
  FOR_HIRING: 'FOR_HIRING',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
} as const;

// Convert display stage to database stage
export function toDbStage(displayStage: string): string {
  const stageMap: Record<string, string> = {
    'Applied': 'APPLIED',
    'Endorsed': 'ENDORSED',
    'Interview Scheduled': 'INTERVIEW_SCHEDULED',
    'Evaluated': 'EVALUATED',
    'For Hiring': 'FOR_HIRING',
    'Hired': 'HIRED',
    'Rejected': 'REJECTED',
  };
  return stageMap[displayStage] || displayStage;
}

// Convert database stage to display stage
export function toDisplayStage(dbStage: string): string {
  const stageMap: Record<string, string> = {
    'APPLIED': 'Applied',
    'ENDORSED': 'Endorsed',
    'INTERVIEW_SCHEDULED': 'Interview Scheduled',
    'EVALUATED': 'Evaluated',
    'FOR_HIRING': 'For Hiring',
    'HIRED': 'Hired',
    'REJECTED': 'Rejected',
  };
  return stageMap[dbStage] || dbStage;
}

// Get color for stage badge
export function getStageColor(stage: string): string {
  const colorMap: Record<string, string> = {
    'Applied': 'blue',
    'APPLIED': 'blue',
    'Endorsed': 'purple',
    'ENDORSED': 'purple',
    'Interview Scheduled': 'yellow',
    'INTERVIEW_SCHEDULED': 'yellow',
    'Evaluated': 'orange',
    'EVALUATED': 'orange',
    'For Hiring': 'green',
    'FOR_HIRING': 'green',
    'Hired': 'emerald',
    'HIRED': 'emerald',
    'Rejected': 'red',
    'REJECTED': 'red',
  };
  return colorMap[stage] || 'gray';
}