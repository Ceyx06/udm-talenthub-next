import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DetailedScores } from '@/types/evaluation';

// GET all evaluations
export async function GET(request: Request) {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
      },
      orderBy: {
        evaluatedAt: 'desc',
      },
    });

    return NextResponse.json(evaluations);
  } catch (error: any) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations', message: error?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST/UPDATE evaluation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      applicationId,
      evaluatedBy,
      remarks,
      
      // Category 1: Educational Qualifications
      highestDegreeKey,
      highestDegreePoints,
      additionalMasters,
      additionalBachelors,
      additionalCreditsUnits,
      
      // Category 2: Experience
      stateYears,
      otherInstitutionYears,
      adminBreakdown,
      industryBreakdown,
      teachingBreakdown,
      
      // Category 3: Professional Development
      category3Units,
      professionalDevScore,
      
      // Category 4: Technological Skills
      microsoftWord,
      microsoftExcel,
      microsoftPowerpoint,
      educationalAppsRating,
      educationalAppsCount,
      trainingBreakdown,
      creativeWorkBreakdown,
      
      // Pre-calculated scores
      educationalScore,
      experienceScore,
      technologicalScore,
      totalScore,
      rank,
      ratePerHour,
    } = body;

    // Validation
    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    // Calculate Category 1 subtotals
    const cat1_1 = highestDegreePoints || 0;
    const cat1_2 = Math.min(
      (additionalMasters || 0) * 4 + (additionalBachelors || 0) * 3,
      85
    );
    const cat1_3 = Math.min((additionalCreditsUnits || 0) * 1, 10);

    const calculatedEducationalScore = educationalScore || (cat1_1 + cat1_2 + cat1_3);

    // Calculate Category 2 subtotals
    const cat2_1 = (stateYears || 0) * 1;
    const cat2_2 = (otherInstitutionYears || 0) * 0.75;
    
    const cat2_3 = (
      (adminBreakdown?.president || 0) * 3 +
      (adminBreakdown?.vicePresident || 0) * 2.5 +
      (adminBreakdown?.dean || 0) * 2 +
      (adminBreakdown?.departmentHead || 0) * 1
    );
    
    const cat2_4 = (
      (industryBreakdown?.engineer || 0) * 1.5 +
      (industryBreakdown?.technician || 0) * 1 +
      (industryBreakdown?.skilledWorker || 0) * 0.5
    );
    
    const cat2_5 = (
      (teachingBreakdown?.cooperatingTeacher || 0) * 1.5 +
      (teachingBreakdown?.basicEducation || 0) * 1
    );

    const calculatedExperienceScore = experienceScore || (cat2_1 + cat2_2 + cat2_3 + cat2_4 + cat2_5);

    // Category 3 (already calculated in frontend)
    const calculatedProfessionalDevScore = professionalDevScore || 0;

    // Calculate Category 4 subtotals
    const cat4_1 = Math.min(
      (microsoftWord || 0) + (microsoftExcel || 0) + (microsoftPowerpoint || 0),
      15
    );
    
    const cat4_2 = Math.min(
      (educationalAppsRating || 0) * (educationalAppsCount || 1),
      10
    );
    
    const cat4_3 = Math.min(
      (trainingBreakdown?.international || 0) * 5 +
      (trainingBreakdown?.national || 0) * 3 +
      (trainingBreakdown?.local || 0) * 2,
      10
    );
    
    const cat4_4 = (
      (creativeWorkBreakdown?.originality || 0) * 0.25 +
      (creativeWorkBreakdown?.acceptability || 0) * 0.25 +
      (creativeWorkBreakdown?.relevance || 0) * 0.25 +
      (creativeWorkBreakdown?.documentation || 0) * 0.25
    );

    const calculatedTechnologicalScore = technologicalScore || (cat4_1 + cat4_2 + cat4_3 + cat4_4);

    // Calculate total
    const calculatedTotalScore = totalScore || (
      calculatedEducationalScore +
      calculatedExperienceScore +
      calculatedProfessionalDevScore +
      calculatedTechnologicalScore
    );

    // Build enhanced detailedScores
    const detailedScores: DetailedScores = {
      educational: {
        highestDegreeKey: highestDegreeKey || undefined,
        highestDegreePoints: cat1_1,
        additionalDegrees: {
          points: cat1_2,
          masters: additionalMasters || 0,
          bachelors: additionalBachelors || 0,
        },
        additionalCredits: {
          points: cat1_3,
          units: additionalCreditsUnits || 0,
        },
        subtotal: calculatedEducationalScore,
      },
      experience: {
        academicService: {
          statePoints: cat2_1,
          stateYears: stateYears || 0,
          otherPoints: cat2_2,
          otherYears: otherInstitutionYears || 0,
        },
        administrative: {
          points: cat2_3,
          breakdown: adminBreakdown || {},
        },
        industry: {
          points: cat2_4,
          breakdown: industryBreakdown || {},
        },
        otherTeaching: {
          points: cat2_5,
          breakdown: teachingBreakdown || {},
        },
        subtotal: calculatedExperienceScore,
      },
      professionalDevelopment: {
        details: category3Units || {},
        subtotal: calculatedProfessionalDevScore,
      },
      technologicalSkills: {
        basicMicrosoft: {
          subtotal: cat4_1,
          word: microsoftWord || 0,
          excel: microsoftExcel || 0,
          powerpoint: microsoftPowerpoint || 0,
        },
        educationalApps: {
          subtotal: cat4_2,
          rating: educationalAppsRating || 0,
          count: educationalAppsCount || 0,
        },
        longTraining: {
          subtotal: cat4_3,
          breakdown: trainingBreakdown || {},
        },
        creativeWork: {
          subtotal: cat4_4,
          breakdown: creativeWorkBreakdown || {},
        },
        subtotal: calculatedTechnologicalScore,
      },
    };

    console.log('Saving detailedScores:', JSON.stringify(detailedScores, null, 2));

    console.log('=== ABOUT TO SAVE ===');
console.log('detailedScores structure:', JSON.stringify(detailedScores, null, 2));
console.log('educational.highestDegreeKey:', detailedScores.educational?.highestDegreeKey);
console.log('educational.highestDegreePoints:', detailedScores.educational?.highestDegreePoints);
console.log('educational.additionalDegrees:', detailedScores.educational?.additionalDegrees);
console.log('experience.academicService:', detailedScores.experience?.academicService);
console.log('=====================');

    // Upsert evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        educationalScore: calculatedEducationalScore,
        experienceScore: calculatedExperienceScore,
        professionalDevScore: calculatedProfessionalDevScore,
        technologicalScore: calculatedTechnologicalScore,
        totalScore: calculatedTotalScore,
        rank: rank || null,
        ratePerHour: ratePerHour || null,
        detailedScores: detailedScores as any,
        evaluatedBy: evaluatedBy || null,
        remarks: remarks || null,
        contractStatus: 'pending',
        evaluatedAt: new Date(),
      },
      update: {
        educationalScore: calculatedEducationalScore,
        experienceScore: calculatedExperienceScore,
        professionalDevScore: calculatedProfessionalDevScore,
        technologicalScore: calculatedTechnologicalScore,
        totalScore: calculatedTotalScore,
        rank: rank || null,
        ratePerHour: ratePerHour || null,
        detailedScores: detailedScores as any,
        evaluatedBy: evaluatedBy || null,
        remarks: remarks || null,
        evaluatedAt: new Date(),
      },
    });

    // Update application status if qualified
    const PASSING_SCORE = 175;
    const isQualified = calculatedTotalScore >= PASSING_SCORE;

    if (isQualified) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          stage: 'HIRED',
          status: 'HIRED',
          statusUpdatedAt: new Date(),
          employeeId: `EMP-${Date.now()}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
      hired: isQualified,
      totalScore: calculatedTotalScore,
    });
  } catch (error: any) {
    console.error('Error saving evaluation:', error);
    return NextResponse.json(
      {
        error: 'Failed to save evaluation',
        message: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}