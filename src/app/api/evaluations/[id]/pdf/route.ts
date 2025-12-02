import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type {
  Evaluation,
  Application,
  Vacancy,
  EvaluationItem,
} from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

type EvaluationWithRelations = Evaluation & {
  application: (Application & { vacancy: Vacancy | null }) | null;
  items: EvaluationItem[];
};

type DetailedScores = {
  educational?: {
    highestDegreeKey?: string;
    highestDegreePoints?: number;
    additionalDegrees?: { 
      points?: number;
      masters?: number;
      bachelors?: number;
    };
    additionalCredits?: { 
      points?: number;
      units?: number;
    };
    subtotal?: number;
  };
  experience?: {
    academicService?: { 
      statePoints?: number;
      stateYears?: number;
      otherPoints?: number;
      otherYears?: number;
    };
    administrative?: { 
      points?: number;
      breakdown?: {
        president?: number;
        vicePresident?: number;
        dean?: number;
        departmentHead?: number;
      };
    };
    industry?: { 
      points?: number;
      breakdown?: {
        engineer?: number;
        technician?: number;
        skilledWorker?: number;
      };
    };
    otherTeaching?: { 
      points?: number;
      breakdown?: {
        cooperatingTeacher?: number;
        basicEducation?: number;
      };
    };
    subtotal?: number;
  };
  professionalDevelopment?: {
    details?: Record<string, number>;
    subtotal?: number;
  };
  technologicalSkills?: {
    basicMicrosoft?: { 
      subtotal?: number;
      word?: number;
      excel?: number;
      powerpoint?: number;
    };
    educationalApps?: { 
      subtotal?: number;
      rating?: number;
      count?: number;
    };
    longTraining?: { 
      subtotal?: number;
      breakdown?: {
        international?: number;
        national?: number;
        local?: number;
      };
    };
    creativeWork?: { 
      subtotal?: number;
      breakdown?: {
        originality?: number;
        acceptability?: number;
        relevance?: number;
        documentation?: number;
      };
    };
    subtotal?: number;
  };
};

/* ========= CAT 3 CREDIT TABLE FOR BREAKDOWN (3.1–3.6) ========= */

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
  book_ca_tertiary: 5,
  book_ca_hs: 3,
  book_ca_elem: 2,
  book_rev_tertiary: 4,
  book_rev_hs: 2,
  book_rev_elem: 1,
  book_trans_tertiary: 4,
  book_trans_hs: 2,
  book_trans_elem: 1,
  book_edit_tertiary: 3,
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

  // 3.2.2 Expert Services
  es_intl: 5,
  es_nat: 3,
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

const CAT3_KEYS_31: (keyof typeof CAT3_CREDITS)[] = [
  "inv_patent_intl",
  "inv_patent_nat",
  "inv_patent_inst",
  "inv_pending_intl",
  "inv_pending_nat",
  "inv_pending_inst",
  "disc_originality",
  "disc_dissemination",
  "cw_accept",
  "cw_recognition",
  "cw_relevance",
  "cw_documentation",
  "book_sa_tertiary",
  "book_sa_hs",
  "book_sa_elem",
  "book_ca_tertiary",
  "book_ca_hs",
  "book_ca_elem",
  "book_rev_tertiary",
  "book_rev_hs",
  "book_rev_elem",
  "book_trans_tertiary",
  "book_trans_hs",
  "book_trans_elem",
  "book_edit_tertiary",
  "book_edit_hs",
  "book_edit_elem",
  "book_comp_tertiary",
  "book_comp_hs",
  "book_comp_elem",
  "art_intl_sa",
  "art_intl_ca",
  "art_nat_sa",
  "art_nat_ca",
  "art_local_sa",
  "art_local_ca",
  "inst_single",
  "inst_co",
];

const CAT3_KEYS_32: (keyof typeof CAT3_CREDITS)[] = [
  "ts_intl",
  "ts_nat",
  "ts_local",
  "ts_industry",
  "ts_conf_intl",
  "ts_conf_nat",
  "ts_conf_local",
  "es_intl",
  "es_nat",
  "es_local",
  "coord_intl",
  "coord_nat",
  "coord_local",
  "adv_doc",
  "adv_master",
  "adv_undergrad",
  "es_reviewer",
  "es_accredit",
  "es_trade",
  "es_coach",
];

const CAT3_KEYS_33: (keyof typeof CAT3_CREDITS)[] = [
  "po_full",
  "po_assoc",
  "po_honor",
  "po_science",
  "po_officer",
  "po_member",
  "sf_intl_degree",
  "sf_intl_non",
  "sf_nat_degree",
  "sf_nat_non",
];

const CAT3_KEYS_34: (keyof typeof CAT3_CREDITS)[] = [
  "award_intl",
  "award_nat",
  "award_local",
];

const CAT3_KEYS_35: (keyof typeof CAT3_CREDITS)[] = ["co_service"];

const CAT3_KEYS_36: (keyof typeof CAT3_CREDITS)[] = [
  "pex_eng_law_teachers",
  "pex_marine_elec",
  "pex_trade_other",
];

function computeCat3Subtotals(units: Record<string, number>) {
  const sumKeys = (keys: (keyof typeof CAT3_CREDITS)[]) =>
    keys.reduce(
      (acc, key) => acc + (units[key] ?? 0) * CAT3_CREDITS[key],
      0,
    );

  const sub31 = sumKeys(CAT3_KEYS_31);
  const sub32 = sumKeys(CAT3_KEYS_32);
  const sub33 = sumKeys(CAT3_KEYS_33);
  const sub34 = sumKeys(CAT3_KEYS_34);
  const sub35 = sumKeys(CAT3_KEYS_35);
  const sub36 = sumKeys(CAT3_KEYS_36);

  return { sub31, sub32, sub33, sub34, sub35, sub36 };
}

function buildCat3UnitsFromItems(items: EvaluationItem[]): Record<string, number> {
  const result: Record<string, number> = {};

  for (const it of items) {
    // Only Category 3 + UNITS items are relevant for CAT3_CREDITS
    if (it.category !== 3) continue;
    if (it.fieldType !== "UNITS") continue;
    if (!it.itemKey) continue;

    // Only accept itemKeys that exist in CAT3_CREDITS
    if (!(it.itemKey in CAT3_CREDITS)) continue;

    const key = it.itemKey as keyof typeof CAT3_CREDITS;
    const unitsVal = typeof it.units === "number" && Number.isFinite(it.units) ? it.units : 0;
    if (!unitsVal) continue;

    result[key] = (result[key] ?? 0) + unitsVal;
  }

  return result;
}

/* ========= SMALL HELPERS ========= */

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

function safeNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
}

// pretty number for credits / units
function formatNum(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

// Ensure all text is compatible with pdf-lib's WinAnsi fonts
function sanitizePdfText(input: string): string {
  return String(input ?? "")
    .replace(/₱/g, "PHP ")
    .replace(/[–—]/g, "-") // en/em dash -> normal dash
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/•/g, "-")
    .replace(/\u00A0/g, " ");
}

/* ========= DRAWING HELPERS (pdf-lib) ========= */

function drawTableBorders(opts: {
  page: any;
  x: number;
  yTop: number;
  rowCount: number;
  colWidths: number[];
  rowHeight: number;
  borderColor?: any;
}) {
  const { page, x, yTop, rowCount, colWidths, rowHeight } = opts;
  const color = opts.borderColor ?? rgb(0, 0, 0);
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const yBottom = yTop - rowCount * rowHeight;

  // Outer rectangle
  page.drawRectangle({
    x,
    y: yBottom,
    width: totalWidth,
    height: rowCount * rowHeight,
    borderColor: color,
    borderWidth: 0.5,
  });

  // Horizontal lines
  for (let i = 1; i < rowCount; i++) {
    const y = yTop - i * rowHeight;
    page.drawLine({
      start: { x, y },
      end: { x: x + totalWidth, y },
      thickness: 0.5,
      color,
    });
  }

  // Vertical lines
  let curX = x;
  for (let i = 0; i < colWidths.length - 1; i++) {
    curX += colWidths[i];
    page.drawLine({
      start: { x: curX, y: yTop },
      end: { x: curX, y: yBottom },
      thickness: 0.5,
      color,
    });
  }
}

function drawCellText(opts: {
  page: any;
  font: any;
  text: string;
  x: number;
  y: number;
  size: number;
  align?: "left" | "center" | "right";
  width: number;
}) {
  const { page, font, x, y, size, width } = opts;
  const align = opts.align ?? "left";

  const safeText = sanitizePdfText(opts.text);
  const lines = safeText.split("\n");
  const lineHeight = size + 2;

  lines.forEach((line, idx) => {
    const textWidth = font.widthOfTextAtSize(line, size);
    let drawX = x + 2; // left padding

    if (align === "center") {
      drawX = x + (width - textWidth) / 2;
    } else if (align === "right") {
      drawX = x + width - textWidth - 2;
    }

    const drawY = y - idx * lineHeight;

    page.drawText(line, {
      x: drawX,
      y: drawY,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  });
}
function drawRightAlignedText(opts: {
  page: any;
  font: any;
  text: string;
  x: number; // left margin
  y: number;
  size: number;
  containerWidth: number;
}) {
  const safeText = sanitizePdfText(opts.text);
  const textWidth = opts.font.widthOfTextAtSize(safeText, opts.size);
  const drawX = opts.x + opts.containerWidth - textWidth;

  opts.page.drawText(safeText, {
    x: drawX,
    y: opts.y,
    size: opts.size,
    font: opts.font,
    color: rgb(0, 0, 0),
  });
}
/* ========= MAIN PDF GENERATOR ========= */

async function generatePdf(evaluation: EvaluationWithRelations) {
  const pdfDoc = await PDFDocument.create();
  const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const PASSING_SCORE = 175;

  /* ----- Common values ----- */
  const app = evaluation.application;
  const vacancy = app?.vacancy;

  const applicantName = app?.fullName || "N/A";
  const position = vacancy?.title || app?.desiredPosition || "N/A";
  const collegeDept = vacancy?.college || app?.department || "N/A";
  const email = app?.email || "N/A";
  const phone = app?.phone || "N/A";

  const evalDate = formatDate(evaluation.evaluatedAt);
  const today = formatDate(new Date());

  const rank = evaluation.rank || "N/A";
  const ratePerHourText =
    evaluation.ratePerHour != null
      ? `Php ${evaluation.ratePerHour.toFixed(2)}`
      : "N/A";

  const remarks = evaluation.remarks || "No remarks provided.";

  // IMPROVED DATA EXTRACTION
  const rawScores = evaluation.detailedScores;
  console.log("=== PDF GENERATION DEBUG ===");
  console.log("Raw detailedScores type:", typeof rawScores);
  console.log("Raw detailedScores:", JSON.stringify(rawScores, null, 2));
  console.log("Items count:", evaluation.items?.length ?? 0);

  // Start from JSON (if any) but ALWAYS overlay with items when available
  const baseDs = (rawScores || {}) as DetailedScores;

  const ds: DetailedScores = {
    educational: baseDs.educational ?? {},
    experience: baseDs.experience ?? {},
    professionalDevelopment: baseDs.professionalDevelopment ?? {},
    technologicalSkills: baseDs.technologicalSkills ?? {},
  };

  // Build Category 3 units (3.1–3.6) from EvaluationItem rows
  const unitsFromItems = buildCat3UnitsFromItems(evaluation.items || []);

  if (Object.keys(unitsFromItems).length > 0) {
    ds.professionalDevelopment = ds.professionalDevelopment ?? {};
    ds.professionalDevelopment.details = unitsFromItems;

    // Recompute CAT 3 subtotal from items
    const { sub31, sub32, sub33, sub34, sub35, sub36 } =
      computeCat3Subtotals(unitsFromItems);

    ds.professionalDevelopment.subtotal =
      sub31 + sub32 + sub33 + sub34 + sub35 + sub36;

    console.log("CAT3 from items – units:", JSON.stringify(unitsFromItems, null, 2));
    console.log(
      "CAT3 subtotals from items:",
      { sub31, sub32, sub33, sub34, sub35, sub36 }
    );
  }

  console.log("Parsed ds.educational:", JSON.stringify(ds.educational, null, 2));
  console.log("Parsed ds.experience:", JSON.stringify(ds.experience, null, 2));
  console.log(
    "Parsed ds.professionalDevelopment:",
    JSON.stringify(ds.professionalDevelopment, null, 2)
  );
  console.log(
    "Parsed ds.technologicalSkills:",
    JSON.stringify(ds.technologicalSkills, null, 2)
  );
  console.log("============================");


  const eduScore = safeNumber(evaluation.educationalScore);
  const expScore = safeNumber(evaluation.experienceScore);
  const profScore = safeNumber(evaluation.professionalDevScore);
  const techScore = safeNumber(evaluation.technologicalScore);
  const totalScore = safeNumber(evaluation.totalScore);

  const isQualified = totalScore >= PASSING_SCORE;

  /* ===== PAGE 1 – HEADER + APPLICANT INFO + SUMMARY ===== */

  const page1 = pdfDoc.addPage();
  const { width: w1, height: h1 } = page1.getSize();
  const marginLeft = 50;
  const marginRight = 50;
  const contentWidth = w1 - marginLeft - marginRight;

  let y = h1 - 60;

  // Header
  page1.drawText(sanitizePdfText("Universidad de Manila"), {
    x: marginLeft,
    y,
    size: 14,
    font: timesBold,
  });
  y -= 18;
  page1.drawText(
    sanitizePdfText("UDM TalentHub - Faculty Evaluation Report"),
    {
      x: marginLeft,
      y,
      size: 11,
      font: times,
    },
  );
  y -= 14;
  page1.drawText(
    sanitizePdfText(`Date Generated: ${today}`),
    {
      x: marginLeft,
      y,
      size: 10,
      font: times,
    },
  );

  // Right header area: total score + rank
  page1.drawText(
    sanitizePdfText(`Total Score: ${totalScore.toFixed(2)} / 250`),
    {
      x: marginLeft + contentWidth - 200,
      y,
      size: 10,
      font: timesBold,
    },
  );
  y -= 20;

  // Horizontal line
  page1.drawLine({
    start: { x: marginLeft, y },
    end: { x: marginLeft + contentWidth, y },
    thickness: 0.7,
    color: rgb(0, 0, 0),
  });
  y -= 20;

  // Applicant Info box
  page1.drawText(sanitizePdfText("Applicant Information"), {
    x: marginLeft,
    y,
    size: 11,
    font: timesBold,
  });
  y -= 16;

  const infoLines = [
    `Name: ${applicantName}`,
    `Position Applied For: ${position}`,
    `College / Department: ${collegeDept}`,
    `Email: ${email}`,
    `Contact Number: ${phone}`,
    `Date Evaluated: ${evalDate}`,
  ];
  infoLines.forEach((line) => {
    page1.drawText(sanitizePdfText(line), {
      x: marginLeft,
      y,
      size: 10,
      font: times,
    });
    y -= 14;
  });

  y -= 10;

  // Summary table heading
  page1.drawText(sanitizePdfText("Category Scores Summary"), {
    x: marginLeft,
    y,
    size: 11,
    font: timesBold,
  });
  y -= 18;

  // Summary table (Category, Score, Max)
  const rowHeight = 16;
  const summaryCols = [
    contentWidth * 0.6,
    contentWidth * 0.2,
    contentWidth * 0.2,
  ];

  const summaryRows = [
    ["1. Educational Qualifications", `${eduScore.toFixed(2)}`, "85"],
    ["2. Experience & Professional Services", `${expScore.toFixed(2)}`, "25"],
    [
      "3. Professional Development, Achievement & Honors",
      `${profScore.toFixed(2)}`,
      "90",
    ],
    ["4. Technological Knowledge", `${techScore.toFixed(2)}`, "50"],
    ["Total", `${totalScore.toFixed(2)}`, "250"],
  ];

  const summaryTopY = y;
  drawTableBorders({
    page: page1,
    x: marginLeft,
    yTop: summaryTopY,
    rowCount: summaryRows.length + 1, // header + rows
    colWidths: summaryCols,
    rowHeight,
  });

  // Header row
  let curX = marginLeft;
  drawCellText({
    page: page1,
    font: timesBold,
    text: "Category",
    x: curX,
    y: summaryTopY - 12,
    size: 9,
    width: summaryCols[0],
  });
  curX += summaryCols[0];
  drawCellText({
    page: page1,
    font: timesBold,
    text: "Score",
    x: curX,
    y: summaryTopY - 12,
    size: 9,
    width: summaryCols[1],
    align: "center",
  });
  curX += summaryCols[1];
  drawCellText({
    page: page1,
    font: timesBold,
    text: "Max Points",
    x: curX,
    y: summaryTopY - 12,
    size: 9,
    width: summaryCols[2],
    align: "center",
  });

  // Data rows
  let rowY = summaryTopY - rowHeight;
  summaryRows.forEach((row) => {
    let colX = marginLeft;
    drawCellText({
      page: page1,
      font: times,
      text: row[0],
      x: colX,
      y: rowY - 12,
      size: 9,
      width: summaryCols[0],
    });
    colX += summaryCols[0];
    drawCellText({
      page: page1,
      font: times,
      text: row[1],
      x: colX,
      y: rowY - 12,
      size: 9,
      width: summaryCols[1],
      align: "center",
    });
    colX += summaryCols[1];
    drawCellText({
      page: page1,
      font: times,
      text: row[2],
      x: colX,
      y: rowY - 12,
      size: 9,
      width: summaryCols[2],
      align: "center",
    });

    rowY -= rowHeight;
  });

  y = rowY - 20;

  // Rank / rate / qualified status
  page1.drawText(
    sanitizePdfText(`Accorded Rank: ${rank}`),
    {
      x: marginLeft,
      y,
      size: 10,
      font: times,
    },
  );
  y -= 14;
  page1.drawText(
    sanitizePdfText(`Proposed Rate per Hour: ${ratePerHourText}`),
    {
      x: marginLeft,
      y,
      size: 10,
      font: times,
    },
  );
  y -= 14;
  page1.drawText(
    sanitizePdfText(
      `Status: ${isQualified ? "QUALIFIED" : "NOT QUALIFIED"} (Passing: ${PASSING_SCORE})`,
    ),
    {
      x: marginLeft,
      y,
      size: 10,
      font: times,
      color: isQualified ? rgb(0, 0.4, 0) : rgb(0.7, 0, 0),
    },
  );

  /* ===== PAGE 2 – CATEGORY 1 + DETAIL TABLES ===== */
  const page2 = pdfDoc.addPage();
  const { width: w2, height: h2 } = page2.getSize();
  let y2 = h2 - 60;
  const c2Width = w2 - marginLeft - marginRight;

  page2.drawText(
    sanitizePdfText("CATEGORY 1 - Educational Qualifications"),
    {
      x: marginLeft,
      y: y2,
      size: 12,
      font: timesBold,
    },
  );
  y2 -= 22;

const edu = ds.educational || {};
const c1_1 = safeNumber(edu.highestDegreePoints);
const c1_2 = safeNumber(edu.additionalDegrees?.points);
const c1_3 = safeNumber(edu.additionalCredits?.points);
const c1_total = edu.subtotal ?? eduScore;

// ADD THIS helper for "c. Others please specify"
const othersRaw = edu.highestDegreePoints;
const othersPointsText =
  typeof othersRaw === "number" && Number.isFinite(othersRaw)
    ? othersRaw.toFixed(2) // e.g. 80.00
    : "-";

  // Use a slightly taller row height for Category 1 to avoid cramped text
  const rowHeightCat1 = 18;

  // ===== 1.0 Category 1 Overview Table =====
  const cat1Cols = [c2Width * 0.7, c2Width * 0.3];
  const cat1Rows: [string, number][] = [
    [
      "1.1 Highest relevant academic degree / attainment",
      c1_1,
    ],
    [
      "1.2 Additional equivalent & relevant degree earned",
      c1_2,
    ],
    [
      "1.3 Additional credits earned (units)",
      c1_3,
    ],
    ["Category 1 Total", c1_total],
  ];

  const cat1TopY = y2;
  drawTableBorders({
    page: page2,
    x: marginLeft,
    yTop: cat1TopY,
    rowCount: cat1Rows.length + 1,
    colWidths: cat1Cols,
    rowHeight: rowHeightCat1,
  });

  // Header
  let c1X = marginLeft;
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Item",
    x: c1X,
    y: cat1TopY - 12,
    size: 9,
    width: cat1Cols[0],
  });
  c1X += cat1Cols[0];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Score",
    x: c1X,
    y: cat1TopY - 12,
    size: 9,
    width: cat1Cols[1],
    align: "center",
  });

  // Rows
  let cat1RowY = cat1TopY - rowHeightCat1;
  cat1Rows.forEach(([label, val]) => {
    let colX = marginLeft;
    const isTotal = label === "Category 1 Total";
    drawCellText({
      page: page2,
      font: isTotal ? timesBold : times,
      text: label,
      x: colX,
      y: cat1RowY - 12,
      size: 9,
      width: cat1Cols[0],
    });
    colX += cat1Cols[0];
    drawCellText({
      page: page2,
      font: isTotal ? timesBold : times,
      text: safeNumber(val).toFixed(2),
      x: colX,
      y: cat1RowY - 12,
      size: 9,
      width: cat1Cols[1],
      align: "center",
    });

    cat1RowY -= rowHeightCat1;
  });

  // Add generous space before 1.1 details
  y2 = cat1RowY - 28;

  // ===== 1.1 Detailed Table =====
  page2.drawText(
    sanitizePdfText(
      "1.1 Highest relevant academic degree or educational attainment with the following maximum point credits",
    ),
    {
      x: marginLeft,
      y: y2,
      size: 9,
      font: timesBold,
    },
  );
  y2 -= 16;

  // Wider first column so long labels fit cleanly
const c11Cols = [c2Width * 0.6, c2Width * 0.15, c2Width * 0.25];
const c11TopY = y2;

// =====================================
// ADD THIS BLOCK (Category 1.1 mapping)
// =====================================

const highestKey = edu.highestDegreeKey || null;
const highestPts = safeNumber(edu.highestDegreePoints);

// Map row keys to DB values
const degreeMap: Record<string, string> = {
  "doctorate": "1.1_doctorate",
  "masters": "1.1_masters",
  "llb_md": "1.1_llb_md",
  "diploma": "1.1_diploma",
  "bachelor4": "1.1_bachelor4",
  "bachelor5": "1.1_bachelor5",
  "bachelor6": "1.1_bachelor6",
  "others": "1.1_others",
  "special3yr": "1.1_special3yr",
  "special2yr": "1.1_special2yr",
};

// Helper to check if a row is selected
function isChosen(rowKey: string) {
  return degreeMap[highestKey || ""] === rowKey ? "1" : "0";
}

// Helper for points per row
function rowPoints(rowKey: string, maxPoints: number) {
  return degreeMap[highestKey || ""] === rowKey
    ? highestPts.toFixed(2)
    : ""; // keep blank for unchosen rows
}

const c11Rows: [string, string, string][] = [
  ["1.1 Doctorate Degree", isChosen("1.1_doctorate"), rowPoints("1.1_doctorate", 85)],
  ["1.1.2 Master's Degree", isChosen("1.1_masters"), rowPoints("1.1_masters", 65)],
  ["1.1.3 LLB and MD", isChosen("1.1_llb_md"), rowPoints("1.1_llb_md", 65)],
  ["1.1.4 Diploma course (above bachelor's degree)", isChosen("1.1_diploma"), rowPoints("1.1_diploma", 55)],
  ["1.1.5 Bachelor's Degree (4 years)", isChosen("1.1_bachelor4"), rowPoints("1.1_bachelor4", 45)],
  ["a. 5 year course", isChosen("1.1_bachelor5"), rowPoints("1.1_bachelor5", 50)],
  ["b. 6 year course", isChosen("1.1_bachelor6"), rowPoints("1.1_bachelor6", 55)],
  ["c. Others please specify", isChosen("1.1_others"), othersPointsText],
  ["1.1.6 Special Courses – 3-year post secondary course", isChosen("1.1_special3yr"), rowPoints("1.1_special3yr", 30)],
  ["* 2-year post secondary course", isChosen("1.1_special2yr"), rowPoints("1.1_special2yr", 25)],
];

  drawTableBorders({
    page: page2,
    x: marginLeft,
    yTop: c11TopY,
    rowCount: c11Rows.length + 1,
    colWidths: c11Cols,
    rowHeight: rowHeightCat1,
  });

  // Header
  let c11X = marginLeft;
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Highest Degree",
    x: c11X,
    y: c11TopY - 12,
    size: 9,
    width: c11Cols[0],
  });
  c11X += c11Cols[0];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "1 = yes, 0 = no",
    x: c11X,
    y: c11TopY - 12,
    size: 9,
    width: c11Cols[1],
    align: "center",
  });
  c11X += c11Cols[1];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Points",
    x: c11X,
    y: c11TopY - 12,
    size: 9,
    width: c11Cols[2],
    align: "center",
  });

  let c11RowY = c11TopY - rowHeightCat1;
  c11Rows.forEach(([label, yn, pts]) => {
    let colX = marginLeft;
    drawCellText({
      page: page2,
      font: times,
      text: label,
      x: colX,
      y: c11RowY - 12,
      size: 9,
      width: c11Cols[0],
    });
    colX += c11Cols[0];
    drawCellText({
      page: page2,
      font: times,
      text: yn,
      x: colX,
      y: c11RowY - 12,
      size: 9,
      width: c11Cols[1],
      align: "center",
    });
    colX += c11Cols[1];
    drawCellText({
      page: page2,
      font: times,
      text: pts,
      x: colX,
      y: c11RowY - 12,
      size: 9,
      width: c11Cols[2],
      align: "center",
    });

    c11RowY -= rowHeightCat1;
  });

  // Sub-Category 1.1 total aligned to the right with breathing room
  y2 = c11RowY - 18;
  drawRightAlignedText({
    page: page2,
    font: times,
    text: `Sub-Category 1.1 Total: ${c1_1.toFixed(2)}`,
    x: marginLeft,
    y: y2,
    size: 9,
    containerWidth: c2Width,
  });

  // Extra space before 1.2 table
  y2 -= 26;

  // ===== 1.2 Detailed Table =====
  page2.drawText(
    sanitizePdfText("1.2 Additional equivalent and relevant degree earned"),
    {
      x: marginLeft,
      y: y2,
      size: 9,
      font: timesBold,
    },
  );
  y2 -= 16;

  const c12Cols = [
    c2Width * 0.5,  // description
    c2Width * 0.16, // # of degree
    c2Width * 0.17, // credit points
    c2Width * 0.17, // # × credit
  ];
  const c12TopY = y2;

const c12Rows: [string, string, string, string][] = [
  [
    "1.2.1 Additional Master's degree",
    String(edu.additionalDegrees?.masters || 0),
    "4",
    String((edu.additionalDegrees?.masters || 0) * 4)
  ],
  [
    "1.2.2 Additional Bachelor's degree",
    String(edu.additionalDegrees?.bachelors || 0),
    "3",
    String((edu.additionalDegrees?.bachelors || 0) * 3)
  ],
];

  drawTableBorders({
    page: page2,
    x: marginLeft,
    yTop: c12TopY,
    rowCount: c12Rows.length + 1,
    colWidths: c12Cols,
    rowHeight: rowHeightCat1,
  });

  let c12X = marginLeft;
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Additional Degree",
    x: c12X,
    y: c12TopY - 12,
    size: 9,
    width: c12Cols[0],
  });
  c12X += c12Cols[0];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "# of Degree",
    x: c12X,
    y: c12TopY - 12,
    size: 9,
    width: c12Cols[1],
    align: "center",
  });
  c12X += c12Cols[1];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Credit Points",
    x: c12X,
    y: c12TopY - 12,
    size: 9,
    width: c12Cols[2],
    align: "center",
  });
  c12X += c12Cols[2];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "# × Credit",
    x: c12X,
    y: c12TopY - 12,
    size: 9,
    width: c12Cols[3],
    align: "center",
  });

  let c12RowY = c12TopY - rowHeightCat1;
  c12Rows.forEach(([label, num, credit, total]) => {
    let colX = marginLeft;
    drawCellText({
      page: page2,
      font: times,
      text: label,
      x: colX,
      y: c12RowY - 12,
      size: 9,
      width: c12Cols[0],
    });
    colX += c12Cols[0];
    drawCellText({
      page: page2,
      font: times,
      text: num,
      x: colX,
      y: c12RowY - 12,
      size: 9,
      width: c12Cols[1],
      align: "center",
    });
    colX += c12Cols[1];
    drawCellText({
      page: page2,
      font: times,
      text: credit,
      x: colX,
      y: c12RowY - 12,
      size: 9,
      width: c12Cols[2],
      align: "center",
    });
    colX += c12Cols[2];
    drawCellText({
      page: page2,
      font: times,
      text: total,
      x: colX,
      y: c12RowY - 12,
      size: 9,
      width: c12Cols[3],
      align: "center",
    });

    c12RowY -= rowHeightCat1;
  });

  y2 = c12RowY - 18;
  drawRightAlignedText({
    page: page2,
    font: times,
    text: `Sub-Category 1.2 Total: ${c1_2.toFixed(2)}`,
    x: marginLeft,
    y: y2,
    size: 9,
    containerWidth: c2Width,
  });

  // Extra space before 1.3 table
  y2 -= 26;

  // ===== 1.3 Detailed Table =====
  page2.drawText(
    sanitizePdfText("1.3 Additional credits earned (maximum of 10 pts.)"),
    {
      x: marginLeft,
      y: y2,
      size: 9,
      font: timesBold,
    },
  );
  y2 -= 16;

  // Wider first column; taller row for wrapped text
  const rowHeight13 = 26; // was 20 → gives more room for 2 lines
  const c13Cols = [
    c2Width * 0.55, // description (a bit wider)
    c2Width * 0.17, // # of 3 units
    c2Width * 0.17, // credited points
    c2Width * 0.11, // # × credit
  ];
  const c13TopY = y2;

const c13Rows: [string, string, string, string][] = [
  [
    "1.3.1 For every 3 units earned toward a higher approved degree /\ncourse",
    String(edu.additionalCredits?.units || 0),
    "1",
    String((edu.additionalCredits?.units || 0) * 1)
  ],
];

  drawTableBorders({
    page: page2,
    x: marginLeft,
    yTop: c13TopY,
    rowCount: c13Rows.length + 1,
    colWidths: c13Cols,
    rowHeight: rowHeight13,
  });

  let c13X = marginLeft;
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Additional Degree",
    x: c13X,
    y: c13TopY - 12,
    size: 9,
    width: c13Cols[0],
  });
  c13X += c13Cols[0];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "# of 3 Units Earned",
    x: c13X,
    y: c13TopY - 12,
    size: 9,
    width: c13Cols[1],
    align: "center",
  });
  c13X += c13Cols[1];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "Credited Points",
    x: c13X,
    y: c13TopY - 12,
    size: 9,
    width: c13Cols[2],
    align: "center",
  });
  c13X += c13Cols[2];
  drawCellText({
    page: page2,
    font: timesBold,
    text: "# × Credit",
    x: c13X,
    y: c13TopY - 12,
    size: 9,
    width: c13Cols[3],
    align: "center",
  });

  let c13RowY = c13TopY - rowHeight13;
  c13Rows.forEach(([label, units, credit, total]) => {
    let colX = marginLeft;
    drawCellText({
      page: page2,
      font: times,
      text: label,
      x: colX,
      y: c13RowY - 12,
      size: 9,
      width: c13Cols[0],
    });
    colX += c13Cols[0];
    drawCellText({
      page: page2,
      font: times,
      text: units,
      x: colX,
      y: c13RowY - 12,
      size: 9,
      width: c13Cols[1],
      align: "center",
    });
    colX += c13Cols[1];
    drawCellText({
      page: page2,
      font: times,
      text: credit,
      x: colX,
      y: c13RowY - 12,
      size: 9,
      width: c13Cols[2],
      align: "center",
    });
    colX += c13Cols[2];
    drawCellText({
      page: page2,
      font: times,
      text: total,
      x: colX,
      y: c13RowY - 12,
      size: 9,
      width: c13Cols[3],
      align: "center",
    });

    c13RowY -= rowHeight13;
  });

  // Place Sub-Category 1.3 total clearly below the table
  y2 = c13RowY - 20;
  drawRightAlignedText({
    page: page2,
    font: times,
    text: `Sub-Category 1.3 Total: ${c1_3.toFixed(2)}`,
    x: marginLeft,
    y: y2,
    size: 9,
    containerWidth: c2Width,
  });

  /* ===== PAGE 3 – CATEGORY 2 + DETAIL TABLES ===== */

  const page3 = pdfDoc.addPage();
  const { width: w3, height: h3 } = page3.getSize();
  let y3 = h3 - 60;
  const c3Width = w3 - marginLeft - marginRight;

  page3.drawText(
    sanitizePdfText("CATEGORY 2 - Experience & Professional Services"),
    {
      x: marginLeft,
      y: y3,
      size: 12,
      font: timesBold,
    },
  );
  y3 -= 22;

  const exp = ds.experience || {};
  const c2_1 = safeNumber(exp.academicService?.statePoints);
  const c2_2 = safeNumber(exp.academicService?.otherPoints);
  const c2_3 = safeNumber(exp.administrative?.points);
  const c2_4 = safeNumber(exp.industry?.points);
  const c2_5 = safeNumber(exp.otherTeaching?.points);
  const c2_total = exp.subtotal ?? expScore;

  const cat2Cols = [c3Width * 0.75, c3Width * 0.25];
  const cat2Rows: [string, number][] = [
    [
      "2.1 Academic service in SUCs / CHED / TESDA-supervised",
      c2_1,
    ],
    [
      "2.2 Academic service in other HEIs / private institutions",
      c2_2,
    ],
    [
      "2.3 Administrative designation (President / VP / Dean / etc.)",
      c2_3,
    ],
    [
      "2.4 Industrial / agricultural / technical experience",
      c2_4,
    ],
    [
      "2.5 Other experience (cooperating / basic education teacher)",
      c2_5,
    ],
    ["Category 2 Total", c2_total],
  ];

  const cat2TopY = y3;
  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: cat2TopY,
    rowCount: cat2Rows.length + 1,
    colWidths: cat2Cols,
    rowHeight,
  });

  // Header
  let c2X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Item",
    x: c2X,
    y: cat2TopY - 12,
    size: 9,
    width: cat2Cols[0],
  });
  c2X += cat2Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Score",
    x: c2X,
    y: cat2TopY - 12,
    size: 9,
    width: cat2Cols[1],
    align: "center",
  });

  // Rows
  let cat2RowY = cat2TopY - rowHeight;
  cat2Rows.forEach(([label, val]) => {
    let colX = marginLeft;
    const isTotal = label === "Category 2 Total";
    drawCellText({
      page: page3,
      font: isTotal ? timesBold : times,
      text: label,
      x: colX,
      y: cat2RowY - 12,
      size: 9,
      width: cat2Cols[0],
    });
    colX += cat2Cols[0];
    drawCellText({
      page: page3,
      font: isTotal ? timesBold : times,
      text: safeNumber(val).toFixed(2),
      x: colX,
      y: cat2RowY - 12,
      size: 9,
      width: cat2Cols[1],
      align: "center",
    });

    cat2RowY -= rowHeight;
  });

  // ----- Detailed 2.1 -----
  y3 = cat2RowY - 24;
  page3.drawText(
    sanitizePdfText(
      "2.1 For every year of full-time academic service in a state institution of higher learning",
    ),
    {
      x: marginLeft,
      y: y3,
      size: 9,
      font: timesBold,
    },
  );
  y3 -= 14;

  const c21Cols = [
    c3Width * 0.5,
    c3Width * 0.15,
    c3Width * 0.15,
    c3Width * 0.2,
  ];
  const c21TopY = y3;

  const stateYears = exp.academicService?.stateYears || 0;
  
  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: c21TopY,
    rowCount: 1 + 1,
    colWidths: c21Cols,
    rowHeight,
  });

  let c21X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Description",
    x: c21X,
    y: c21TopY - 12,
    size: 9,
    width: c21Cols[0],
  });
  c21X += c21Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credit Score",
    x: c21X,
    y: c21TopY - 12,
    size: 9,
    width: c21Cols[1],
    align: "center",
  });
  c21X += c21Cols[1];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "# of Years / Units",
    x: c21X,
    y: c21TopY - 12,
    size: 9,
    width: c21Cols[2],
    align: "center",
  });
  c21X += c21Cols[2];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credited Points",
    x: c21X,
    y: c21TopY - 12,
    size: 9,
    width: c21Cols[3],
    align: "center",
  });

let c21RowY = c21TopY - rowHeight;
let colX21 = marginLeft;
drawCellText({
  page: page3,
  font: times,
  text: "State SUC/CHED-supervised HEI / TESDA-supervised TEI",
  x: colX21,
  y: c21RowY - 12,
  size: 9,
  width: c21Cols[0],
});
colX21 += c21Cols[0];
drawCellText({
  page: page3,
  font: times,
  text: "1",
  x: colX21,
  y: c21RowY - 12,
  size: 9,
  width: c21Cols[1],
  align: "center",
});
colX21 += c21Cols[1];
drawCellText({
  page: page3,
  font: times,
  text: stateYears ? formatNum(stateYears) : "",
  x: colX21,
  y: c21RowY - 12,
  size: 9,
  width: c21Cols[2],
  align: "center",
});
colX21 += c21Cols[2];
drawCellText({
  page: page3,
  font: times,
  text: c2_1 ? c2_1.toFixed(2) : "",
  x: colX21,
  y: c21RowY - 12,
  size: 9,
  width: c21Cols[3],
  align: "center",
});

  // ----- Detailed 2.2 -----
  y3 = c21RowY - 32;
  page3.drawText(
    sanitizePdfText(
      "2.2 For every year of full-time academic service in other HEIs / private / public research institutions",
    ),
    {
      x: marginLeft,
      y: y3,
      size: 9,
      font: timesBold,
    },
  );
  y3 -= 14;

  const c22Cols = [
    c3Width * 0.5,
    c3Width * 0.15,
    c3Width * 0.15,
    c3Width * 0.2,
  ];
  const c22TopY = y3;

  const credit22 = 0.75;
  const otherYears = exp.academicService?.otherYears || 0;

  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: c22TopY,
    rowCount: 1 + 1,
    colWidths: c22Cols,
    rowHeight,
  });

  let c22X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Description",
    x: c22X,
    y: c22TopY - 12,
    size: 9,
    width: c22Cols[0],
  });
  c22X += c22Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credit Score",
    x: c22X,
    y: c22TopY - 12,
    size: 9,
    width: c22Cols[1],
    align: "center",
  });
  c22X += c22Cols[1];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "# of Years / Units",
    x: c22X,
    y: c22TopY - 12,
    size: 9,
    width: c22Cols[2],
    align: "center",
  });
  c22X += c22Cols[2];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credited Points",
    x: c22X,
    y: c22TopY - 12,
    size: 9,
    width: c22Cols[3],
    align: "center",
  });

let c22RowY = c22TopY - rowHeight;
let colX22 = marginLeft;
drawCellText({
  page: page3,
  font: times,
  text: "Other HEIs / private / research institutions",
  x: colX22,
  y: c22RowY - 12,
  size: 9,
  width: c22Cols[0],
});
colX22 += c22Cols[0];
drawCellText({
  page: page3,
  font: times,
  text: credit22.toString(),
  x: colX22,
  y: c22RowY - 12,
  size: 9,
  width: c22Cols[1],
  align: "center",
});
colX22 += c22Cols[1];
drawCellText({
  page: page3,
  font: times,
  text: otherYears ? formatNum(otherYears) : "",
  x: colX22,
  y: c22RowY - 12,
  size: 9,
  width: c22Cols[2],
  align: "center",
});
colX22 += c22Cols[2];
drawCellText({
  page: page3,
  font: times,
  text: c2_2 ? c2_2.toFixed(2) : "",
  x: colX22,
  y: c22RowY - 12,
  size: 9,
  width: c22Cols[3],
  align: "center",
});

  // ----- 2.3 Administrative designation (label-only breakdown) -----
  y3 = c22RowY - 32;
  page3.drawText(
    sanitizePdfText("2.3 For every year of administrative designation as"),
    {
      x: marginLeft,
      y: y3,
      size: 9,
      font: timesBold,
    },
  );
  y3 -= 14;

  const c23Cols = [c3Width * 0.55, c3Width * 0.15, c3Width * 0.15, c3Width * 0.15];
  const c23TopY = y3;

const adminBd = exp.administrative?.breakdown || {};
const c23Rows: [string, string, string, string][] = [
  [
    "a. President",
    "3",
    String(adminBd.president || 0),
    String((adminBd.president || 0) * 3)
  ],
  [
    "b. Vice-President (incl. Board Secretary)",
    "2.5",
    String(adminBd.vicePresident || 0),
    String((adminBd.vicePresident || 0) * 2.5)
  ],
  [
    "c. Dean / Director / School Superintendent",
    "2",
    String(adminBd.dean || 0),
    String((adminBd.dean || 0) * 2)
  ],
  [
    "d. Principal / Supervisor / Department Chair / Head of Unit",
    "1",
    String(adminBd.departmentHead || 0),
    String((adminBd.departmentHead || 0) * 1)
  ],
];

  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: c23TopY,
    rowCount: c23Rows.length + 1,
    colWidths: c23Cols,
    rowHeight,
  });

  let c23X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Description",
    x: c23X,
    y: c23TopY - 12,
    size: 9,
    width: c23Cols[0],
  });
  c23X += c23Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credit Score",
    x: c23X,
    y: c23TopY - 12,
    size: 9,
    width: c23Cols[1],
    align: "center",
  });
  c23X += c23Cols[1];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "# of Years / Units",
    x: c23X,
    y: c23TopY - 12,
    size: 9,
    width: c23Cols[2],
    align: "center",
  });
  c23X += c23Cols[2];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credited Points",
    x: c23X,
    y: c23TopY - 12,
    size: 9,
    width: c23Cols[3],
    align: "center",
  });

  let c23RowY = c23TopY - rowHeight;
  c23Rows.forEach(([label, credit, yrs, total]) => {
    let colX = marginLeft;
    drawCellText({
      page: page3,
      font: times,
      text: label,
      x: colX,
      y: c23RowY - 12,
      size: 9,
      width: c23Cols[0],
    });
    colX += c23Cols[0];
    drawCellText({
      page: page3,
      font: times,
      text: credit,
      x: colX,
      y: c23RowY - 12,
      size: 9,
      width: c23Cols[1],
      align: "center",
    });
    colX += c23Cols[1];
    drawCellText({
      page: page3,
      font: times,
      text: yrs,
      x: colX,
      y: c23RowY - 12,
      size: 9,
      width: c23Cols[2],
      align: "center",
    });
    colX += c23Cols[2];
    drawCellText({
      page: page3,
      font: times,
      text: total,
      x: colX,
      y: c23RowY - 12,
      size: 9,
      width: c23Cols[3],
      align: "center",
    });

    c23RowY -= rowHeight;
  });

  y3 = c23RowY - 14;
  drawRightAlignedText({
    page: page3,
    font: times,
    text: `Sub-Category 2.3 Total: ${c2_3.toFixed(2)}`,
    x: marginLeft,
    y: y3,
    size: 9,
    containerWidth: c3Width,
  });

  // ----- 2.4 Industrial / technical experience -----
  y3 -= 22;
  page3.drawText(
    sanitizePdfText(
      "2.4 For every year of full-time industrial / agricultural / technical experience as",
    ),
    {
      x: marginLeft,
      y: y3,
      size: 9,
      font: timesBold,
    },
  );
  y3 -= 14;

  const c24Cols = [c3Width * 0.55, c3Width * 0.15, c3Width * 0.15, c3Width * 0.15];
  const c24TopY = y3;

const industryBd = exp.industry?.breakdown || {};
const c24Rows: [string, string, string, string][] = [
  [
    "a. Engineer / Plant / Farm Manager",
    "1.5",
    String(industryBd.engineer || 0),
    String((industryBd.engineer || 0) * 1.5)
  ],
  [
    "b. Technician",
    "1",
    String(industryBd.technician || 0),
    String((industryBd.technician || 0) * 1)
  ],
  [
    "c. Skilled Worker",
    "0.5",
    String(industryBd.skilledWorker || 0),
    String((industryBd.skilledWorker || 0) * 0.5)
  ],
];

  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: c24TopY,
    rowCount: c24Rows.length + 1,
    colWidths: c24Cols,
    rowHeight,
  });

  let c24X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Description",
    x: c24X,
    y: c24TopY - 12,
    size: 9,
    width: c24Cols[0],
  });
  c24X += c24Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credit Score",
    x: c24X,
    y: c24TopY - 12,
    size: 9,
    width: c24Cols[1],
    align: "center",
  });
  c24X += c24Cols[1];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "# of Years / Units",
    x: c24X,
    y: c24TopY - 12,
    size: 9,
    width: c24Cols[2],
    align: "center",
  });
  c24X += c24Cols[2];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credited Points",
    x: c24X,
    y: c24TopY - 12,
    size: 9,
    width: c24Cols[3],
    align: "center",
  });

  let c24RowY = c24TopY - rowHeight;
  c24Rows.forEach(([label, credit, yrs, total]) => {
    let colX = marginLeft;
    drawCellText({
      page: page3,
      font: times,
      text: label,
      x: colX,
      y: c24RowY - 12,
      size: 9,
      width: c24Cols[0],
    });
    colX += c24Cols[0];
    drawCellText({
      page: page3,
      font: times,
      text: credit,
      x: colX,
      y: c24RowY - 12,
      size: 9,
      width: c24Cols[1],
      align: "center",
    });
    colX += c24Cols[1];
    drawCellText({
      page: page3,
      font: times,
      text: yrs,
      x: colX,
      y: c24RowY - 12,
      size: 9,
      width: c24Cols[2],
      align: "center",
    });
    colX += c24Cols[2];
    drawCellText({
      page: page3,
      font: times,
      text: total,
      x: colX,
      y: c24RowY - 12,
      size: 9,
      width: c24Cols[3],
      align: "center",
    });

    c24RowY -= rowHeight;
  });

  y3 = c24RowY - 14;
  drawRightAlignedText({
    page: page3,
    font: times,
    text: `Sub-Category 2.4 Total: ${c2_4.toFixed(2)}`,
    x: marginLeft,
    y: y3,
    size: 9,
    containerWidth: c3Width,
  });

  // ----- 2.5 Other experience -----
  y3 -= 22;
  page3.drawText(
    sanitizePdfText("2.5 For every year of experience as"),
    {
      x: marginLeft,
      y: y3,
      size: 9,
      font: timesBold,
    },
  );
  y3 -= 14;

  const c25Cols = [c3Width * 0.55, c3Width * 0.15, c3Width * 0.15, c3Width * 0.15];
  const c25TopY = y3;

const teachingBd = exp.otherTeaching?.breakdown || {};
const c25Rows: [string, string, string, string][] = [
  [
    "a. Cooperating Teacher",
    "1.5",
    String(teachingBd.cooperatingTeacher || 0),
    String((teachingBd.cooperatingTeacher || 0) * 1.5)
  ],
  [
    "b. Basic Education Teacher",
    "1",
    String(teachingBd.basicEducation || 0),
    String((teachingBd.basicEducation || 0) * 1)
  ],
];

  drawTableBorders({
    page: page3,
    x: marginLeft,
    yTop: c25TopY,
    rowCount: c25Rows.length + 1,
    colWidths: c25Cols,
    rowHeight,
  });

  let c25X = marginLeft;
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Description",
    x: c25X,
    y: c25TopY - 12,
    size: 9,
    width: c25Cols[0],
  });
  c25X += c25Cols[0];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credit Score",
    x: c25X,
    y: c25TopY - 12,
    size: 9,
    width: c25Cols[1],
    align: "center",
  });
  c25X += c25Cols[1];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "# of Years / Units",
    x: c25X,
    y: c25TopY - 12,
    size: 9,
    width: c25Cols[2],
    align: "center",
  });
  c25X += c25Cols[2];
  drawCellText({
    page: page3,
    font: timesBold,
    text: "Credited Points",
    x: c25X,
    y: c25TopY - 12,
    size: 9,
    width: c25Cols[3],
    align: "center",
  });

  let c25RowY = c25TopY - rowHeight;
  c25Rows.forEach(([label, credit, yrs, total]) => {
    let colX = marginLeft;
    drawCellText({
      page: page3,
      font: times,
      text: label,
      x: colX,
      y: c25RowY - 12,
      size: 9,
      width: c25Cols[0],
    });
    colX += c25Cols[0];
    drawCellText({
      page: page3,
      font: times,
      text: credit,
      x: colX,
      y: c25RowY - 12,
      size: 9,
      width: c25Cols[1],
      align: "center",
    });
    colX += c25Cols[1];
    drawCellText({
      page: page3,
      font: times,
      text: yrs,
      x: colX,
      y: c25RowY - 12,
      size: 9,
      width: c25Cols[2],
      align: "center",
    });
    colX += c25Cols[2];
    drawCellText({
      page: page3,
      font: times,
      text: total,
      x: colX,
      y: c25RowY - 12,
      size: 9,
      width: c25Cols[3],
      align: "center",
    });

    c25RowY -= rowHeight;
  });

  y3 = c25RowY - 14;
  drawRightAlignedText({
    page: page3,
    font: times,
    text: `Sub-Category 2.5 Total: ${c2_5.toFixed(2)}`,
    x: marginLeft,
    y: y3,
    size: 9,
    containerWidth: c3Width,
  });

  /* ===== PAGE 4 – CATEGORY 3 SUMMARY ===== */

  const page4 = pdfDoc.addPage();
  const { width: w4, height: h4 } = page4.getSize();
  let y4 = h4 - 60;
  const c4Width = w4 - marginLeft - marginRight;

  page4.drawText(
    sanitizePdfText("CATEGORY 3 - Professional Development, Achievement & Honors"),
    {
      x: marginLeft,
      y: y4,
      size: 12,
      font: timesBold,
    },
  );
  y4 -= 22;

  const units = (ds.professionalDevelopment?.details ||
    {}) as Record<string, number>;

  const { sub31, sub32, sub33, sub34, sub35, sub36 } =
    computeCat3Subtotals(units);

  const c3_total = ds.professionalDevelopment?.subtotal ?? profScore;

  const cat3Cols = [c4Width * 0.75, c4Width * 0.25];
  const cat3Rows: [string, number][] = [
    [
      "3.1 Innovations, patented inventions, publications & creative works",
      sub31,
    ],
    [
      "3.2 Expert services, training & professional activities",
      sub32,
    ],
    [
      "3.3 Membership in professional organizations / honor societies",
      sub33,
    ],
    ["3.4 Awards of distinction", sub34],
    ["3.5 Community outreach", sub35],
    ["3.6 Professional examinations", sub36],
    ["Category 3 Total", c3_total],
  ];

  const cat3TopY = y4;
  drawTableBorders({
    page: page4,
    x: marginLeft,
    yTop: cat3TopY,
    rowCount: cat3Rows.length + 1,
    colWidths: cat3Cols,
    rowHeight,
  });

  // Header
  let c3X = marginLeft;
  drawCellText({
    page: page4,
    font: timesBold,
    text: "Item",
    x: c3X,
    y: cat3TopY - 12,
    size: 9,
    width: cat3Cols[0],
  });
  c3X += cat3Cols[0];
  drawCellText({
    page: page4,
    font: timesBold,
    text: "Score",
    x: c3X,
    y: cat3TopY - 12,
    size: 9,
    width: cat3Cols[1],
    align: "center",
  });

  // Rows
  let cat3RowY = cat3TopY - rowHeight;
  cat3Rows.forEach(([label, val]) => {
    let colX = marginLeft;
    const isTotal = label === "Category 3 Total";
    drawCellText({
      page: page4,
      font: isTotal ? timesBold : times,
      text: label,
      x: colX,
      y: cat3RowY - 12,
      size: 9,
      width: cat3Cols[0],
    });
    colX += cat3Cols[0];
    drawCellText({
      page: page4,
      font: isTotal ? timesBold : times,
      text: safeNumber(val).toFixed(2),
      x: colX,
      y: cat3RowY - 12,
      size: 9,
      width: cat3Cols[1],
      align: "center",
    });

    cat3RowY -= rowHeight;
  });

  page4.drawText(
    sanitizePdfText("See next page for detailed breakdown of Sub-Category 3.1."),
    {
      x: marginLeft,
      y: cat3RowY - 20,
      size: 9,
      font: times,
    },
  );

  /* ===== PAGE 5 – DETAILED 3.1 TABLES (3.1.1–3.1.4) ===== */

  const page5 = pdfDoc.addPage();
  const { width: w5, height: h5 } = page5.getSize();
  let y5 = h5 - 60;
  const c5Width = w5 - marginLeft - marginRight;

  page5.drawText(
    sanitizePdfText(
      "3.1 Innovations, patented inventions, publications and other creative works",
    ),
    {
      x: marginLeft,
      y: y5,
      size: 11,
      font: timesBold,
    },
  );
  y5 -= 22;

  const rowHeight31 = 12;
  const c31Cols = [c5Width * 0.6, c5Width * 0.15, c5Width * 0.25];

  type Cat31Row = {
    label: string;
    key?: keyof typeof CAT3_CREDITS;
  };

  const rows31: Cat31Row[] = [
    { label: "3.1.1 Inventions, discoveries and creative works" },
    { label: "If patented – an international scale", key: "inv_patent_intl" },
    { label: "If patented – a national scale", key: "inv_patent_nat" },
    { label: "If patented – institutional level", key: "inv_patent_inst" },
    { label: "If patent pending – an international scale", key: "inv_pending_intl" },
    { label: "If patent pending – a national scale", key: "inv_pending_nat" },
    { label: "If patent pending – institutional level", key: "inv_pending_inst" },

    { label: "Discoveries" },
    {
      label: "Originality, Educational impact (60% of 7 = 4.2)",
      key: "disc_originality",
    },
    {
      label: "Evidence of dissemination (40% of 7 = 2.8)",
      key: "disc_dissemination",
    },

    {
      label: "Creative work has to satisfy one or more of the following criteria",
    },
    { label: "Acceptability (25% of 7 = 1.75)", key: "cw_accept" },
    { label: "Recognition (25% of 7 = 1.75)", key: "cw_recognition" },
    { label: "Relevance & value (25% of 7 = 1.75)", key: "cw_relevance" },
    { label: "Documentation & evidence (25% of 7 = 1.75)", key: "cw_documentation" },

    { label: "3.1.2 Published book (last 10 yrs)" },
    { label: "Single Author – Tertiary", key: "book_sa_tertiary" },
    { label: "Single Author – High School", key: "book_sa_hs" },
    { label: "Single Author – Elementary", key: "book_sa_elem" },
    { label: "Co-author – Tertiary", key: "book_ca_tertiary" },
    { label: "Co-author – High School", key: "book_ca_hs" },
    { label: "Co-author – Elementary", key: "book_ca_elem" },
    { label: "Reviewer – Tertiary", key: "book_rev_tertiary" },
    { label: "Reviewer – High School", key: "book_rev_hs" },
    { label: "Reviewer – Elementary", key: "book_rev_elem" },
    { label: "Translator – Tertiary", key: "book_trans_tertiary" },
    { label: "Translator – High School", key: "book_trans_hs" },
    { label: "Translator – Elementary", key: "book_trans_elem" },
    { label: "Editor – Tertiary", key: "book_edit_tertiary" },
    { label: "Editor – High School", key: "book_edit_hs" },
    { label: "Editor – Elementary", key: "book_edit_elem" },
    { label: "Compiler – Tertiary", key: "book_comp_tertiary" },
    { label: "Compiler – High School", key: "book_comp_hs" },
    { label: "Compiler – Elementary", key: "book_comp_elem" },

    {
      label: "3.1.3 Scholarly/technical/educational articles – Coverage and Role",
    },
    { label: "International – Single author", key: "art_intl_sa" },
    { label: "International – Co-author", key: "art_intl_ca" },
    { label: "National – Single author", key: "art_nat_sa" },
    { label: "National – Co-author", key: "art_nat_ca" },
    { label: "Local – Single author", key: "art_local_sa" },
    { label: "Local – Co-author", key: "art_local_ca" },

    {
      label:
        "3.1.4 Instructional manual / audio-visual material developed & approved",
    },
    { label: "Single author or maker", key: "inst_single" },
    { label: "Co-author / co-maker", key: "inst_co" },
  ];

  const c31TopY = y5;
  drawTableBorders({
    page: page5,
    x: marginLeft,
    yTop: c31TopY,
    rowCount: rows31.length + 1,
    colWidths: c31Cols,
    rowHeight: rowHeight31,
  });

  // Header row
  let c31X = marginLeft;
  drawCellText({
    page: page5,
    font: timesBold,
    text: "Item / Description",
    x: c31X,
    y: c31TopY - 9,
    size: 8,
    width: c31Cols[0],
  });
  c31X += c31Cols[0];
  drawCellText({
    page: page5,
    font: timesBold,
    text: "Credit / Unit",
    x: c31X,
    y: c31TopY - 9,
    size: 8,
    width: c31Cols[1],
    align: "center",
  });
  c31X += c31Cols[1];
  drawCellText({
    page: page5,
    font: timesBold,
    text: "Units × Credit",
    x: c31X,
    y: c31TopY - 9,
    size: 8,
    width: c31Cols[2],
    align: "center",
  });

  let c31RowY = c31TopY - rowHeight31;

  rows31.forEach((row) => {
    const isHeader = !row.key;
    const key = row.key;
    const credit = key ? CAT3_CREDITS[key] : 0;
    const unitsForKey = key ? safeNumber(units[key]) : 0;
    const credited = key ? unitsForKey * credit : 0;

    let colX = marginLeft;

    drawCellText({
      page: page5,
      font: isHeader ? timesBold : times,
      text: row.label,
      x: colX,
      y: c31RowY - 9,
      size: 8,
      width: c31Cols[0],
    });
    colX += c31Cols[0];

    drawCellText({
      page: page5,
      font: isHeader ? timesBold : times,
      text: key ? formatNum(credit) : "",
      x: colX,
      y: c31RowY - 9,
      size: 8,
      width: c31Cols[1],
      align: "center",
    });
    colX += c31Cols[1];

    drawCellText({
      page: page5,
      font: isHeader ? timesBold : times,
      text: key && credited ? formatNum(credited) : "",
      x: colX,
      y: c31RowY - 9,
      size: 8,
      width: c31Cols[2],
      align: "center",
    });

    c31RowY -= rowHeight31;
  });

  y5 = c31RowY - 14;
  drawRightAlignedText({
    page: page5,
    font: times,
    text: `Sub-Category 3.1 Total: ${sub31.toFixed(2)}`,
    x: marginLeft,
    y: y5,
    size: 9,
    containerWidth: c5Width,
  });

  /* ===== PAGE 6 – DETAILED 3.2 (Training, Expert Services) ===== */

  const page6 = pdfDoc.addPage();
  const { width: w6, height: h6 } = page6.getSize();
  let y6 = h6 - 60;
  const c6Width = w6 - marginLeft - marginRight;

  page6.drawText(
    sanitizePdfText(
      "3.2 For expert services, training and active participation in professional/technical activities",
    ),
    {
      x: marginLeft,
      y: y6,
      size: 11,
      font: timesBold,
    },
  );
  y6 -= 22;

  // 3.2.1 Training & Seminars
  page6.drawText(
    sanitizePdfText("3.2.1 Training & Seminars (cap 10)"),
    {
      x: marginLeft,
      y: y6,
      size: 9,
      font: timesBold,
    },
  );
  y6 -= 14;

  const c321Cols = [
    c6Width * 0.55,
    c6Width * 0.15,
    c6Width * 0.15,
    c6Width * 0.15,
  ];
  const c321TopY = y6;

  type Cat32Row = {
    label: string;
    key: keyof typeof CAT3_CREDITS;
  };

  const rows321: Cat32Row[] = [
    { label: "Training – International (5)", key: "ts_intl" },
    { label: "Training – National (3)", key: "ts_nat" },
    { label: "Training – Local (2)", key: "ts_local" },
    {
      label: "Industrial/Agro/Fishery training – points per hour",
      key: "ts_industry",
    },
    {
      label: "Conference participation – International (3)",
      key: "ts_conf_intl",
    },
    {
      label: "Conference participation – National (2)",
      key: "ts_conf_nat",
    },
    {
      label: "Conference participation – Local (1)",
      key: "ts_conf_local",
    },
  ];

  drawTableBorders({
    page: page6,
    x: marginLeft,
    yTop: c321TopY,
    rowCount: rows321.length + 1,
    colWidths: c321Cols,
    rowHeight,
  });

  let c321X = marginLeft;
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Item / Description",
    x: c321X,
    y: c321TopY - 12,
    size: 9,
    width: c321Cols[0],
  });
  c321X += c321Cols[0];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Credit / Unit",
    x: c321X,
    y: c321TopY - 12,
    size: 9,
    width: c321Cols[1],
    align: "center",
  });
  c321X += c321Cols[1];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "# of Units",
    x: c321X,
    y: c321TopY - 12,
    size: 9,
    width: c321Cols[2],
    align: "center",
  });
  c321X += c321Cols[2];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Credit × Units",
    x: c321X,
    y: c321TopY - 12,
    size: 9,
    width: c321Cols[3],
    align: "center",
  });

  let c321RowY = c321TopY - rowHeight;
  let subtotal321 = 0;

  rows321.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal321 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page6,
      font: times,
      text: row.label,
      x: colX,
      y: c321RowY - 12,
      size: 9,
      width: c321Cols[0],
    });
    colX += c321Cols[0];
    drawCellText({
      page: page6,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c321RowY - 12,
      size: 9,
      width: c321Cols[1],
      align: "center",
    });
    colX += c321Cols[1];
    drawCellText({
      page: page6,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c321RowY - 12,
      size: 9,
      width: c321Cols[2],
      align: "center",
    });
    colX += c321Cols[2];
    drawCellText({
      page: page6,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c321RowY - 12,
      size: 9,
      width: c321Cols[3],
      align: "center",
    });

    // move down to the next row INSIDE the loop
    c321RowY -= rowHeight;
  });

  // leave a gap below table 3.2.1 before starting 3.2.2
  y6 = c321RowY - 24;

  // 3.2.2 Expert Services Rendered
  page6.drawText(
    sanitizePdfText("3.2.2 Expert Services Rendered (cap 20)"),
    {
      x: marginLeft,
      y: y6,
      size: 9,
      font: timesBold,
    },
  );
  y6 -= 14;

  const c322Cols = c321Cols;
  const c322TopY = y6;

  const rows322: Cat32Row[] = [
    { label: "Consultant/Expert – International (7)", key: "es_intl" },
    { label: "Consultant/Expert – National (5)", key: "es_nat" },
    { label: "Consultant/Expert – Local (2)", key: "es_local" },
    {
      label: "Coordinator/Lecturer/Resource – International (5)",
      key: "coord_intl",
    },
    {
      label: "Coordinator/Lecturer/Resource – National (3)",
      key: "coord_nat",
    },
    {
      label: "Coordinator/Lecturer/Resource – Local (2)",
      key: "coord_local",
    },
    { label: "Adviser – Doctoral (1)", key: "adv_doc" },
    { label: "Adviser – Masteral (0.5)", key: "adv_master" },
    { label: "Adviser – Undergraduate (0.25)", key: "adv_undergrad" },
    { label: "PRC/CSC Reviewer/Examiner (1)", key: "es_reviewer" },
    { label: "Accreditation/Board/Committee (1)", key: "es_accredit" },
    { label: "Trade skills certification (1)", key: "es_trade" },
    { label: "Coach/Trainer/Adviser per year (1)", key: "es_coach" },
  ];

  drawTableBorders({
    page: page6,
    x: marginLeft,
    yTop: c322TopY,
    rowCount: rows322.length + 1,
    colWidths: c322Cols,
    rowHeight,
  });

  let c322X = marginLeft;
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Item / Description",
    x: c322X,
    y: c322TopY - 12,
    size: 9,
    width: c322Cols[0],
  });
  c322X += c322Cols[0];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Credit / Unit",
    x: c322X,
    y: c322TopY - 12,
    size: 9,
    width: c322Cols[1],
    align: "center",
  });
  c322X += c322Cols[1];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "# of Units",
    x: c322X,
    y: c322TopY - 12,
    size: 9,
    width: c322Cols[2],
    align: "center",
  });
  c322X += c322Cols[2];
  drawCellText({
    page: page6,
    font: timesBold,
    text: "Credit × Units",
    x: c322X,
    y: c322TopY - 12,
    size: 9,
    width: c322Cols[3],
    align: "center",
  });

  let c322RowY = c322TopY - rowHeight;
  let subtotal322 = 0;

  rows322.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal322 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page6,
      font: times,
      text: row.label,
      x: colX,
      y: c322RowY - 12,
      size: 9,
      width: c322Cols[0],
    });
    colX += c322Cols[0];
    drawCellText({
      page: page6,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c322RowY - 12,
      size: 9,
      width: c322Cols[1],
      align: "center",
    });
    colX += c322Cols[1];
    drawCellText({
      page: page6,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c322RowY - 12,
      size: 9,
      width: c322Cols[2],
      align: "center",
    });
    colX += c322Cols[2];
    drawCellText({
      page: page6,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c322RowY - 12,
      size: 9,
      width: c322Cols[3],
      align: "center",
    });

    c322RowY -= rowHeight;
  });

  y6 = c322RowY - 14;
  const sub32Total = subtotal321 + subtotal322;
  drawRightAlignedText({
    page: page6,
    font: times,
    text: `Sub-Category 3.2 Total: ${sub32Total.toFixed(2)}`,
    x: marginLeft,
    y: y6,
    size: 9,
    containerWidth: c6Width, // same width you used for c321Cols/c322Cols
  });


  /* ===== PAGE 7 – DETAILED 3.3 (Professional Orgs & Scholarships) ===== */

  const page7 = pdfDoc.addPage();
  const { width: w7, height: h7 } = page7.getSize();
  let y7 = h7 - 60;
  const c7Width = w7 - marginLeft - marginRight;

  page7.drawText(
    sanitizePdfText(
      "3.3 Membership in professional organizations / honor societies and honors received",
    ),
    {
      x: marginLeft,
      y: y7,
      size: 11,
      font: timesBold,
    },
  );
  y7 -= 22;

  y6 = c321RowY - 24

  // 3.3.1 Professional Organizations
  page7.drawText(
    sanitizePdfText("3.3.1 Professional Organizations (cap 10)"),
    {
      x: marginLeft,
      y: y7,
      size: 9,
      font: timesBold,
    },
  );
  y7 -= 14;

  const c331Cols = [
    c7Width * 0.55,
    c7Width * 0.15,
    c7Width * 0.15,
    c7Width * 0.15,
  ];
  const c331TopY = y7;

  type Cat33Row = { label: string; key: keyof typeof CAT3_CREDITS };

  const rows331: Cat33Row[] = [
    { label: "Learned Society – Full member (2)", key: "po_full" },
    { label: "Learned Society – Associate member (1)", key: "po_assoc" },
    { label: "Honor Society (1)", key: "po_honor" },
    { label: "Scientific Society (1)", key: "po_science" },
    { label: "Professional Organization – Officer (1)", key: "po_officer" },
    { label: "Professional Organization – Member (0.5)", key: "po_member" },
  ];

  drawTableBorders({
    page: page7,
    x: marginLeft,
    yTop: c331TopY,
    rowCount: rows331.length + 1,
    colWidths: c331Cols,
    rowHeight,
  });

  let c331X = marginLeft;
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Item / Description",
    x: c331X,
    y: c331TopY - 12,
    size: 9,
    width: c331Cols[0],
  });
  c331X += c331Cols[0];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Credit / Unit",
    x: c331X,
    y: c331TopY - 12,
    size: 9,
    width: c331Cols[1],
    align: "center",
  });
  c331X += c331Cols[1];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "# of Units",
    x: c331X,
    y: c331TopY - 12,
    size: 9,
    width: c331Cols[2],
    align: "center",
  });
  c331X += c331Cols[2];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Credit × Units",
    x: c331X,
    y: c331TopY - 12,
    size: 9,
    width: c331Cols[3],
    align: "center",
  });

  let c331RowY = c331TopY - rowHeight;
  let subtotal331 = 0;

  rows331.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal331 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page7,
      font: times,
      text: row.label,
      x: colX,
      y: c331RowY - 12,
      size: 9,
      width: c331Cols[0],
    });
    colX += c331Cols[0];
    drawCellText({
      page: page7,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c331RowY - 12,
      size: 9,
      width: c331Cols[1],
      align: "center",
    });
    colX += c331Cols[1];
    drawCellText({
      page: page7,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c331RowY - 12,
      size: 9,
      width: c331Cols[2],
      align: "center",
    });
    colX += c331Cols[2];
    drawCellText({
      page: page7,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c331RowY - 12,
      size: 9,
      width: c331Cols[3],
      align: "center",
    });

    c331RowY -= rowHeight;
  });

 y7 = c331RowY - 24;

  // 3.3.2 Scholarship / Fellowship
  page7.drawText(
    sanitizePdfText("3.3.2 Scholarship / Fellowship (cap 10)"),
    {
      x: marginLeft,
      y: y7,
      size: 9,
      font: timesBold,
    },
  );
  y7 -= 14;

  const c332Cols = c331Cols;
  const c332TopY = y7;

  const rows332: Cat33Row[] = [
    { label: "International (Degree) (5)", key: "sf_intl_degree" },
    { label: "International (Non-Degree) (4)", key: "sf_intl_non" },
    { label: "National (Degree) (3)", key: "sf_nat_degree" },
    { label: "National (Non-Degree) (2)", key: "sf_nat_non" },
  ];

  drawTableBorders({
    page: page7,
    x: marginLeft,
    yTop: c332TopY,
    rowCount: rows332.length + 1,
    colWidths: c332Cols,
    rowHeight,
  });

  let c332X = marginLeft;
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Item / Description",
    x: c332X,
    y: c332TopY - 12,
    size: 9,
    width: c332Cols[0],
  });
  c332X += c332Cols[0];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Credit / Unit",
    x: c332X,
    y: c332TopY - 12,
    size: 9,
    width: c332Cols[1],
    align: "center",
  });
  c332X += c332Cols[1];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "# of Units",
    x: c332X,
    y: c332TopY - 12,
    size: 9,
    width: c332Cols[2],
    align: "center",
  });
  c332X += c332Cols[2];
  drawCellText({
    page: page7,
    font: timesBold,
    text: "Credit × Units",
    x: c332X,
    y: c332TopY - 12,
    size: 9,
    width: c332Cols[3],
    align: "center",
  });

  let c332RowY = c332TopY - rowHeight;
  let subtotal332 = 0;

  rows332.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal332 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page7,
      font: times,
      text: row.label,
      x: colX,
      y: c332RowY - 12,
      size: 9,
      width: c332Cols[0],
    });
    colX += c332Cols[0];
    drawCellText({
      page: page7,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c332RowY - 12,
      size: 9,
      width: c332Cols[1],
      align: "center",
    });
    colX += c332Cols[1];
    drawCellText({
      page: page7,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c332RowY - 12,
      size: 9,
      width: c332Cols[2],
      align: "center",
    });
    colX += c332Cols[2];
    drawCellText({
      page: page7,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c332RowY - 12,
      size: 9,
      width: c332Cols[3],
      align: "center",
    });

    c332RowY -= rowHeight;
  });

// REPLACE THIS BLOCK WITH:
  y7 = c332RowY - 14;
  const sub33Total = subtotal331 + subtotal332;
  drawRightAlignedText({
    page: page7,
    font: times,
    text: `Sub-Category 3.3 Total: ${sub33Total.toFixed(2)}`,
    x: marginLeft,
    y: y7,
    size: 9,
    containerWidth: c7Width, // use the same width you used when defining c7Width for page 7
  });


  /* ===== PAGE 8 – DETAILED 3.4, 3.5, 3.6 ===== */

  const page8 = pdfDoc.addPage();
  const { width: w8, height: h8 } = page8.getSize();
  let y8 = h8 - 60;
  const c8Width = w8 - marginLeft - marginRight;

  // 3.4 Awards of distinction
  page8.drawText(
    sanitizePdfText(
      "3.4 Awards of distinction received in recognition of achievements in relevant areas",
    ),
    {
      x: marginLeft,
      y: y8,
      size: 9,
      font: timesBold,
    },
  );
  y8 -= 14;

  const c34Cols = [
    c8Width * 0.55,
    c8Width * 0.15,
    c8Width * 0.15,
    c8Width * 0.15,
  ];
  const c34TopY = y8;

  type Cat34Row = { label: string; key: keyof typeof CAT3_CREDITS };

  const rows34: Cat34Row[] = [
    { label: "International (5)", key: "award_intl" },
    { label: "National/Regional (3)", key: "award_nat" },
    { label: "Local (1)", key: "award_local" },
  ];

  drawTableBorders({
    page: page8,
    x: marginLeft,
    yTop: c34TopY,
    rowCount: rows34.length + 1,
    colWidths: c34Cols,
    rowHeight,
  });

  let c34X = marginLeft;
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Item / Description",
    x: c34X,
    y: c34TopY - 12,
    size: 9,
    width: c34Cols[0],
  });
  c34X += c34Cols[0];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit / Unit",
    x: c34X,
    y: c34TopY - 12,
    size: 9,
    width: c34Cols[1],
    align: "center",
  });
  c34X += c34Cols[1];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "# of Units",
    x: c34X,
    y: c34TopY - 12,
    size: 9,
    width: c34Cols[2],
    align: "center",
  });
  c34X += c34Cols[2];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit × Units",
    x: c34X,
    y: c34TopY - 12,
    size: 9,
    width: c34Cols[3],
    align: "center",
  });

  let c34RowY = c34TopY - rowHeight;
  let subtotal34 = 0;

  rows34.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal34 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page8,
      font: times,
      text: row.label,
      x: colX,
      y: c34RowY - 12,
      size: 9,
      width: c34Cols[0],
    });
    colX += c34Cols[0];
    drawCellText({
      page: page8,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c34RowY - 12,
      size: 9,
      width: c34Cols[1],
      align: "center",
    });
    colX += c34Cols[1];
    drawCellText({
      page: page8,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c34RowY - 12,
      size: 9,
      width: c34Cols[2],
      align: "center",
    });
    colX += c34Cols[2];
    drawCellText({
      page: page8,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c34RowY - 12,
      size: 9,
      width: c34Cols[3],
      align: "center",
    });

    c34RowY -= rowHeight;
  });

  y8 = c34RowY - 14;
  drawRightAlignedText({
    page: page8,
    font: times,
    text: `Sub-Category 3.4 Total: ${sub34.toFixed(2)}`,
    x: marginLeft,
    y: y8,
    size: 9,
    containerWidth: c8Width,
  });

  // 3.5 Community outreach
  y8 -= 22;
  page8.drawText(
    sanitizePdfText("3.5 Community outreach"),
    {
      x: marginLeft,
      y: y8,
      size: 9,
      font: timesBold,
    },
  );
  y8 -= 14;

  const c35Cols = c34Cols;
  const c35TopY = y8;

  const rows35: { label: string; key: keyof typeof CAT3_CREDITS }[] = [
    { label: "Service-oriented project – per year (1)", key: "co_service" },
  ];

  drawTableBorders({
    page: page8,
    x: marginLeft,
    yTop: c35TopY,
    rowCount: rows35.length + 1,
    colWidths: c35Cols,
    rowHeight,
  });

  let c35X = marginLeft;
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Item / Description",
    x: c35X,
    y: c35TopY - 12,
    size: 9,
    width: c35Cols[0],
  });
  c35X += c35Cols[0];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit / Unit",
    x: c35X,
    y: c35TopY - 12,
    size: 9,
    width: c35Cols[1],
    align: "center",
  });
  c35X += c35Cols[1];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "# of Units",
    x: c35X,
    y: c35TopY - 12,
    size: 9,
    width: c35Cols[2],
    align: "center",
  });
  c35X += c35Cols[2];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit × Units",
    x: c35X,
    y: c35TopY - 12,
    size: 9,
    width: c35Cols[3],
    align: "center",
  });

  let c35RowY = c35TopY - rowHeight;
  let subtotal35 = 0;

  rows35.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal35 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page8,
      font: times,
      text: row.label,
      x: colX,
      y: c35RowY - 12,
      size: 9,
      width: c35Cols[0],
    });
    colX += c35Cols[0];
    drawCellText({
      page: page8,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c35RowY - 12,
      size: 9,
      width: c35Cols[1],
      align: "center",
    });
    colX += c35Cols[1];
    drawCellText({
      page: page8,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c35RowY - 12,
      size: 9,
      width: c35Cols[2],
      align: "center",
    });
    colX += c35Cols[2];
    drawCellText({
      page: page8,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c35RowY - 12,
      size: 9,
      width: c35Cols[3],
      align: "center",
    });

    c35RowY -= rowHeight;
  });

  y8 = c35RowY - 14;
  drawRightAlignedText({
    page: page8,
    font: times,
    text: `Sub-Category 3.5 Total: ${sub35.toFixed(2)}`,
    x: marginLeft,
    y: y8,
    size: 9,
    containerWidth: c8Width,
  });

  // 3.6 Professional examinations
  y8 -= 22;
  page8.drawText(
    sanitizePdfText("3.6 Professional examinations"),
    {
      x: marginLeft,
      y: y8,
      size: 9,
      font: timesBold,
    },
  );
  y8 -= 14;

  const c36Cols = c34Cols;
  const c36TopY = y8;

  const rows36: { label: string; key: keyof typeof CAT3_CREDITS }[] = [
    {
      label: "Engineering/Accounting/Medicine/Law/Teachers etc. (5)",
      key: "pex_eng_law_teachers",
    },
    {
      label: "Marine Board / Master Electrician / similar (2)",
      key: "pex_marine_elec",
    },
    {
      label: "Other trade skill certificate (1)",
      key: "pex_trade_other",
    },
  ];

  drawTableBorders({
    page: page8,
    x: marginLeft,
    yTop: c36TopY,
    rowCount: rows36.length + 1,
    colWidths: c36Cols,
    rowHeight,
  });

  let c36X = marginLeft;
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Item / Description",
    x: c36X,
    y: c36TopY - 12,
    size: 9,
    width: c36Cols[0],
  });
  c36X += c36Cols[0];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit / Unit",
    x: c36X,
    y: c36TopY - 12,
    size: 9,
    width: c36Cols[1],
    align: "center",
  });
  c36X += c36Cols[1];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "# of Units",
    x: c36X,
    y: c36TopY - 12,
    size: 9,
    width: c36Cols[2],
    align: "center",
  });
  c36X += c36Cols[2];
  drawCellText({
    page: page8,
    font: timesBold,
    text: "Credit × Units",
    x: c36X,
    y: c36TopY - 12,
    size: 9,
    width: c36Cols[3],
    align: "center",
  });

  let c36RowY = c36TopY - rowHeight;
  let subtotal36 = 0;

  rows36.forEach((row) => {
    const credit = CAT3_CREDITS[row.key];
    const unitsVal = safeNumber(units[row.key]);
    const credited = unitsVal * credit;
    subtotal36 += credited;

    let colX = marginLeft;
    drawCellText({
      page: page8,
      font: times,
      text: row.label,
      x: colX,
      y: c36RowY - 12,
      size: 9,
      width: c36Cols[0],
    });
    colX += c36Cols[0];
    drawCellText({
      page: page8,
      font: times,
      text: formatNum(credit),
      x: colX,
      y: c36RowY - 12,
      size: 9,
      width: c36Cols[1],
      align: "center",
    });
    colX += c36Cols[1];
    drawCellText({
      page: page8,
      font: times,
      text: unitsVal ? formatNum(unitsVal) : "",
      x: colX,
      y: c36RowY - 12,
      size: 9,
      width: c36Cols[2],
      align: "center",
    });
    colX += c36Cols[2];
    drawCellText({
      page: page8,
      font: times,
      text: credited ? formatNum(credited) : "",
      x: colX,
      y: c36RowY - 12,
      size: 9,
      width: c36Cols[3],
      align: "center",
    });

    c36RowY -= rowHeight;
  });

  y8 = c36RowY - 14;
  drawRightAlignedText({
    page: page8,
    font: times,
    text: `Sub-Category 3.6 Total: ${sub36.toFixed(2)}`,
    x: marginLeft,
    y: y8,
    size: 9,
    containerWidth: c8Width,
  });

  /* ===== PAGE 9 – CATEGORY 4 DETAIL TABLES ===== */

  const page9 = pdfDoc.addPage();
  const { width: w9, height: h9 } = page9.getSize();
  let y9 = h9 - 60;
  const c9Width = w9 - marginLeft - marginRight;

  page9.drawText(
    sanitizePdfText("CATEGORY 4 - Technological Knowledge"),
    {
      x: marginLeft,
      y: y9,
      size: 12,
      font: timesBold,
    },
  );
  y9 -= 22;

  const tech = ds.technologicalSkills || {};
  const c4_1 = safeNumber(tech.basicMicrosoft?.subtotal);
  const c4_2 = safeNumber(tech.educationalApps?.subtotal);
  const c4_3 = safeNumber(tech.longTraining?.subtotal);
  const c4_4 = safeNumber(tech.creativeWork?.subtotal);
  const c4_total = tech.subtotal ?? techScore;

  // 4.1 Basic Knowledge in Microsoft Offices
  page9.drawText(
    sanitizePdfText("4.1 Basic Knowledge in Microsoft Offices"),
    {
      x: marginLeft,
      y: y9,
      size: 9,
      font: timesBold,
    },
  );
  y9 -= 14;

  const c41Cols = [
    c9Width * 0.45,
    c9Width * 0.17,
    c9Width * 0.13,
    c9Width * 0.12,
    c9Width * 0.13,
  ];
  const c41TopY = y9;

  drawTableBorders({
    page: page9,
    x: marginLeft,
    yTop: c41TopY,
    rowCount: 3 + 1,
    colWidths: c41Cols,
    rowHeight,
  });

  let c41X = marginLeft;
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Item",
    x: c41X,
    y: c41TopY - 12,
    size: 9,
    width: c41Cols[0],
  });
  c41X += c41Cols[0];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Scale",
    x: c41X,
    y: c41TopY - 12,
    size: 9,
    width: c41Cols[1],
    align: "center",
  });
  c41X += c41Cols[1];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit",
    x: c41X,
    y: c41TopY - 12,
    size: 9,
    width: c41Cols[2],
    align: "center",
  });
  c41X += c41Cols[2];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "# of Units",
    x: c41X,
    y: c41TopY - 12,
    size: 9,
    width: c41Cols[3],
    align: "center",
  });
  c41X += c41Cols[3];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit × Units",
    x: c41X,
    y: c41TopY - 12,
    size: 9,
    width: c41Cols[4],
    align: "center",
  });

const msWord = tech.basicMicrosoft?.word || 0;
const msExcel = tech.basicMicrosoft?.excel || 0;
const msPowerpoint = tech.basicMicrosoft?.powerpoint || 0;

const rows41Data = [
  { label: "4.1.1 Microsoft Word", rating: msWord },
  { label: "4.1.2 Excel", rating: msExcel },
  { label: "4.1.3 PowerPoint", rating: msPowerpoint },
];

let c41RowY = c41TopY - rowHeight;
rows41Data.forEach((item) => {
  let colX = marginLeft;
  drawCellText({
    page: page9,
    font: times,
    text: item.label,
    x: colX,
    y: c41RowY - 12,
    size: 9,
    width: c41Cols[0],
  });
  colX += c41Cols[0];
  drawCellText({
    page: page9,
    font: times,
    text: "1 to 5",
    x: colX,
    y: c41RowY - 12,
    size: 9,
    width: c41Cols[1],
    align: "center",
  });
  colX += c41Cols[1];
  drawCellText({
    page: page9,
    font: times,
    text: "1",
    x: colX,
    y: c41RowY - 12,
    size: 9,
    width: c41Cols[2],
    align: "center",
  });
  colX += c41Cols[2];
  drawCellText({
    page: page9,
    font: times,
    text: item.rating ? String(item.rating) : "",
    x: colX,
    y: c41RowY - 12,
    size: 9,
    width: c41Cols[3],
    align: "center",
  });
  colX += c41Cols[3];
  drawCellText({
    page: page9,
    font: times,
    text: item.rating ? (item.rating * 1).toFixed(2) : "",
    x: colX,
    y: c41RowY - 12,
    size: 9,
    width: c41Cols[4],
    align: "center",
  });

  c41RowY -= rowHeight;
});

  y9 = c41RowY - 14;
  drawRightAlignedText({
    page: page9,
    font: times,
    text: `Subtotal 4.1: ${c4_1.toFixed(2)}`,
    x: marginLeft,
    y: y9,
    size: 9,
    containerWidth: c9Width,
  });

  const c4xCols = c41Cols;

  // Add spacing below Subtotal 4.1 before starting 4.2
  y9 -= 18;

  page9.drawText(
    sanitizePdfText("4.2 Able to use educational / related apps"),
    {
      x: marginLeft,
      y: y9,
      size: 9,
      font: timesBold,
    },
  );
  y9 -= 14;

  const c42TopY = y9;

  // 4.2 table (1 row) – separate boxed table
  drawTableBorders({
    page: page9,
    x: marginLeft,
    yTop: c42TopY,
    rowCount: 1 + 1, // header + 1 body row
    colWidths: c4xCols,
    rowHeight,
  });

  let c42X = marginLeft;
  // Header row (shared structure for 4.2, 4.3, 4.4)
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Item / Coverage / Criteria",
    x: c42X,
    y: c42TopY - 12,
    size: 9,
    width: c4xCols[0],
  });
  c42X += c4xCols[0];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Scale",
    x: c42X,
    y: c42TopY - 12,
    size: 9,
    width: c4xCols[1],
    align: "center",
  });
  c42X += c4xCols[1];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit",
    x: c42X,
    y: c42TopY - 12,
    size: 9,
    width: c4xCols[2],
    align: "center",
  });
  c42X += c4xCols[2];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "# of Units",
    x: c42X,
    y: c42TopY - 12,
    size: 9,
    width: c4xCols[3],
    align: "center",
  });
  c42X += c4xCols[3];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit × Units",
    x: c42X,
    y: c42TopY - 12,
    size: 9,
    width: c4xCols[4],
    align: "center",
  });

const eduAppsRating = tech.educationalApps?.rating || 0;
const eduAppsCount = tech.educationalApps?.count || 0;

// Body row
let c42RowY = c42TopY - rowHeight;
let colX42 = marginLeft;
drawCellText({
  page: page9,
  font: times,
  text: "4.2 Educational / related apps",
  x: colX42,
  y: c42RowY - 12,
  size: 9,
  width: c4xCols[0],
});
colX42 += c4xCols[0];
drawCellText({
  page: page9,
  font: times,
  text: "1 to 5",
  x: colX42,
  y: c42RowY - 12,
  size: 9,
  width: c4xCols[1],
  align: "center",
});
colX42 += c4xCols[1];
drawCellText({
  page: page9,
  font: times,
  text: "1",
  x: colX42,
  y: c42RowY - 12,
  size: 9,
  width: c4xCols[2],
  align: "center",
});
colX42 += c4xCols[2];
drawCellText({
  page: page9,
  font: times,
  text: eduAppsCount ? String(eduAppsCount) : "",
  x: colX42,
  y: c42RowY - 12,
  size: 9,
  width: c4xCols[3],
  align: "center",
});
colX42 += c4xCols[3];
drawCellText({
  page: page9,
  font: times,
  text: (eduAppsRating && eduAppsCount) ? (eduAppsRating * eduAppsCount).toFixed(2) : "",
  x: colX42,
  y: c42RowY - 12,
  size: 9,
  width: c4xCols[4],
  align: "center",
});

// Move BELOW table (header + 1 row)
const c42TableHeight = rowHeight * 2; // header + body
y9 = c42TopY - c42TableHeight - 12;

drawRightAlignedText({
  page: page9,
  font: times,
  text: `Subtotal 4.2: ${c4_2.toFixed(2)}`,
  x: marginLeft,
  y: y9,
  size: 9,
  containerWidth: c9Width,
});

  // Extra spacing between 4.2 and 4.3
  y9 -= 12;

  // 4.3 Training course >= 1 year (pro-rated; cap 10 pts.)
  page9.drawText(
    sanitizePdfText(
      "4.3 Training course ≥ 1 year (pro-rated; maximum of 10 points)",
    ),
    {
      x: marginLeft,
      y: y9,
      size: 9,
      font: timesBold,
    },
  );
  y9 -= 14;

  const c43TopY = y9;

  drawTableBorders({
    page: page9,
    x: marginLeft,
    yTop: c43TopY,
    rowCount: 3 + 1, // header + 3 body rows
    colWidths: c4xCols,
    rowHeight,
  });

  let c43X = marginLeft;
  // Header row (same 5-column structure)
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Item / Coverage / Criteria",
    x: c43X,
    y: c43TopY - 12,
    size: 9,
    width: c4xCols[0],
  });
  c43X += c4xCols[0];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Scale",
    x: c43X,
    y: c43TopY - 12,
    size: 9,
    width: c4xCols[1],
    align: "center",
  });
  c43X += c4xCols[1];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit",
    x: c43X,
    y: c43TopY - 12,
    size: 9,
    width: c4xCols[2],
    align: "center",
  });
  c43X += c4xCols[2];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "# of Units",
    x: c43X,
    y: c43TopY - 12,
    size: 9,
    width: c4xCols[3],
    align: "center",
  });
  c43X += c4xCols[3];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit × Units",
    x: c43X,
    y: c43TopY - 12,
    size: 9,
    width: c4xCols[4],
    align: "center",
  });

const trainingBd = tech.longTraining?.breakdown || {};
const rows43Data = [
  { label: "a. International", scale: "1 to 5", rating: trainingBd.international || 0, multiplier: 5 },
  { label: "b. National", scale: "1 to 3", rating: trainingBd.national || 0, multiplier: 3 },
  { label: "c. Local", scale: "1 to 2", rating: trainingBd.local || 0, multiplier: 2 },
];

let c43RowY = c43TopY - rowHeight;
rows43Data.forEach((row) => {
  let colX = marginLeft;
  drawCellText({
    page: page9,
    font: times,
    text: row.label,
    x: colX,
    y: c43RowY - 12,
    size: 9,
    width: c4xCols[0],
  });
  colX += c4xCols[0];
  drawCellText({
    page: page9,
    font: times,
    text: row.scale,
    x: colX,
    y: c43RowY - 12,
    size: 9,
    width: c4xCols[1],
    align: "center",
  });
  colX += c4xCols[1];
  drawCellText({
    page: page9,
    font: times,
    text: "1",
    x: colX,
    y: c43RowY - 12,
    size: 9,
    width: c4xCols[2],
    align: "center",
  });
  colX += c4xCols[2];
  drawCellText({
    page: page9,
    font: times,
    text: row.rating ? String(row.rating) : "",
    x: colX,
    y: c43RowY - 12,
    size: 9,
    width: c4xCols[3],
    align: "center",
  });
  colX += c4xCols[3];
  drawCellText({
    page: page9,
    font: times,
    text: row.rating ? (row.rating * row.multiplier).toFixed(2) : "",
    x: colX,
    y: c43RowY - 12,
    size: 9,
    width: c4xCols[4],
    align: "center",
  });

  c43RowY -= rowHeight;
});

  // Subtotal 4.3 (outside the table grid)
  y9 = c43RowY - 14;
  drawRightAlignedText({
    page: page9,
    font: times,
    text: `Subtotal 4.3: ${c4_3.toFixed(2)}`,
    x: marginLeft,
    y: y9,
    size: 9,
    containerWidth: c9Width,
  });

  // Extra spacing between 4.3 and 4.4
  y9 -= 12;

  // 4.4 Creative work
  page9.drawText(
    sanitizePdfText("4.4 Creative work"),
    {
      x: marginLeft,
      y: y9,
      size: 9,
      font: timesBold,
    },
  );
  y9 -= 14;

  const c44TopY = y9;

  drawTableBorders({
    page: page9,
    x: marginLeft,
    yTop: c44TopY,
    rowCount: 4 + 1, // header + 4 body rows
    colWidths: c4xCols,
    rowHeight,
  });

  let c44X = marginLeft;
  // Header row (same 5-column structure)
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Item / Coverage / Criteria",
    x: c44X,
    y: c44TopY - 12,
    size: 9,
    width: c4xCols[0],
  });
  c44X += c4xCols[0];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Scale",
    x: c44X,
    y: c44TopY - 12,
    size: 9,
    width: c4xCols[1],
    align: "center",
  });
  c44X += c4xCols[1];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit",
    x: c44X,
    y: c44TopY - 12,
    size: 9,
    width: c4xCols[2],
    align: "center",
  });
  c44X += c4xCols[2];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "# of Units",
    x: c44X,
    y: c44TopY - 12,
    size: 9,
    width: c4xCols[3],
    align: "center",
  });
  c44X += c4xCols[3];
  drawCellText({
    page: page9,
    font: timesBold,
    text: "Credit × Units",
    x: c44X,
    y: c44TopY - 12,
    size: 9,
    width: c4xCols[4],
    align: "center",
  });

const creativeBd = tech.creativeWork?.breakdown || {};
const rows44Data = [
  { label: "a. Originality: 25% of 1", rating: creativeBd.originality || 0 },
  { label: "b. Acceptability and recognition: 25% of 1", rating: creativeBd.acceptability || 0 },
  { label: "c. Relevance and value: 25% of 1", rating: creativeBd.relevance || 0 },
  { label: "d. Documentation & evidence of dissemination: 25% of 1", rating: creativeBd.documentation || 0 },
];

let c44RowY = c44TopY - rowHeight;
rows44Data.forEach((item) => {
  let colX = marginLeft;
  drawCellText({
    page: page9,
    font: times,
    text: item.label,
    x: colX,
    y: c44RowY - 12,
    size: 9,
    width: c4xCols[0],
  });
  colX += c4xCols[0];
  drawCellText({
    page: page9,
    font: times,
    text: "1 to 5",
    x: colX,
    y: c44RowY - 12,
    size: 9,
    width: c4xCols[1],
    align: "center",
  });
  colX += c4xCols[1];
  drawCellText({
    page: page9,
    font: times,
    text: "1",
    x: colX,
    y: c44RowY - 12,
    size: 9,
    width: c4xCols[2],
    align: "center",
  });
  colX += c4xCols[2];
  drawCellText({
    page: page9,
    font: times,
    text: item.rating ? String(item.rating) : "",
    x: colX,
    y: c44RowY - 12,
    size: 9,
    width: c4xCols[3],
    align: "center",
  });
  colX += c4xCols[3];
  drawCellText({
    page: page9,
    font: times,
    text: item.rating ? (item.rating * 0.25).toFixed(2) : "",
    x: colX,
    y: c44RowY - 12,
    size: 9,
    width: c4xCols[4],
    align: "center",
  });

  c44RowY -= rowHeight;
});
  // Subtotals for 4.4 (outside the table grid)
  y9 = c44RowY - 14;
  drawRightAlignedText({
    page: page9,
    font: times,
    text: `Subtotal 4.4: ${c4_4.toFixed(2)}`,
    x: marginLeft,
    y: y9,
    size: 9,
    containerWidth: c9Width,
  });

  /* ===== PAGE 10 – SIGNATURES ONLY ===== */

  const page10 = pdfDoc.addPage();
  const { width: w10, height: h10 } = page10.getSize();
  const contentWidth10 = w10 - marginLeft - marginRight;
  let y10 = h10 - 120;

  // Evaluator info (keep, but no remarks section)
  page10.drawText(
    sanitizePdfText(`Evaluated By: ${evaluation.evaluatedBy || "N/A"}`),
    {
      x: marginLeft,
      y: y10,
      size: 10,
      font: times,
    },
  );
  y10 -= 14;
  page10.drawText(
    sanitizePdfText(`Date Evaluated: ${evalDate}`),
    {
      x: marginLeft,
      y: y10,
      size: 10,
      font: times,
    },
  );

  // Move down before signatures
  y10 -= 60;

  const sigWidth = 160;
  const gap = 80;
  const leftX = marginLeft;
  const rightX = marginLeft + sigWidth + gap;

  // ----- Signature lines: HR (left) & Dean (right) -----
  page10.drawLine({
    start: { x: leftX, y: y10 },
    end: { x: leftX + sigWidth, y: y10 },
    thickness: 0.7,
    color: rgb(0, 0, 0),
  });
  page10.drawLine({
    start: { x: rightX, y: y10 },
    end: { x: rightX + sigWidth, y: y10 },
    thickness: 0.7,
    color: rgb(0, 0, 0),
  });

  page10.drawText(
    sanitizePdfText("HR Representative / Evaluator"),
    {
      x: leftX,
      y: y10 - 12,
      size: 10,
      font: times,
    },
  );
  page10.drawText(
    sanitizePdfText("Dean / College Representative"),
    {
      x: rightX,
      y: y10 - 12,
      size: 10,
      font: times,
    },
  );

  // ----- Third signature: Vice President for Academic Affairs (left-aligned below) -----
  const vpY = y10 - 70;
  const vpX = marginLeft;

  page10.drawLine({
    start: { x: vpX, y: vpY },
    end: { x: vpX + sigWidth, y: vpY },
    thickness: 0.7,
    color: rgb(0, 0, 0),
  });

  page10.drawText(
    sanitizePdfText("Vice President for Academic Affairs"),
    {
      x: vpX,
      y: vpY - 12,
      size: 10,
      font: times,
    },
  );

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/* ========= ROUTE HANDLER ========= */

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  // ✅ await params before using id
  const { id } = await context.params;

  try {
    const evaluation = (await prisma.evaluation.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            vacancy: true,
          },
        },
        // ✅ this will pull the EvaluationItem[] rows once the table exists
        items: true,
      },
    })) as EvaluationWithRelations | null;

    if (!evaluation) {
      return NextResponse.json(
        { message: "Evaluation not found" },
        { status: 404 },
      );
    }

    const pdfBytes = await generatePdf(evaluation);

    const applicantName =
      evaluation.application?.fullName?.replace(/\s+/g, "_") || "Applicant";

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${applicantName}_Evaluation_Report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating evaluation PDF:", error);
    return NextResponse.json(
      {
        message: "Failed to generate PDF",
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
