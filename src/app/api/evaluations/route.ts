// src/app/api/evaluations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EvaluationFieldType, type Prisma } from "@prisma/client";

export const runtime = "nodejs";

/** Same credit table as in your EvaluationPage.tsx */
const CAT3_CREDITS: Record<string, number> = {
  // 3.1.1 Inventions / Discoveries / Creative works
  inv_patent_intl: 7,
  inv_patent_nat: 5,
  inv_patent_inst: 2,
  inv_pending_intl: 7,
  inv_pending_nat: 5,
  inv_pending_inst: 2,
  disc_originality: 4.2,
  disc_dissemination: 2.8,
  cw_accept: 1.75,
  cw_recognition: 1.75,
  cw_relevance: 1.75,
  cw_documentation: 1.75,

  // 3.1.2 Published book (last 10 yrs)
  book_sa_tertiary: 7,
  book_sa_hs: 5,
  book_sa_elem: 4,
  book_ca_tertiary: 3,
  book_ca_hs: 2,
  book_ca_elem: 2,
  book_rev_tertiary: 4,
  book_rev_hs: 2,
  book_rev_elem: 1,
  book_trans_tertiary: 3,
  book_trans_hs: 2,
  book_trans_elem: 1,
  book_edit_tertiary: 2,
  book_edit_hs: 2,
  book_edit_elem: 1,
  book_comp_tertiary: 2,
  book_comp_hs: 1,
  book_comp_elem: 1,

  // 3.1.3 Articles
  art_intl_sa: 5,
  art_intl_ca: 2.5,
  art_nat_sa: 3,
  art_nat_ca: 1.5,
  art_local_sa: 2,
  art_local_ca: 1,

  // 3.1.4 Instructional materials
  inst_single: 1,
  inst_co: 0.5,

  // 3.2.1 Training & Seminars
  ts_intl: 5,
  ts_nat: 3,
  ts_local: 2,
  ts_industry: 0.1,
  ts_conf_intl: 3,
  ts_conf_nat: 2,
  ts_conf_local: 1,

  // 3.2.2 Expert Services Rendered
  es_intl: 7,
  es_nat: 5,
  es_local: 2,
  coord_intl: 5,
  coord_nat: 3,
  coord_local: 2,
  adv_doc: 1,
  adv_master: 0.5,
  adv_undergrad: 0.25,
  es_reviewer: 1,
  es_accredit: 1,
  es_trade: 1,
  es_coach: 1,

  // 3.3.1 Professional Organizations
  po_full: 2,
  po_assoc: 1,
  po_honor: 1,
  po_science: 1,
  po_officer: 1,
  po_member: 0.5,

  // 3.3.2 Scholarship / Fellowship
  sf_intl_degree: 5,
  sf_intl_non: 4,
  sf_nat_degree: 3,
  sf_nat_non: 2,

  // 3.4 Awards of Distinction
  award_intl: 5,
  award_nat: 3,
  award_local: 1,

  // 3.5 Community Outreach
  co_service: 1,

  // 3.6 Professional Examinations
  pex_eng_law_teachers: 5,
  pex_marine_elec: 2,
  pex_trade_other: 1,
};

/** Map each CAT3 key to its rubric subcategory */
const CAT3_SUBCATEGORY: Record<string, string> = {
  // 3.1.1
  inv_patent_intl: "3.1.1",
  inv_patent_nat: "3.1.1",
  inv_patent_inst: "3.1.1",
  inv_pending_intl: "3.1.1",
  inv_pending_nat: "3.1.1",
  inv_pending_inst: "3.1.1",
  disc_originality: "3.1.1",
  disc_dissemination: "3.1.1",
  cw_accept: "3.1.1",
  cw_recognition: "3.1.1",
  cw_relevance: "3.1.1",
  cw_documentation: "3.1.1",

  // 3.1.2
  book_sa_tertiary: "3.1.2",
  book_sa_hs: "3.1.2",
  book_sa_elem: "3.1.2",
  book_ca_tertiary: "3.1.2",
  book_ca_hs: "3.1.2",
  book_ca_elem: "3.1.2",
  book_rev_tertiary: "3.1.2",
  book_rev_hs: "3.1.2",
  book_rev_elem: "3.1.2",
  book_trans_tertiary: "3.1.2",
  book_trans_hs: "3.1.2",
  book_trans_elem: "3.1.2",
  book_edit_tertiary: "3.1.2",
  book_edit_hs: "3.1.2",
  book_edit_elem: "3.1.2",
  book_comp_tertiary: "3.1.2",
  book_comp_hs: "3.1.2",
  book_comp_elem: "3.1.2",

  // 3.1.3
  art_intl_sa: "3.1.3",
  art_intl_ca: "3.1.3",
  art_nat_sa: "3.1.3",
  art_nat_ca: "3.1.3",
  art_local_sa: "3.1.3",
  art_local_ca: "3.1.3",

  // 3.1.4
  inst_single: "3.1.4",
  inst_co: "3.1.4",

  // 3.2.1
  ts_intl: "3.2.1",
  ts_nat: "3.2.1",
  ts_local: "3.2.1",
  ts_industry: "3.2.1",
  ts_conf_intl: "3.2.1",
  ts_conf_nat: "3.2.1",
  ts_conf_local: "3.2.1",

  // 3.2.2
  es_intl: "3.2.2",
  es_nat: "3.2.2",
  es_local: "3.2.2",
  coord_intl: "3.2.2",
  coord_nat: "3.2.2",
  coord_local: "3.2.2",
  adv_doc: "3.2.2",
  adv_master: "3.2.2",
  adv_undergrad: "3.2.2",
  es_reviewer: "3.2.2",
  es_accredit: "3.2.2",
  es_trade: "3.2.2",
  es_coach: "3.2.2",

  // 3.3.1
  po_full: "3.3.1",
  po_assoc: "3.3.1",
  po_honor: "3.3.1",
  po_science: "3.3.1",
  po_officer: "3.3.1",
  po_member: "3.3.1",

  // 3.3.2
  sf_intl_degree: "3.3.2",
  sf_intl_non: "3.3.2",
  sf_nat_degree: "3.3.2",
  sf_nat_non: "3.3.2",

  // 3.4
  award_intl: "3.4",
  award_nat: "3.4",
  award_local: "3.4",

  // 3.5
  co_service: "3.5",

  // 3.6
  pex_eng_law_teachers: "3.6",
  pex_marine_elec: "3.6",
  pex_trade_other: "3.6",
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Build all EvaluationItem rows from the rich detailedScores JSON.
 * This matches your UI structure (1.1–1.3, 2.1–2.5, 3.1–3.6, 4.1–4.4).
 */
function buildEvaluationItems(
  evaluationId: string,
  detailedScores: any,
): Prisma.EvaluationItemCreateManyInput[] {
  const items: Prisma.EvaluationItemCreateManyInput[] = [];
  if (!detailedScores || typeof detailedScores !== "object") return items;

  /* ---------- CATEGORY 1: EDUCATIONAL (1.1–1.3) ---------- */
  const edu = detailedScores.educational ?? {};

  // 1.1 Highest Degree – RADIO (yes/no) + credited points
  const highestKey: string | undefined = edu.highestDegree || undefined;
  const highestPoints = num(edu.highestDegreePoints);

  if (highestKey) {
    items.push({
      evaluationId,
      category: 1,
      subcategory: "1.1",
      itemKey: `c11_${highestKey}`,
      label: "Highest relevant academic degree",
      fieldType: EvaluationFieldType.RADIO,
      yesNo: true,
      units: null,
      scale: null,
      // for "c. Others please specify", you allowed editable points
      customPoints:
        highestKey === "bachelor_other" ? num(edu.additionalDegrees?.points ?? highestPoints) : null,
      creditPerUnit: highestPoints || null,
      creditedPoints: highestPoints || null,
    });
  }

  const addDeg = edu.additionalDegrees ?? {};
  const mastersCount = num(addDeg.mastersCount);
  const bachelorsCount = num(addDeg.bachelorsCount);

  // 1.2.1 Additional Masters – UNITS
  if (mastersCount > 0) {
    const credit = 4;
    items.push({
      evaluationId,
      category: 1,
      subcategory: "1.2",
      itemKey: "c12_add_masters",
      label: "1.2.1 Additional Master's degree",
      fieldType: EvaluationFieldType.UNITS,
      units: mastersCount,
      creditPerUnit: credit,
      creditedPoints: mastersCount * credit,
    });
  }

  // 1.2.2 Additional Bachelor’s – UNITS
  if (bachelorsCount > 0) {
    const credit = 3;
    items.push({
      evaluationId,
      category: 1,
      subcategory: "1.2",
      itemKey: "c12_add_bachelors",
      label: "1.2.2 Additional Bachelor's degree",
      fieldType: EvaluationFieldType.UNITS,
      units: bachelorsCount,
      creditPerUnit: credit,
      creditedPoints: bachelorsCount * credit,
    });
  }

  // 1.3 Additional credits – every 3 units = 1 point, max 10
  const addCred = edu.additionalCredits ?? {};
  const totalUnits = num(addCred.totalUnits); // this is your "additionalUnits"
  const triples = Math.floor(totalUnits / 3);
  const addCredPoints = num(addCred.points);

  if (triples > 0 && addCredPoints > 0) {
    items.push({
      evaluationId,
      category: 1,
      subcategory: "1.3",
      itemKey: "c13_additional_units",
      label: "1.3.1 For every 3 units earned toward a higher approved degree",
      fieldType: EvaluationFieldType.UNITS,
      units: triples, // # of 3-unit blocks
      creditPerUnit: 1,
      creditedPoints: addCredPoints,
    });
  }

  /* ---------- CATEGORY 2: EXPERIENCE (2.1–2.5) ---------- */
  const exp = detailedScores.experience ?? {};
  const acad = exp.academicService ?? {};
  const adm = exp.administrative ?? {};
  const ind = exp.industry ?? {};
  const otherTeach = exp.otherTeaching ?? {};

  // 2.1 – State / SUC / CHED / TESDA
  const stateYears = num(acad.stateYears);
  if (stateYears > 0) {
    const credit = 1;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.1",
      itemKey: "c21_state_institution",
      label: "State SUC / CHED-supervised HEI / TESDA-supervised TEI",
      fieldType: EvaluationFieldType.UNITS,
      units: stateYears,
      creditPerUnit: credit,
      creditedPoints: stateYears * credit,
    });
  }

  // 2.2 – Other HEIs / private / research
  const otherYears = num(acad.otherYears);
  if (otherYears > 0) {
    const credit = 0.75;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.2",
      itemKey: "c22_other_heis",
      label: "Other HEIs / private / research institutions",
      fieldType: EvaluationFieldType.UNITS,
      units: otherYears,
      creditPerUnit: credit,
      creditedPoints: otherYears * credit,
    });
  }

  // 2.3 Administrative roles
  const presYears = num(adm.presidentYears);
  if (presYears > 0) {
    const c = 3;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.3",
      itemKey: "c23_president",
      label: "President",
      fieldType: EvaluationFieldType.UNITS,
      units: presYears,
      creditPerUnit: c,
      creditedPoints: presYears * c,
    });
  }

  const vpYears = num(adm.vpYears);
  if (vpYears > 0) {
    const c = 2.5;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.3",
      itemKey: "c23_vp",
      label: "Vice-President (incl. Board Secretary)",
      fieldType: EvaluationFieldType.UNITS,
      units: vpYears,
      creditPerUnit: c,
      creditedPoints: vpYears * c,
    });
  }

  const deanYears = num(adm.deanYears);
  if (deanYears > 0) {
    const c = 2;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.3",
      itemKey: "c23_dean",
      label: "Dean / Director / School Superintendent",
      fieldType: EvaluationFieldType.UNITS,
      units: deanYears,
      creditPerUnit: c,
      creditedPoints: deanYears * c,
    });
  }

  const principalYears = num(adm.principalYears);
  if (principalYears > 0) {
    const c = 1;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.3",
      itemKey: "c23_principal",
      label: "Principal / Supervisor / Department Chair / Head of Unit",
      fieldType: EvaluationFieldType.UNITS,
      units: principalYears,
      creditPerUnit: c,
      creditedPoints: principalYears * c,
    });
  }

  // 2.4 Industry experience
  const engYears = num(ind.engineerYears);
  if (engYears > 0) {
    const c = 1.5;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.4",
      itemKey: "c24_engineer_manager",
      label: "Engineer / Plant / Farm Manager",
      fieldType: EvaluationFieldType.UNITS,
      units: engYears,
      creditPerUnit: c,
      creditedPoints: engYears * c,
    });
  }

  const techYears = num(ind.technicianYears);
  if (techYears > 0) {
    const c = 1;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.4",
      itemKey: "c24_technician",
      label: "Technician",
      fieldType: EvaluationFieldType.UNITS,
      units: techYears,
      creditPerUnit: c,
      creditedPoints: techYears * c,
    });
  }

  const skillYears = num(ind.skilledWorkerYears);
  if (skillYears > 0) {
    const c = 0.5;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.4",
      itemKey: "c24_skilled_worker",
      label: "Skilled worker",
      fieldType: EvaluationFieldType.UNITS,
      units: skillYears,
      creditPerUnit: c,
      creditedPoints: skillYears * c,
    });
  }

  // 2.5 Other teaching
  const coopYears = num(otherTeach.cooperatingTeacherYears);
  if (coopYears > 0) {
    const c = 1.5;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.5",
      itemKey: "c25_cooperating_teacher",
      label: "Cooperating teacher",
      fieldType: EvaluationFieldType.UNITS,
      units: coopYears,
      creditPerUnit: c,
      creditedPoints: coopYears * c,
    });
  }

  const basicEdYears = num(otherTeach.basicEdTeacherYears);
  if (basicEdYears > 0) {
    const c = 1;
    items.push({
      evaluationId,
      category: 2,
      subcategory: "2.5",
      itemKey: "c25_basic_ed_teacher",
      label: "Basic education teacher",
      fieldType: EvaluationFieldType.UNITS,
      units: basicEdYears,
      creditPerUnit: c,
      creditedPoints: basicEdYears * c,
    });
  }

  /* ---------- CATEGORY 3: PROFESSIONAL DEV (3.1–3.6) ---------- */
  const prof = detailedScores.professionalDevelopment ?? {};
  const pdDetails = prof.details ?? {};

  for (const key of Object.keys(pdDetails)) {
    const units = num(pdDetails[key]);
    if (!units) continue;

    const credit = CAT3_CREDITS[key] ?? 0;
    if (!credit) continue;

    const subcat = CAT3_SUBCATEGORY[key] ?? "3.x";

    items.push({
      evaluationId,
      category: 3,
      subcategory: subcat,
      itemKey: key,
      label: key,
      fieldType: EvaluationFieldType.UNITS,
      units,
      creditPerUnit: credit,
      creditedPoints: units * credit,
    });
  }

  /* ---------- CATEGORY 4: TECHNOLOGICAL (4.1–4.4) ---------- */
  const tech = detailedScores.technologicalSkills ?? {};

  const basicMs = tech.basicMicrosoft ?? {};
  const eduApps = tech.educationalApps ?? {};
  const training = tech.longTraining ?? {};
  const creative = tech.creativeWork ?? {};

  // 4.1 – Basic MS
  const word = num(basicMs.word);
  if (word > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.1",
      itemKey: "c41_word",
      label: "Microsoft Word",
      fieldType: EvaluationFieldType.SCALE,
      scale: word,
      creditPerUnit: 1,
      creditedPoints: word,
    });
  }

  const excel = num(basicMs.excel);
  if (excel > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.1",
      itemKey: "c41_excel",
      label: "Excel",
      fieldType: EvaluationFieldType.SCALE,
      scale: excel,
      creditPerUnit: 1,
      creditedPoints: excel,
    });
  }

  const ppt = num(basicMs.powerpoint);
  if (ppt > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.1",
      itemKey: "c41_powerpoint",
      label: "PowerPoint",
      fieldType: EvaluationFieldType.SCALE,
      scale: ppt,
      creditPerUnit: 1,
      creditedPoints: ppt,
    });
  }

  // 4.2 – Educational apps
  const apps = num(eduApps.apps);
  if (apps > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.2",
      itemKey: "c42_edu_apps",
      label: "Educational / related apps",
      fieldType: EvaluationFieldType.SCALE,
      scale: apps,
      creditPerUnit: 1,
      creditedPoints: apps,
    });
  }

  // 4.3 – Training course
  const intl = num(training.international);
  if (intl > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.3",
      itemKey: "c43_intl",
      label: "Training – International",
      fieldType: EvaluationFieldType.SCALE,
      scale: intl,
      creditPerUnit: 1,
      creditedPoints: intl,
    });
  }
  const nat = num(training.national);
  if (nat > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.3",
      itemKey: "c43_nat",
      label: "Training – National",
      fieldType: EvaluationFieldType.SCALE,
      scale: nat,
      creditPerUnit: 1,
      creditedPoints: nat,
    });
  }
  const local = num(training.local);
  if (local > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.3",
      itemKey: "c43_local",
      label: "Training – Local",
      fieldType: EvaluationFieldType.SCALE,
      scale: local,
      creditPerUnit: 1,
      creditedPoints: local,
    });
  }

  // 4.4 – Creative work
  const orig = num(creative.originality);
  if (orig > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.4",
      itemKey: "c44_originality",
      label: "Originality",
      fieldType: EvaluationFieldType.SCALE,
      scale: orig,
      creditPerUnit: 1,
      creditedPoints: orig,
    });
  }
  const acc = num(creative.acceptability);
  if (acc > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.4",
      itemKey: "c44_acceptability",
      label: "Acceptability & recognition",
      fieldType: EvaluationFieldType.SCALE,
      scale: acc,
      creditPerUnit: 1,
      creditedPoints: acc,
    });
  }
  const rel = num(creative.relevance);
  if (rel > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.4",
      itemKey: "c44_relevance",
      label: "Relevance & value",
      fieldType: EvaluationFieldType.SCALE,
      scale: rel,
      creditPerUnit: 1,
      creditedPoints: rel,
    });
  }
  const doc = num(creative.documentation);
  if (doc > 0) {
    items.push({
      evaluationId,
      category: 4,
      subcategory: "4.4",
      itemKey: "c44_documentation",
      label: "Documentation & evidence",
      fieldType: EvaluationFieldType.SCALE,
      scale: doc,
      creditPerUnit: 1,
      creditedPoints: doc,
    });
  }

  return items;
}

/** POST /api/evaluations  – save Evaluation + EvaluationItem[] */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      applicationId,
      educationalScore,
      experienceScore,
      professionalDevScore,
      technologicalScore,
      totalScore,
      rank,
      ratePerHour,
      detailedScores,
      evaluatedBy,
      remarks,
    } = body || {};

    if (!applicationId) {
      return NextResponse.json(
        { message: "applicationId is required" },
        { status: 400 },
      );
    }

    // Upsert Evaluation by unique applicationId
    const evaluation = await prisma.evaluation.upsert({
      where: { applicationId },
      update: {
        educationalScore: num(educationalScore),
        experienceScore: num(experienceScore),
        professionalDevScore: num(professionalDevScore),
        technologicalScore: num(technologicalScore),
        totalScore: num(totalScore),
        rank: rank ?? null,
        ratePerHour: num(ratePerHour),
        detailedScores,
        evaluatedBy: evaluatedBy || "Unknown",
        remarks: remarks ?? null,
        evaluatedAt: new Date(),
      },
      create: {
        applicationId,
        educationalScore: num(educationalScore),
        experienceScore: num(experienceScore),
        professionalDevScore: num(professionalDevScore),
        technologicalScore: num(technologicalScore),
        totalScore: num(totalScore),
        rank: rank ?? null,
        ratePerHour: num(ratePerHour),
        detailedScores,
        evaluatedBy: evaluatedBy || "Unknown",
        remarks: remarks ?? null,
      },
    });

    // Rebuild EvaluationItem rows
    const items = buildEvaluationItems(evaluation.id, detailedScores);

    // Remove old rows then insert new ones
    await prisma.evaluationItem.deleteMany({
      where: { evaluationId: evaluation.id },
    });

    if (items.length > 0) {
      await prisma.evaluationItem.createMany({ data: items });
    }

    // Optional: update Application stage + evaluationScore
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: "EVALUATING",
        evaluationScore: num(totalScore),
        evaluationNotes: remarks ?? null,
      },
    });

    return NextResponse.json({
      message: "Evaluation saved",
      evaluationId: evaluation.id,
      itemsCount: items.length,
    });
  } catch (error: any) {
    console.error("Error saving evaluation:", error);
    return NextResponse.json(
      {
        message: "Error saving evaluation",
        error: error?.message ?? String(error),
      },
      { status: 500 },
    );
  }
}