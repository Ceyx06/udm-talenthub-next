"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

/* =========================================================
   SAMPLE TABLE DATA (replace with API later)
========================================================= */
const rows = [
  { name: "Juan Dela Cruz", college: "CAS", job: "Associate Professor", files: "Complete", stage: "Conducted" },
  { name: "Maria Santos", college: "CHS", job: "Instructor", files: "Partial", stage: "Evaluating" },
  { name: "Pedro Garcia", college: "CBPM", job: "Assistant Professor", files: "Complete", stage: "Pending" },
];

/* =========================================================
   HELPERS
========================================================= */
const sum = (a: number[]) => a.reduce((x, y) => x + (Number.isFinite(y) ? y : 0), 0);
const cap = (v: number, lim: number) => Math.min(v || 0, lim);
const cx = (...a: (string | false | undefined)[]) => a.filter(Boolean).join(" ");

type RankBand = { min: number; max: number; rank: string; rate: number };
const rankScale: RankBand[] = [
  { min: 0, max: 149.99, rank: "Lecturer I", rate: 220.0 },
  { min: 150, max: 179.99, rank: "Lecturer II", rate: 236.55 },
  { min: 180, max: 199.99, rank: "Lecturer III", rate: 260.2 },
  { min: 200, max: 219.99, rank: "Instructor I", rate: 285.0 },
  { min: 220, max: 239.99, rank: "Instructor II", rate: 310.0 },
  { min: 240, max: 259.99, rank: "Instructor III", rate: 335.0 },
  { min: 260, max: 279.99, rank: "Asst. Prof I", rate: 360.0 },
  { min: 280, max: 299.99, rank: "Asst. Prof II", rate: 400.0 },
  { min: 300, max: 324.99, rank: "Assoc. Prof I", rate: 450.0 },
  { min: 325, max: 350.0, rank: "Assoc. Prof II", rate: 500.0 },
];
const computeRank = (total: number) => {
  const b = rankScale.find((r) => total >= r.min && total <= r.max);
  return b ? { rank: b.rank, rate: b.rate } : { rank: "Unclassified", rate: 0 };
};

/* =========================================================
   EVALUATION STATE – SECTION 3 TYPES
========================================================= */
type S3LineItem = { credit: number; units: number };
type S3Store = Record<string, S3LineItem>;
type S3SectionKey = "3.1" | "3.2" | "3.3" | "3.4" | "3.5" | "3.6";

const S3_CAPS: Record<S3SectionKey, number> = {
  "3.1": 30,
  "3.2": 30,
  "3.3": 10,
  "3.4": 10,
  "3.5": 5,
  "3.6": 10,
};
const S3_TOTAL_CAP = 90;

function lineTotal(li?: S3LineItem) {
  if (!li) return 0;
  const c = Number(li.credit) || 0;
  const u = Number(li.units) || 0;
  return c * u;
}
function sumLines(store: S3Store, keys: string[]) {
  return keys.reduce((acc, k) => acc + lineTotal(store[k]), 0);
}

/* =========================================================
   EVALUATION STATE – NEW SECTION 4 TYPES
========================================================= */
type S4Item = { credit: number; units: number; maxUnits: number }; // units = rating/count per rubric
type S4Store = Record<string, S4Item>;

const defaultS4: S4Store = {
  // 4.1 Basic knowledge in Microsoft Offices (Scale 1–5, Credit 1)
  "411_word":       { credit: 1, units: 0, maxUnits: 5 },
  "412_excel":      { credit: 1, units: 0, maxUnits: 5 },
  "413_powerpoint": { credit: 1, units: 0, maxUnits: 5 },

  // 4.2 Educational & related apps (Scale 1–5, Credit 1)
  "42_apps":        { credit: 1, units: 0, maxUnits: 5 },

  // 4.3 Training course ≥ 1 year (pro-rated; NOT to exceed 10 pts.)
  // a. International (1–5), b. National (1–5), c. Local (1–2)
  "43_international": { credit: 1, units: 0, maxUnits: 5 },
  "43_national":      { credit: 1, units: 0, maxUnits: 5 },
  "43_local":         { credit: 1, units: 0, maxUnits: 2 },

  // 4.4 Creative work criteria – “25% of 1” each → credit = 0.25, scale 1–5
  "44_originality":     { credit: 0.25, units: 0, maxUnits: 5 },
  "44_acceptability":   { credit: 0.25, units: 0, maxUnits: 5 },
  "44_relevance":       { credit: 0.25, units: 0, maxUnits: 5 },
  "44_documentation":   { credit: 0.25, units: 0, maxUnits: 5 },
};

const s4Line = (it?: S4Item) => (!it ? 0 : (Number(it.credit) || 0) * (Number(it.units) || 0));
const s4Sum = (store: S4Store, ids: string[]) => ids.reduce((a, id) => a + s4Line(store[id]), 0);

/* =========================================================
   EVALUATION INPUT TYPE
========================================================= */
type EvalInput = {
  // 1. Educational
  highestDegree:
    | "PhD"
    | "Masters"
    | "LLB_MD"
    | "DiplomaAboveBacc"
    | "Bacc4"
    | "Bacc5"
    | "Bacc6"
    | "Special3yr"
    | "Special2yr"
    | "Other"
    | null;
  addlMasters: number;
  addlBachelors: number;
  addlCreditsUnits: number;

  // 2. Experience & Prof Services (detailed)
  s21_stateHEIYears: number; // ×1.0
  s22_otherInstYears: number; // ×0.75
  s23_presidentYears: number; // ×3.0
  s23_vicePresidentYears: number; // ×2.5
  s23_deanDirectorSuperYears: number; // ×2.0
  s23_principalSupervisorChairYears: number; // ×1.0
  s24_engineerManagerYears: number; // ×1.5
  s24_technicianYears: number; // ×1.0
  s24_skilledWorkerYears: number; // ×0.5
  s25_cooperatingTeacherYears: number; // ×1.5
  s25_basicEdTeacherYears: number; // ×1.0

  // 3. Professional Development etc.
  s3: S3Store;

  // 4. Technological Knowledge (NEW structured rubric; cap 50)
  s4: S4Store;

  // (legacy inputs kept if you still reference elsewhere; unused here)
  licensureA: number;
  licensureB: number;
  licensureC: number;
};

const degreePoints: Record<NonNullable<EvalInput["highestDegree"]>, number> = {
  PhD: 85,
  Masters: 65,
  LLB_MD: 65,
  DiplomaAboveBacc: 55,
  Bacc4: 45,
  Bacc5: 50,
  Bacc6: 55,
  Special3yr: 30,
  Special2yr: 25,
  Other: 0,
};

/* =========================================================
   DEFAULTS – SECTION 3 (unchanged) + SECTION 4 (new)
========================================================= */
const defaultS3: S3Store = {
  // ========= 3.1 Innovations / Inventions / Publications & Creative Works (cap 30) =========
  // === 3.1.1 A/B/C ===
  // A. Inventions – If patented / If pending
  "311A_patented_intl": { credit: 7, units: 0 },
  "311A_patented_nat": { credit: 5, units: 0 },
  "311A_patented_inst": { credit: 2, units: 0 },
  "311A_pending_intl": { credit: 7, units: 0 },
  "311A_pending_nat": { credit: 5, units: 0 },
  "311A_pending_inst": { credit: 2, units: 0 },

  // B. Discoveries
  "311B_originality_impact": { credit: 4.2, units: 0 }, // 60% of 7
  "311B_dissemination": { credit: 2.8, units: 0 }, // 40% of 7

  // C. Creative work (any criteria)
  "311C_acceptability": { credit: 1.75, units: 0 }, // 25% of 7
  "311C_recognition": { credit: 1.75, units: 0 },
  "311C_relevance": { credit: 1.75, units: 0 },
  "311C_documentation": { credit: 1.75, units: 0 },

  // === 3.1.2 Books (Role x Level grid) ===
  // a. Single Author
  "312_single_tertiary": { credit: 7, units: 0 },
  "312_single_high": { credit: 5, units: 0 },
  "312_single_elem": { credit: 4, units: 0 },
  // b. Co-author
  "312_co_tertiary": { credit: 3, units: 0 },
  "312_co_high": { credit: 2, units: 0 },
  "312_co_elem": { credit: 2, units: 0 },
  // c. Reviewer
  "312_rev_tertiary": { credit: 4, units: 0 },
  "312_rev_high": { credit: 2, units: 0 },
  "312_rev_elem": { credit: 1, units: 0 },
  // d. Translator
  "312_trans_tertiary": { credit: 3, units: 0 },
  "312_trans_high": { credit: 2, units: 0 },
  "312_trans_elem": { credit: 1, units: 0 },
  // e. Editor
  "312_edit_tertiary": { credit: 2, units: 0 },
  "312_edit_high": { credit: 2, units: 0 },
  "312_edit_elem": { credit: 1, units: 0 },
  // f. Compiler
  "312_comp_tertiary": { credit: 2, units: 0 },
  "312_comp_high": { credit: 1, units: 0 },
  "312_comp_elem": { credit: 1, units: 0 },

  // === 3.1.3 Articles (Coverage x Role) ===
  "313_intl_single": { credit: 5, units: 0 },
  "313_intl_co": { credit: 2.5, units: 0 },
  "313_nat_single": { credit: 3, units: 0 },
  "313_nat_co": { credit: 1.5, units: 0 },
  "313_local_single": { credit: 2, units: 0 },
  "313_local_co": { credit: 1, units: 0 },

  // === 3.1.4 Instructional manual / AV material ===
  "314_single_maker": { credit: 1, units: 0 },
  "314_co_maker": { credit: 0.5, units: 0 },

  // ========= 3.2 Expert services / training / participation (cap 30) =========
  // 3.2.1 Training & seminars (cap 10 inside)
  "321_training_international": { credit: 5, units: 0 },
  "321_training_national": { credit: 3, units: 0 },
  "321_training_local": { credit: 2, units: 0 },
  "3212_industrial_hours": { credit: 0.1, units: 0 }, // points per hour
  "3213_conf_international": { credit: 3, units: 0 },
  "3213_conf_national": { credit: 2, units: 0 },
  "3213_conf_local": { credit: 1, units: 0 },
  // 3.2.2 Expert services (cap 20 inside)
  "3221_consult_intl": { credit: 7, units: 0 },
  "3221_consult_nat": { credit: 5, units: 0 },
  "3221_consult_local": { credit: 2, units: 0 },
  "3222_lecturer_intl": { credit: 5, units: 0 },
  "3222_lecturer_nat": { credit: 3, units: 0 },
  "3222_lecturer_local": { credit: 2, units: 0 },
  "3223_adviser_doctoral": { credit: 1, units: 0 },
  "3223_adviser_masteral": { credit: 0.5, units: 0 },
  "3223_adviser_undergrad": { credit: 0.25, units: 0 },
  "3224_prc_csc_examiner": { credit: 1, units: 0 },
  "3225_accreditation_work": { credit: 1, units: 0 },
  "3226_trade_skills_cert": { credit: 1, units: 0 },
  "3227_coach_trainer_year": { credit: 1, units: 0 },

  // ========= 3.3 Memberships / honors / scholarships (cap 10) =========
  "331_learned_full": { credit: 2, units: 0 },
  "331_learned_assoc": { credit: 1, units: 0 },
  "331_honor_society": { credit: 1, units: 0 },
  "331_scientific_soc": { credit: 1, units: 0 },
  "331_prof_officer": { credit: 1, units: 0 },
  "331_prof_member": { credit: 0.5, units: 0 },
  "332_scholar_intl_deg": { credit: 5, units: 0 },
  "332_scholar_intl_nondeg": { credit: 4, units: 0 },
  "332_scholar_nat_deg": { credit: 3, units: 0 },
  "332_scholar_nat_nondeg": { credit: 2, units: 0 },

  // ========= 3.4 Awards of distinction (cap 10) =========
  "341_award_international": { credit: 5, units: 0 },
  "341_award_national": { credit: 3, units: 0 },
  "341_award_local": { credit: 1, units: 0 },

  // ========= 3.5 Community outreach (cap 5) =========
  "351_service_project_year": { credit: 1, units: 0 },

  // ========= 3.6 Professional examinations (cap 10) =========
  "361_prof_exam_eng_medicine_law_teachers": { credit: 5, units: 0 },
  "361_prof_exam_marine_master_electrician_other": { credit: 2, units: 0 },
  "361_prof_exam_trade_skill": { credit: 1, units: 0 },
};

const defaultEval: EvalInput = {
  highestDegree: null,
  addlMasters: 0,
  addlBachelors: 0,
  addlCreditsUnits: 0,

  s21_stateHEIYears: 0,
  s22_otherInstYears: 0,
  s23_presidentYears: 0,
  s23_vicePresidentYears: 0,
  s23_deanDirectorSuperYears: 0,
  s23_principalSupervisorChairYears: 0,
  s24_engineerManagerYears: 0,
  s24_technicianYears: 0,
  s24_skilledWorkerYears: 0,
  s25_cooperatingTeacherYears: 0,
  s25_basicEdTeacherYears: 0,

  s3: defaultS3,
  s4: defaultS4,

  licensureA: 0,
  licensureB: 0,
  licensureC: 0,
};

type EvaluationRecord = {
  name: string;
  college: string;
  job: string;
  totals: { educational: number; experience: number; profDev: number; tech: number; overall: number };
  rank: string;
  rate: number;
  timestamp: string;
};

/* =========================================================
   SMALL UI PIECES
========================================================= */
function FloatingTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="sticky top-4 z-40 ml-auto w-fit rounded-full bg-white/70 backdrop-blur shadow-md ring-1 ring-black/5">
      <div className="flex items-center p-1">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cx(
                "px-4 py-1.5 text-sm rounded-full transition",
                isActive ? "bg-blue-600 text-white shadow" : "hover:bg-gray-100 text-gray-700"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategorySelect({
  value,
  onChange,
}: {
  value: "edu" | "exp" | "pd" | "tech";
  onChange: (v: "edu" | "exp" | "pd" | "tech") => void;
}) {
  return (
    <select
      className="w-full rounded-lg border p-2 bg-white shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
    >
      <option value="edu">1. Educational Qualifications</option>
      <option value="exp">2. Experience & Professional Services</option>
      <option value="pd">3. Professional Development, Achievement & Honors</option>
      <option value="tech">4. Technological Knowledge</option>
    </select>
  );
}
function EduSubSelect({
  value,
  onChange,
}: {
  value: "1.1" | "1.2" | "1.3";
  onChange: (v: "1.1" | "1.2" | "1.3") => void;
}) {
  return (
    <select
      className="rounded-md border p-1.5 bg-white text-sm shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
    >
      <option value="1.1">1.1 Highest Degree</option>
      <option value="1.2">1.2 Additional Degree</option>
      <option value="1.3">1.3 Additional Credits</option>
    </select>
  );
}
function ExpSubSelect({
  value,
  onChange,
}: {
  value: "2.1" | "2.2" | "2.3" | "2.4" | "2.5";
  onChange: (v: "2.1" | "2.2" | "2.3" | "2.4" | "2.5") => void;
}) {
  return (
    <select
      className="rounded-md border p-1.5 bg-white text-sm shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
    >
      <option value="2.1">2.1 Academic Service (State HEI)</option>
      <option value="2.2">2.2 Academic Service (Other/Private/Research)</option>
      <option value="2.3">2.3 Administrative Designation</option>
      <option value="2.4">2.4 Industrial/Agricultural/Technical</option>
      <option value="2.5">2.5 Other Teaching Experience</option>
    </select>
  );
}

/* ===== Hierarchical dropdown (3.x → 3.x.y) ===== */
type PDTreeKey =
  | "3.1" | "3.1.1" | "3.1.2" | "3.1.3" | "3.1.4"
  | "3.2" | "3.2.1" | "3.2.2"
  | "3.3" | "3.3.1" | "3.3.2"
  | "3.4"
  | "3.5" | "3.5.1"
  | "3.6" | "3.6.1";

function PDTreeDropdown({
  value,
  onChange,
}: {
  value: PDTreeKey;
  onChange: (k: PDTreeKey) => void;
}) {
  const [open, setOpen] = useState(false);

  const items: Array<{
    key: PDTreeKey;
    label: string;
    children?: Array<{ key: PDTreeKey; label: string }>;
  }> = [
    {
      key: "3.1",
      label: "3.1 Innovations / Inventions / Creative Works",
      children: [
        { key: "3.1.1", label: "3.1.1 Inventions / Discoveries / Creative Works" },
        { key: "3.1.2", label: "3.1.2 Published Book — Role × Level" },
        { key: "3.1.3", label: "3.1.3 Articles — Coverage × Role" },
        { key: "3.1.4", label: "3.1.4 Instructional Manual / AV" },
      ],
    },
    {
      key: "3.2",
      label: "3.2 Expert Services / Training / Participation",
      children: [
        { key: "3.2.1", label: "3.2.1 Training & Seminars" },
        { key: "3.2.2", label: "3.2.2 Expert services rendered" },
      ],
    },
    {
      key: "3.3",
      label: "3.3 Memberships / Scholarships",
      children: [
        { key: "3.3.1", label: "3.3.1 Professional organizations" },
        { key: "3.3.2", label: "3.3.2 Scholarship / Fellowship" },
      ],
    },
    { key: "3.4", label: "3.4 Awards of distinction" },
    {
      key: "3.5",
      label: "3.5 Community outreach",
      children: [{ key: "3.5.1", label: "3.5.1 Service-oriented projects (per year)" }],
    },
    {
      key: "3.6",
      label: "3.6 Professional examinations",
      children: [{ key: "3.6.1", label: "3.6.1 Relevant licensure/other exams" }],
    },
  ];

  const currentLabel =
    items.flatMap((p) => [p, ...(p.children ?? [])])
      .find((i) => i.key === value)?.label ?? "Select…";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm shadow-sm"
      >
        {currentLabel}
        <svg viewBox="0 0 20 20" className="h-4 w-4 opacity-70"><path d="M5 7l5 5 5-5" fill="currentColor" /></svg>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[360px] rounded-lg border bg-white p-2 shadow-xl"
          onMouseLeave={() => setOpen(false)}
        >
          {items.map((parent) => (
            <div key={parent.key} className="px-1 py-1">
              <button
                className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 font-medium"
                onClick={() => {
                  onChange(parent.key);
                  setOpen(false);
                }}
              >
                {parent.label}
              </button>
              {parent.children && (
                <div className="ml-4 mt-1 space-y-1 border-l pl-3">
                  {parent.children.map((child) => (
                    <button
                      key={child.key}
                      className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-gray-100"
                      onClick={() => {
                        onChange(child.key);
                        setOpen(false);
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */
export default function Page() {
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [activeApplicant, setActiveApplicant] = useState<typeof rows[0] | null>(null);
  const [tab, setTab] = useState<"blank" | "summary">("blank");
  const [form, setForm] = useState<EvalInput>(defaultEval);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);

  /* ================== COMPUTATIONS ================== */
  // 1. Educational — formulas match your sheet
  const s1_highest = useMemo(() => (form.highestDegree ? degreePoints[form.highestDegree] : 0), [form.highestDegree]);
  const s1_12 = (Number(form.addlMasters) || 0) * 4 + (Number(form.addlBachelors) || 0) * 3;
  const s1_13_unitsBuckets = Math.floor((Number(form.addlCreditsUnits) || 0) / 3);
  const s1_13 = cap(s1_13_unitsBuckets, 10);
  const s1_total = cap(s1_highest + s1_12 + s1_13, 85); // cap 85 overall

  // 2. Experience & Professional Services — detailed + cap 25
  const s2_21 = (form.s21_stateHEIYears || 0) * 1.0;
  const s2_22 = (form.s22_otherInstYears || 0) * 0.75;
  const s2_23 =
    (form.s23_presidentYears || 0) * 3.0 +
    (form.s23_vicePresidentYears || 0) * 2.5 +
    (form.s23_deanDirectorSuperYears || 0) * 2.0 +
    (form.s23_principalSupervisorChairYears || 0) * 1.0;
  const s2_24 =
    (form.s24_engineerManagerYears || 0) * 1.5 +
    (form.s24_technicianYears || 0) * 1.0 +
    (form.s24_skilledWorkerYears || 0) * 0.5;
  const s2_25 =
    (form.s25_cooperatingTeacherYears || 0) * 1.5 +
    (form.s25_basicEdTeacherYears || 0) * 1.0;
  const s2_total = cap(s2_21 + s2_22 + s2_23 + s2_24 + s2_25, 25);

  // 3. Professional Development — caps per sub + cap 90 total
  const s3_keys_31 = [
    // 3.1.1
    "311A_patented_intl","311A_patented_nat","311A_patented_inst",
    "311A_pending_intl","311A_pending_nat","311A_pending_inst",
    "311B_originality_impact","311B_dissemination",
    "311C_acceptability","311C_recognition","311C_relevance","311C_documentation",

    // 3.1.2
    "312_single_tertiary","312_single_high","312_single_elem",
    "312_co_tertiary","312_co_high","312_co_elem",
    "312_rev_tertiary","312_rev_high","312_rev_elem",
    "312_trans_tertiary","312_trans_high","312_trans_elem",
    "312_edit_tertiary","312_edit_high","312_edit_elem",
    "312_comp_tertiary","312_comp_high","312_comp_elem",

    // 3.1.3
    "313_intl_single","313_intl_co","313_nat_single","313_nat_co","313_local_single","313_local_co",

    // 3.1.4
    "314_single_maker","314_co_maker",
  ];
  const s3_keys_321 = [
    "321_training_international","321_training_national","321_training_local",
    "3212_industrial_hours",
    "3213_conf_international","3213_conf_national","3213_conf_local",
  ];
  const s3_keys_322 = [
    "3221_consult_intl","3221_consult_nat","3221_consult_local",
    "3222_lecturer_intl","3222_lecturer_nat","3222_lecturer_local",
    "3223_adviser_doctoral","3223_adviser_masteral","3223_adviser_undergrad",
    "3224_prc_csc_examiner","3225_accreditation_work","3226_trade_skills_cert","3227_coach_trainer_year",
  ];
  const s3_keys_33 = [
    "331_learned_full","331_learned_assoc","331_honor_society","331_scientific_soc","331_prof_officer","331_prof_member",
    "332_scholar_intl_deg","332_scholar_intl_nondeg","332_scholar_nat_deg","332_scholar_nat_nondeg",
  ];
  const s3_keys_34 = ["341_award_international","341_award_national","341_award_local"];
  const s3_keys_35 = ["351_service_project_year"];
  const s3_keys_36 = [
    "361_prof_exam_eng_medicine_law_teachers",
    "361_prof_exam_marine_master_electrician_other",
    "361_prof_exam_trade_skill",
  ];

  const s3_31 = cap(sumLines(form.s3, s3_keys_31), S3_CAPS["3.1"]);
  const s3_321 = Math.min(sumLines(form.s3, s3_keys_321), 10); // inner cap
  const s3_322 = Math.min(sumLines(form.s3, s3_keys_322), 20); // inner cap
  const s3_32 = cap(s3_321 + s3_322, S3_CAPS["3.2"]);
  const s3_33 = cap(sumLines(form.s3, s3_keys_33), S3_CAPS["3.3"]);
  const s3_34 = cap(sumLines(form.s3, s3_keys_34), S3_CAPS["3.4"]);
  const s3_35 = cap(sumLines(form.s3, s3_keys_35), S3_CAPS["3.5"]);
  const s3_36 = cap(sumLines(form.s3, s3_keys_36), S3_CAPS["3.6"]);
  const s3_total = Math.min(s3_31 + s3_32 + s3_33 + s3_34 + s3_35 + s3_36, S3_TOTAL_CAP);

  // 4. Technological Knowledge — NEW structured rubric; cap 50
  const s4_41 = s4Sum(form.s4, ["411_word", "412_excel", "413_powerpoint"]);
  const s4_42 = s4Sum(form.s4, ["42_apps"]);
  const s4_43_raw = s4Sum(form.s4, ["43_international", "43_national", "43_local"]);
  const s4_43 = Math.min(s4_43_raw, 10); // inner cap per sheet
  const s4_44 = s4Sum(form.s4, ["44_originality", "44_acceptability", "44_relevance", "44_documentation"]);
  const s4_total = Math.min(s4_41 + s4_42 + s4_43 + s4_44, 50);

  const grandTotal = cap(s1_total + s2_total + s3_total + s4_total, 250);
  const { rank, rate } = computeRank(grandTotal);

  /* ================== ACTIONS ================== */
  function openEval(r: typeof rows[0]) {
    setActiveApplicant(r);
    setForm(defaultEval);
    setTab("blank");
    setOpen(true);
  }

  function saveEvaluation() {
    if (!activeApplicant) return;
    const entry: EvaluationRecord = {
      name: activeApplicant.name,
      college: activeApplicant.college,
      job: activeApplicant.job,
      totals: { educational: s1_total, experience: s2_total, profDev: s3_total, tech: s4_total, overall: grandTotal },
      rank,
      rate,
      timestamp: new Date().toISOString(),
    };
    setEvaluations((prev) => {
      const i = prev.findIndex((p) => p.name === entry.name && p.job === entry.job);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = entry;
        return next;
      }
      return [...prev, entry];
    });
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Header + List Summary button */}
      <div className="flex items-start justify-between">
        <PageHeader title="Evaluation" subtitle="Review and evaluate applicants" />
        <button
          onClick={() => setShowList(true)}
          className="h-10 min-w-[140px] self-start rounded-lg bg-blue-900 px-4 text-white shadow hover:brightness-110"
          title="View evaluated applicants"
        >
          List Summary
          {evaluations.length > 0 && (
            <span className="ml-2 rounded-md bg-white/20 px-2 py-0.5 text-xs">{evaluations.length}</span>
          )}
        </button>
      </div>

      {/* Applicants table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Applicant Name</th>
              <th>College</th>
              <th>Job Title</th>
              <th>Files</th>
              <th>Stage</th>
              <th className="w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="p-3">{r.name}</td>
                <td><Badge tone="gray">{r.college}</Badge></td>
                <td>{r.job}</td>
                <td>{r.files === "Complete" ? <Badge tone="green">Complete</Badge> : <Badge tone="red">Partial</Badge>}</td>
                <td>
                  {r.stage === "Conducted" && <Badge tone="blue">Conducted</Badge>}
                  {r.stage === "Evaluating" && <Badge tone="yellow">Evaluating</Badge>}
                  {r.stage === "Pending" && <Badge tone="gray">Pending</Badge>}
                </td>
                <td className="pr-3 text-right">
                  <button onClick={() => openEval(r)} className="rounded-md bg-blue-900 text-white px-3 py-1">Evaluate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL-SCREEN: EVALUATION */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 bg-white shadow-xl flex flex-col w-full h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="text-lg font-semibold">Evaluate Applicant</div>
                <div className="text-xs text-gray-500">
                  {activeApplicant?.name} • {activeApplicant?.college} • {activeApplicant?.job}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-black">✕</button>
            </div>

            {/* Floating tabs */}
            <div className="px-4 pt-3">
              <FloatingTabs
                tabs={[
                  { key: "blank", label: "Blank Form" },
                  { key: "summary", label: "Point Summary" },
                ]}
                active={tab}
                onChange={(k) => setTab(k as "blank" | "summary")}
              />
            </div>

            {/* Content */}
            <FormBody
              tab={tab}
              form={form}
              setForm={setForm}
              s1_total={s1_total}
              s2_total={s2_total}
              s3_total={s3_total}
              s4_total={s4_total}
              grandTotal={grandTotal}
              rank={rank}
              rate={rate}
              saveEvaluation={saveEvaluation}
              applicantName={activeApplicant?.name ?? "—"}
              s2_parts={{ s2_21, s2_22, s2_23, s2_24, s2_25 }}
              s3_parts={{ s3_31, s3_32, s3_33, s3_34, s3_35, s3_36 }}
              s4_parts={{ s4_41, s4_42, s4_43, s4_44, s4_total }}
            />

            <div className="border-t p-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">Total (live): <span className="font-semibold">{grandTotal.toFixed(2)}</span></div>
              <div className="flex gap-2">
                <button onClick={() => setTab("blank")} className="rounded-md border px-3 py-1">Blank Form</button>
                <button onClick={() => setTab("summary")} className="rounded-md border px-3 py-1">Point Summary</button>
                <button onClick={() => setOpen(false)} className="rounded-md bg-gray-800 text-white px-3 py-1">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN: LIST SUMMARY */}
      {showList && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowList(false)} />
          <div className="absolute inset-0 bg-white shadow-xl flex flex-col w-full h-full">
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-lg font-semibold">List Summary</div>
              <button onClick={() => setShowList(false)} className="text-gray-600 hover:text-black">✕</button>
            </div>

            <div className="px-4 pt-3">
              <div className="sticky top-4 z-40 ml-auto w-fit rounded-full bg-white/70 backdrop-blur shadow-md ring-1 ring-black/5 px-4 py-1.5 text-sm">
                Total evaluated: <span className="font-semibold">{evaluations.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left sticky top-0">
                  <tr>
                    <th className="p-2">Name</th>
                    <th>College</th>
                    <th>Job</th>
                    <th>Total</th>
                    <th>Rank</th>
                    <th>Rate</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations
                    .slice()
                    .sort((a, b) => b.totals.overall - a.totals.overall)
                    .map((e) => (
                      <tr key={`${e.name}-${e.job}`} className="border-t">
                        <td className="p-2">{e.name}</td>
                        <td>{e.college}</td>
                        <td>{e.job}</td>
                        <td className="font-medium">{e.totals.overall.toFixed(0)}</td>
                        <td><Badge tone="blue">{e.rank}</Badge></td>
                        <td>₱ {e.rate.toFixed(2)}</td>
                        <td className="text-xs text-gray-500">{new Date(e.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  {evaluations.length === 0 && (
                    <tr>
                      <td className="p-2 text-gray-500" colSpan={7}>No evaluations yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t p-3 text-sm text-gray-500">
              <button
                onClick={() => setShowList(false)}
                className="rounded-md bg-gray-800 text-white px-3 py-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FORM BODY (ALL SECTIONS)
========================================================= */
function FormBody(props: {
  tab: "blank" | "summary";
  form: EvalInput;
  setForm: React.Dispatch<React.SetStateAction<EvalInput>>;
  s1_total: number; s2_total: number; s3_total: number; s4_total: number; grandTotal: number;
  rank: string; rate: number;
  saveEvaluation: () => void;
  applicantName: string;
  s2_parts: { s2_21: number; s2_22: number; s2_23: number; s2_24: number; s2_25: number };
  s3_parts: { s3_31: number; s3_32: number; s3_33: number; s3_34: number; s3_35: number; s3_36: number };
  s4_parts: { s4_41: number; s4_42: number; s4_43: number; s4_44: number; s4_total: number };
}) {
  const {
    tab,
    form,
    setForm,
    s1_total,
    s2_total,
    s3_total,
    s4_total,
    grandTotal,
    rank,
    rate,
    saveEvaluation,
    applicantName,
    s2_parts,
    s3_parts,
    s4_parts,
  } = props;

  if (tab === "summary") {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Point Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>1. Educational Qualifications</div><div className="font-semibold">{s1_total.toFixed(2)} / 85</div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>2. Experience & Professional Services</div><div className="font-semibold">{s2_total.toFixed(2)} / 25</div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>3. Prof Dev, Achievement & Honors</div><div className="font-semibold">{s3_total.toFixed(2)} / 90</div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div>4. Technological Knowledge</div><div className="font-semibold">{s4_total.toFixed(2)} / 50</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-lg font-semibold">Total</div>
            <div className="text-lg font-semibold">{grandTotal.toFixed(2)} / 250</div>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">Re-Ranking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Accorded Rank</div>
              <div className="text-lg font-semibold">{rank}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Rate / hour (₱)</div>
              <div className="text-lg font-semibold">₱ {rate.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Evaluation Date</div>
              <div className="text-lg font-semibold">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={saveEvaluation} className="rounded-md bg-blue-900 text-white px-4 py-2">
              Save to List Summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [category, setCategory] = useState<"edu" | "exp" | "pd" | "tech">("edu");
  const [eduSub, setEduSub] = useState<"1.1" | "1.2" | "1.3">("1.1");
  const [expSub, setExpSub] = useState<"2.1" | "2.2" | "2.3" | "2.4" | "2.5">("2.1");
  const [pdSub, setPdSub] = useState<PDTreeKey>("3.1");

  const units = Number(form.addlCreditsUnits) || 0;
  const threeUnitBuckets = Math.floor(units / 3);
  const creditedPoints = Math.min(threeUnitBuckets, 10);

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] h-full">
        <aside className="border-r p-4 space-y-3 bg-gray-50/60">
          <div className="text-xs text-gray-500 mb-1">Applicant</div>
          <div className="rounded-full bg-blue-50 text-blue-900 px-3 py-1 inline-block font-medium">
            {applicantName}
          </div>

          <div className="pt-3">
            <div className="mb-1 text-xs text-gray-500">Evaluate category</div>
            <CategorySelect value={category} onChange={setCategory} />
          </div>
        </aside>

        <main className="overflow-y-auto p-4">
          {/* ================= 1. EDUCATIONAL ================= */}
          {category === "edu" && (
            <section className="rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 text-blue-900 px-3 py-1 text-sm font-semibold">
                    1. Educational Qualifications
                  </span>
                  <span className="text-xs text-gray-500">(cap 85)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Go to</span>
                  <EduSubSelect value={eduSub} onChange={setEduSub} />
                </div>
              </div>

              {/* 1.1 Highest Degree */}
              {eduSub === "1.1" && (
                <div className="p-4">
                  <div className="rounded-lg border overflow-hidden">
                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                      <div className="font-medium">1.1 Highest relevant academic Degree or educational attainment with the following maximum points credits</div>
                      <div className="text-xs text-gray-500">1 = yes, 0 = no</div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 text-left">
                        <tr>
                          <th className="p-2">Highest Degree</th>
                          <th className="p-2 w-24">1/0</th>
                          <th className="p-2 w-24">Points</th>
                          <th className="p-2 w-28"># × Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { k: "PhD", lbl: "1.1.1 Doctorate Degree", pts: 85 },
                          { k: "Masters", lbl: "1.1.2 Master’s Degree", pts: 65 },
                          { k: "LLB_MD", lbl: "1.1.3 LLB and MD", pts: 65 },
                          { k: "DiplomaAboveBacc", lbl: "1.1.4 Diploma course (above bachelor’s degree)", pts: 55 },
                          { k: "Bacc4", lbl: "1.1.5 Bachelor’s Degree (4 years)", pts: 45 },
                          { k: "Bacc5", lbl: " a. 5 year course", pts: 50 },
                          { k: "Bacc6", lbl: " b. 6 year course", pts: 55 },
                          { k: "Other", lbl: " c. Others please specify", pts: 0 },
                          { k: "Special3yr", lbl: "1.1.6 Special Courses – 3-year post secondary course", pts: 30 },
                          { k: "Special2yr", lbl: " * 2-year post secondary course", pts: 25 },
                        ].map((row) => {
                          const selected = form.highestDegree === (row.k as any);
                          return (
                            <tr key={row.k as string} className="border-t">
                              <td className="p-2">{row.lbl}</td>
                              <td className="p-2">
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="highestDegree"
                                    checked={selected}
                                    onChange={() => setForm((f) => ({ ...f, highestDegree: row.k as any }))}
                                  />
                                  <span className="text-xs">{selected ? "1" : "0"}</span>
                                </label>
                              </td>
                              <td className="p-2">{row.pts}</td>
                              <td className="p-2">{selected ? row.pts : 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="mr-2 text-sm">Sub-Category Total:</span>
                    <input className="w-28 rounded-md border bg-yellow-50 p-1 text-right" readOnly value={((form.highestDegree && degreePoints[form.highestDegree]) || 0).toFixed(0)} />
                  </div>
                </div>
              )}

              {/* 1.2 Additional equivalent and relevant degree */}
              {eduSub === "1.2" && (
                <div className="p-4">
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 font-medium">1.2 Additional equivalent and relevant degree earned</div>
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 text-left">
                        <tr>
                          <th className="p-2">Additional Degree</th>
                          <th className="p-2 w-40"># of Degree</th>
                          <th className="p-2 w-28">Credit Points</th>
                          <th className="p-2 w-28"># × Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">1.2.1 Additional Master’s degree</td>
                          <td className="p-2"><input type="number" min={0} className="w-24 rounded-md border p-1" value={form.addlMasters} onChange={(e)=>setForm(f=>({...f,addlMasters:Number(e.target.value)}))} /></td>
                          <td className="p-2">4</td>
                          <td className="p-2">{(Number(form.addlMasters) || 0) * 4}</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">1.2.2 Additional Bachelor’s degree</td>
                          <td className="p-2"><input type="number" min={0} className="w-24 rounded-md border p-1" value={form.addlBachelors} onChange={(e)=>setForm(f=>({...f,addlBachelors:Number(e.target.value)}))} /></td>
                          <td className="p-2">3</td>
                          <td className="p-2">{(Number(form.addlBachelors) || 0) * 3}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="mr-2 text-sm">Sub-Category Total:</span>
                    <input className="w-28 rounded-md border bg-yellow-50 p-1 text-right" readOnly value={((Number(form.addlMasters)||0)*4 + (Number(form.addlBachelors)||0)*3).toFixed(0)} />
                  </div>
                </div>
              )}

              {/* 1.3 Additional credits earned */}
              {eduSub === "1.3" && (
                <div className="p-4">
                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 font-medium">1.3 Additional credits earned (maximum of 10 pts.)</div>
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50 text-left">
                        <tr>
                          <th className="p-2">Additional Degree</th>
                          <th className="p-2 w-40"># of 3 Units Earned</th>
                          <th className="p-2 w-32">Credited Points</th>
                          <th className="p-2 w-28"># × Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">
                            1.3.1 For every 3 units earned toward a higher approved degree course: 1
                            <div className="mt-2 text-xs text-gray-500">Enter total units below (auto-computes).</div>
                            <div className="mt-1">
                              <label className="text-xs text-gray-600 mr-2">Total units:</label>
                              <input type="number" min={0} className="w-24 rounded-md border p-1" value={form.addlCreditsUnits} onChange={(e)=>setForm(f=>({...f,addlCreditsUnits:Number(e.target.value)}))}/>
                            </div>
                          </td>
                          <td className="p-2">{threeUnitBuckets}</td>
                          <td className="p-2">{creditedPoints}</td>
                          <td className="p-2">{creditedPoints}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 text-right">
                    <span className="mr-2 text-sm">Sub-Category Total:</span>
                    <input className="w-28 rounded-md border bg-yellow-50 p-1 text-right" readOnly value={creditedPoints.toFixed(0)} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
                <div className="text-sm text-gray-600">Category Total (cap 85)</div>
                <div className="text-base font-semibold">{s1_total.toFixed(2)}</div>
              </div>
            </section>
          )}

          {/* ================= 2. EXPERIENCE ================= */}
          {category === "exp" && (
            <section className="rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 text-blue-900 px-3 py-1 text-sm font-semibold">
                    2. Experience & Professional Services
                  </span>
                  <span className="text-xs text-gray-500">(cap 25)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Go to</span>
                  <ExpSubSelect value={expSub} onChange={setExpSub} />
                </div>
              </div>

              {/* 2.1 */}
              {expSub === "2.1" && (
                <SubTable
                  title="2.1 For every year of full-time academic service in a state institution of higher learning"
                  rows={[{ label: "State SUC/CHED-supervised HEI / TESDA-supervised TEI", credit: 1, key: "s21_stateHEIYears" }]}
                  form={form}
                  setForm={setForm}
                />
              )}

              {/* 2.2 */}
              {expSub === "2.2" && (
                <SubTable
                  title="2.2 For every year of full-time academic service in other HEIs / private / public research institutions"
                  rows={[{ label: "Other HEIs / private / research institutions", credit: 0.75, key: "s22_otherInstYears" }]}
                  form={form}
                  setForm={setForm}
                />
              )}

              {/* 2.3 */}
              {expSub === "2.3" && (
                <SubTable
                  title="2.3 For every year of administrative designation as"
                  rows={[
                    { label: "a. President", credit: 3.0, key: "s23_presidentYears" },
                    { label: "b. Vice-President (incl. Board Secretary)", credit: 2.5, key: "s23_vicePresidentYears" },
                    { label: "c. Dean / Director / School Superintendent", credit: 2.0, key: "s23_deanDirectorSuperYears" },
                    { label: "d. Principal / Supervisor / Department Chair / Head of Unit", credit: 1.0, key: "s23_principalSupervisorChairYears" },
                  ]}
                  form={form}
                  setForm={setForm}
                />
              )}

              {/* 2.4 */}
              {expSub === "2.4" && (
                <SubTable
                  title="2.4 For every year of full-time industrial / agricultural / technical experience as"
                  rows={[
                    { label: "a. Engineer / Plant / Farm Manager", credit: 1.5, key: "s24_engineerManagerYears" },
                    { label: "b. Technician", credit: 1.0, key: "s24_technicianYears" },
                    { label: "c. Skilled Worker", credit: 0.5, key: "s24_skilledWorkerYears" },
                  ]}
                  form={form}
                  setForm={setForm}
                />
              )}

              {/* 2.5 */}
              {expSub === "2.5" && (
                <SubTable
                  title="2.5 For every year of experience as"
                  rows={[
                    { label: "a. Cooperating Teacher", credit: 1.5, key: "s25_cooperatingTeacherYears" },
                    { label: "b. Basic Education Teacher", credit: 1.0, key: "s25_basicEdTeacherYears" },
                  ]}
                  form={form}
                  setForm={setForm}
                />
              )}

              <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
                <div className="text-sm text-gray-600">Category Total (cap 25)</div>
                <div className="text-base font-semibold">{s2_total.toFixed(2)}</div>
              </div>
            </section>
          )}

          {/* ================= 3. PROFESSIONAL DEV ================= */}
          {category === "pd" && (
            <Section3PD
              s3={form.s3}
              setS3={(upd) => setForm((f) => ({ ...f, s3: { ...f.s3, ...upd } }))}
              pdSub={pdSub}
              setPdSub={setPdSub}
              s3_parts={s3_parts}
              s3_total={s3_total}
            />
          )}

          {/* ================= 4. TECHNOLOGICAL KNOWLEDGE (NEW) ================= */}
          {category === "tech" && (
            <TechSection
              store={form.s4}
              setStore={(patch) => setForm((f) => ({ ...f, s4: { ...f.s4, ...patch } as S4Store }))}
              s4_41={s4_parts.s4_41}
              s4_42={s4_parts.s4_42}
              s4_43={s4_parts.s4_43}
              s4_44={s4_parts.s4_44}
              s4_total={s4_parts.s4_total}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   REUSABLE SUBTABLE FOR SECTION 2
========================================================= */
function SubTable({
  title,
  rows,
  form,
  setForm,
}: {
  title: string;
  rows: { label: string; credit: number; key: keyof EvalInput }[];
  form: EvalInput;
  setForm: React.Dispatch<React.SetStateAction<EvalInput>>;
}) {
  return (
    <div className="p-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 font-medium">{title}</div>
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-left">
            <tr>
              <th className="p-2">Description</th>
              <th className="p-2 w-28">Credit Score</th>
              <th className="p-2 w-40"># of Years / Units</th>
              <th className="p-2 w-32">Credited Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const val = Number((form as any)[r.key]) || 0;
              const pts = val * r.credit;
              return (
                <tr key={String(r.key)} className="border-t">
                  <td className="p-2">{r.label}</td>
                  <td className="p-2">{r.credit}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      className="w-24 rounded-md border p-1"
                      value={val}
                      onChange={(e) => setForm((f) => ({ ...f, [r.key]: Number(e.target.value) } as any))}
                    />
                  </td>
                  <td className="p-2">{pts.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   SECTION 3 (PD/AH) TABLES - GENERIC TABLE
========================================================= */
function S3Table({
  title, capValue, rows, store, onChange,
}: {
  title: string;
  capValue?: number;
  rows: { id: string; label: string }[];
  store: S3Store;
  onChange: (next: S3Store) => void;
}) {
  const subTotal = rows.reduce((a, r) => a + lineTotal(store[r.id]), 0);
  const capped = typeof capValue === "number" ? Math.min(subTotal, capValue) : subTotal;

  const setCell = (id: string, patch: Partial<S3LineItem>) => {
    const cur = store[id] || { credit: 0, units: 0 };
    onChange({ [id]: { ...cur, ...patch } });
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-600">
          Sub-Category Total: <span className="font-semibold">{capped.toFixed(2)}</span>
          {typeof capValue === "number" && <span className="ml-2 text-[10px] text-gray-500">(cap {capValue})</span>}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">Item</th>
            <th className="p-2 w-28">Credit / Unit</th>
            <th className="p-2 w-28"># of Units</th>
            <th className="p-2 w-28">Credit × Units</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const li = store[r.id] || { credit: 0, units: 0 };
            return (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.label}</td>
                <td className="p-2">
                  <input
                    type="number" step="0.01"
                    className="w-24 rounded-md border p-1"
                    value={li.credit}
                    onChange={(e) => setCell(r.id, { credit: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number" min={0}
                    className="w-24 rounded-md border p-1"
                    value={li.units}
                    onChange={(e) => setCell(r.id, { units: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">{(lineTotal(li)).toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   SECTION 3 (PD/AH) TABLES - CUSTOM 3.1 RENDERERS
========================================================= */
function S3MiniRow({
  label, id, store, onChange,
}: { label: string; id: string; store: S3Store; onChange: (next: S3Store) => void }) {
  const li = store[id] || { credit: 0, units: 0 };
  const setCell = (patch: Partial<S3LineItem>) =>
    onChange({ [id]: { ...(store[id] || { credit: 0, units: 0 }), ...patch } });

  return (
    <tr className="border-t">
      <td className="p-2">{label}</td>
      <td className="p-2 w-28">
        <input type="number" step="0.01" className="w-24 rounded-md border p-1"
               value={li.credit} onChange={e => setCell({ credit: Number(e.target.value) })}/>
      </td>
      <td className="p-2 w-28">
        <input type="number" min={0} className="w-24 rounded-md border p-1"
               value={li.units} onChange={e => setCell({ units: Number(e.target.value) })}/>
      </td>
      <td className="p-2 w-28">{(li.credit * li.units).toFixed(2)}</td>
    </tr>
  );
}

function Section311_Inventions({
  store, onChange,
}: { store: S3Store; onChange: (next: S3Store) => void }) {
  const rowsA = [
    { label: "1. If patented – * an international scale: 7", id: "311A_patented_intl" },
    { label: "          * a national scale: 5", id: "311A_patented_nat" },
    { label: "          * institutional level: 2", id: "311A_patented_inst" },
    { label: "2. If patent pending – * an international scale: 7", id: "311A_pending_intl" },
    { label: "          * a national scale: 5", id: "311A_pending_nat" },
    { label: "          * institutional level: 2", id: "311A_pending_inst" },
  ];
  const rowsB = [
    { label: "1. Originality, Educational impact (60% of 7 = 4.2)", id: "311B_originality_impact" },
    { label: "2. Evidence of dissemination (40% of 7 = 2.8)", id: "311B_dissemination" },
  ];
  const rowsC = [
    { label: "1. Acceptability (25% of 7 = 1.75)", id: "311C_acceptability" },
    { label: "2. Recognition (25% of 7 = 1.75)", id: "311C_recognition" },
    { label: "3. Relevance & value (25% of 7 = 1.75)", id: "311C_relevance" },
    { label: "4. Documentation & evidence (25% of 7 = 1.75)", id: "311C_documentation" },
  ];

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 font-medium">3.1.1 For every cost and time-saving innovation, patented invention and creative work</div>
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">A. Inventions</th><th className="p-2 w-28">Unit Score</th>
            <th className="p-2 w-28"># of Units</th><th className="p-2 w-28">Score × Unit</th>
          </tr>
        </thead>
        <tbody>
          {rowsA.map(r => <S3MiniRow key={r.id} label={r.label} id={r.id} store={store} onChange={onChange} />)}
        </tbody>
      </table>

      <table className="w-full text-sm mt-2">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">B. Discoveries</th><th className="p-2 w-28">Unit Score</th>
            <th className="p-2 w-28"># of Units</th><th className="p-2 w-28">Score × Unit</th>
          </tr>
        </thead>
        <tbody>
          {rowsB.map(r => <S3MiniRow key={r.id} label={r.label} id={r.id} store={store} onChange={onChange} />)}
        </tbody>
      </table>

      <table className="w-full text-sm mt-2">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">C. Creative work has to satisfy one or more of the following criteria</th>
            <th className="p-2 w-28">Unit Score</th><th className="p-2 w-28"># of Units</th>
            <th className="p-2 w-28">Score × Unit</th>
          </tr>
        </thead>
        <tbody>
          {rowsC.map(r => <S3MiniRow key={r.id} label={r.label} id={r.id} store={store} onChange={onChange} />)}
        </tbody>
      </table>
    </div>
  );
}

function Section312_BooksGrid({
  store, onChange,
}: { store: S3Store; onChange: (next: S3Store) => void }) {
  const block = (title: string, rows: {label: string; id: string}[]) => (
    <>
      <tr><td className="p-2 font-medium bg-gray-50" colSpan={4}>{title}</td></tr>
      {rows.map(r => <S3MiniRow key={r.id} label={r.label} id={r.id} store={store} onChange={onChange} />)}
    </>
  );
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 font-medium">3.1.2 Published book (last 10 yrs)</div>
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">Role / Level</th><th className="p-2 w-28">Points per unit</th>
            <th className="p-2 w-28"># of Units</th><th className="p-2 w-28">Points × Units</th>
          </tr>
        </thead>
        <tbody>
          {block("a. Single Author", [
            { label: "1. Tertiary", id: "312_single_tertiary" },
            { label: "2. High School", id: "312_single_high" },
            { label: "3. Elementary", id: "312_single_elem" },
          ])}
          {block("b. Co-author", [
            { label: "1. Tertiary", id: "312_co_tertiary" },
            { label: "2. High School", id: "312_co_high" },
            { label: "3. Elementary", id: "312_co_elem" },
          ])}
          {block("c. Reviewer", [
            { label: "1. Tertiary", id: "312_rev_tertiary" },
            { label: "2. High School", id: "312_rev_high" },
            { label: "3. Elementary", id: "312_rev_elem" },
          ])}
          {block("d. Translator", [
            { label: "1. Tertiary", id: "312_trans_tertiary" },
            { label: "2. High School", id: "312_trans_high" },
            { label: "3. Elementary", id: "312_trans_elem" },
          ])}
          {block("e. Editor", [
            { label: "1. Tertiary", id: "312_edit_tertiary" },
            { label: "2. High School", id: "312_edit_high" },
            { label: "3. Elementary", id: "312_edit_elem" },
          ])}
          {block("f. Compiler", [
            { label: "1. Tertiary", id: "312_comp_tertiary" },
            { label: "2. High School", id: "312_comp_high" },
            { label: "3. Elementary", id: "312_comp_elem" },
          ])}
        </tbody>
      </table>
    </div>
  );
}

function Section313_Coverage({
  store, onChange,
}: { store: S3Store; onChange: (next: S3Store) => void }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 font-medium">
        3.1.3 Scholarly/technical/educational articles – Coverage and Role
      </div>
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">Coverage → Role</th><th className="p-2 w-28">Credit</th>
            <th className="p-2 w-28"># of Units</th><th className="p-2 w-28">Credit × Units</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="p-2 font-medium bg-gray-50" colSpan={4}>a. International: 5</td></tr>
          <S3MiniRow label="Single author" id="313_intl_single" store={store} onChange={onChange}/>
          <S3MiniRow label="Co-author" id="313_intl_co" store={store} onChange={onChange}/>
          <tr><td className="p-2 font-medium bg-gray-50" colSpan={4}>b. National: 3</td></tr>
          <S3MiniRow label="Single author" id="313_nat_single" store={store} onChange={onChange}/>
          <S3MiniRow label="Co-author" id="313_nat_co" store={store} onChange={onChange}/>
          <tr><td className="p-2 font-medium bg-gray-50" colSpan={4}>c. Local: 2</td></tr>
          <S3MiniRow label="Single author" id="313_local_single" store={store} onChange={onChange}/>
          <S3MiniRow label="Co-author" id="313_local_co" store={store} onChange={onChange}/>
        </tbody>
      </table>
    </div>
  );
}

function Section314_Manual({
  store, onChange,
}: { store: S3Store; onChange: (next: S3Store) => void }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 font-medium">
        3.1.4 Instructional manual / audio-visual material developed & approved
      </div>
      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-left">
          <tr>
            <th className="p-2">Role</th><th className="p-2 w-28">Credit</th>
            <th className="p-2 w-28"># of Units</th><th className="p-2 w-28">Credit × Units</th>
          </tr>
        </thead>
        <tbody>
          <S3MiniRow label="a. Single author or maker" id="314_single_maker" store={store} onChange={onChange}/>
          <S3MiniRow label="b. Co-author / co-maker" id="314_co_maker" store={store} onChange={onChange}/>
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   SECTION 3 CONTAINER
========================================================= */
function Section3PD({
  s3, setS3, pdSub, setPdSub, s3_parts, s3_total,
}: {
  s3: S3Store;
  setS3: (upd: S3Store) => void;
  pdSub: PDTreeKey;
  setPdSub: (k: PDTreeKey) => void;
  s3_parts: { s3_31: number; s3_32: number; s3_33: number; s3_34: number; s3_35: number; s3_36: number };
  s3_total: number;
}) {
  const change = (patch: S3Store) => setS3(patch);

  return (
    <section className="rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 text-blue-900 px-3 py-1 text-sm font-semibold">
            3. Professional Development, Achievement & Honors
          </span>
          <span className="text-xs text-gray-500">(cap 90)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Go to</span>
          <PDTreeDropdown value={pdSub} onChange={setPdSub} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 3.1 group – matches your sheet layout */}
        {(pdSub === "3.1" || pdSub === "3.1.1") && (
          <Section311_Inventions store={s3} onChange={change} />
        )}

        {(pdSub === "3.1" || pdSub === "3.1.2") && (
          <Section312_BooksGrid store={s3} onChange={change} />
        )}

        {(pdSub === "3.1" || pdSub === "3.1.3") && (
          <Section313_Coverage store={s3} onChange={change} />
        )}

        {(pdSub === "3.1" || pdSub === "3.1.4") && (
          <Section314_Manual store={s3} onChange={change} />
        )}

        {(pdSub === "3.1" || pdSub.startsWith("3.1.")) && (
          <div className="text-right text-sm text-gray-600">
            Sub-Total for 3.1 (cap 30): <b>{s3_parts.s3_31.toFixed(2)}</b>
          </div>
        )}

        {/* 3.2 group */}
        {(pdSub === "3.2" || pdSub === "3.2.1") && (
          <S3Table
            title="3.2.1 Training & Seminars (cap 10)"
            capValue={10}
            store={s3}
            onChange={change}
            rows={[
              { id: "321_training_international", label: "Training – International (5)" },
              { id: "321_training_national", label: "Training – National (3)" },
              { id: "321_training_local", label: "Training – Local (2)" },
              { id: "3212_industrial_hours", label: "Industrial/Agro/Fishery training – points per hour (editable credit)" },
              { id: "3213_conf_international", label: "Conference participation – International (3)" },
              { id: "3213_conf_national", label: "Conference participation – National (2)" },
              { id: "3213_conf_local", label: "Conference participation – Local (1)" },
            ]}
          />
        )}
        {(pdSub === "3.2" || pdSub === "3.2.2") && (
          <S3Table
            title="3.2.2 Expert Services Rendered (cap 20)"
            capValue={20}
            store={s3}
            onChange={change}
            rows={[
              { id: "3221_consult_intl", label: "Consultant/Expert – International (7)" },
              { id: "3221_consult_nat", label: "Consultant/Expert – National (5)" },
              { id: "3221_consult_local", label: "Consultant/Expert – Local (2)" },
              { id: "3222_lecturer_intl", label: "Coordinator/Lecturer/Resource – International (5)" },
              { id: "3222_lecturer_nat", label: "Coordinator/Lecturer/Resource – National (3)" },
              { id: "3222_lecturer_local", label: "Coordinator/Lecturer/Resource – Local (2)" },
              { id: "3223_adviser_doctoral", label: "Adviser – Doctoral (1)" },
              { id: "3223_adviser_masteral", label: "Adviser – Masteral (0.5)" },
              { id: "3223_adviser_undergrad", label: "Adviser – Undergraduate (0.25)" },
              { id: "3224_prc_csc_examiner", label: "PRC/CSC Reviewer/Examiner (1)" },
              { id: "3225_accreditation_work", label: "Accreditation/Board/Committee (1)" },
              { id: "3226_trade_skills_cert", label: "Trade skills certification (1)" },
              { id: "3227_coach_trainer_year", label: "Coach/Trainer/Adviser per year (1)" },
            ]}
          />
        )}
        {(pdSub === "3.2" || pdSub.startsWith("3.2.")) && (
          <div className="text-right text-sm text-gray-600">
            Sub-Total (cap 30): <b>{s3_parts.s3_32.toFixed(2)}</b>
          </div>
        )}

        {/* 3.3 group */}
        {(pdSub === "3.3" || pdSub === "3.3.1") && (
          <S3Table
            title="3.3.1 Professional Organizations"
            capValue={S3_CAPS["3.3"]}
            store={s3}
            onChange={change}
            rows={[
              { id: "331_learned_full", label: "Learned Society – Full member (2)" },
              { id: "331_learned_assoc", label: "Learned Society – Associate member (1)" },
              { id: "331_honor_society", label: "Honor Society (1)" },
              { id: "331_scientific_soc", label: "Scientific Society (1)" },
              { id: "331_prof_officer", label: "Professional Organization – Officer (1)" },
              { id: "331_prof_member", label: "Professional Organization – Member (0.5)" },
            ]}
          />
        )}
        {(pdSub === "3.3" || pdSub === "3.3.2") && (
          <S3Table
            title="3.3.2 Scholarship / Fellowship"
            capValue={S3_CAPS["3.3"]}
            store={s3}
            onChange={change}
            rows={[
              { id: "332_scholar_intl_deg", label: "International (Degree) (5)" },
              { id: "332_scholar_intl_nondeg", label: "International (Non-Degree) (4)" },
              { id: "332_scholar_nat_deg", label: "National (Degree) (3)" },
              { id: "332_scholar_nat_nondeg", label: "National (Non-Degree) (2)" },
            ]}
          />
        )}
        {(pdSub === "3.3" || pdSub.startsWith("3.3.")) && (
          <div className="text-right text-sm text-gray-600">
            Sub-Total (cap 10): <b>{s3_parts.s3_33.toFixed(2)}</b>
          </div>
        )}

        {/* 3.4 */}
        {pdSub === "3.4" && (
          <>
            <S3Table
              title="3.4 Awards of Distinction"
              capValue={S3_CAPS["3.4"]}
              store={s3}
              onChange={change}
              rows={[
                { id: "341_award_international", label: "International (5)" },
                { id: "341_award_national", label: "National/Regional (3)" },
                { id: "341_award_local", label: "Local (1)" },
              ]}
            />
            <div className="text-right text-sm text-gray-600">Sub-Total (cap 10): <b>{s3_parts.s3_34.toFixed(2)}</b></div>
          </>
        )}

        {/* 3.5 */}
        {(pdSub === "3.5" || pdSub === "3.5.1") && (
          <>
            <S3Table
              title="3.5.1 Community Outreach"
              capValue={S3_CAPS["3.5"]}
              store={s3}
              onChange={change}
              rows={[{ id: "351_service_project_year", label: "Service-oriented project – per year (1)" }]}
            />
            <div className="text-right text-sm text-gray-600">Sub-Total (cap 5): <b>{s3_parts.s3_35.toFixed(2)}</b></div>
          </>
        )}

        {/* 3.6 */}
        {(pdSub === "3.6" || pdSub === "3.6.1") && (
          <>
            <S3Table
              title="3.6.1 Professional Examinations"
              capValue={S3_CAPS["3.6"]}
              store={s3}
              onChange={change}
              rows={[
                { id: "361_prof_exam_eng_medicine_law_teachers", label: "Engineering/Accounting/Medicine/Law/Teachers etc. (5)" },
                { id: "361_prof_exam_marine_master_electrician_other", label: "Marine Board / Master Electrician / similar (2)" },
                { id: "361_prof_exam_trade_skill", label: "Other trade skill certificate (1)" },
              ]}
            />
            <div className="text-right text-sm text-gray-600">Sub-Total (cap 10): <b>{s3_parts.s3_36.toFixed(2)}</b></div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
        <div className="text-sm text-gray-600">Section 3 Total (cap 90)</div>
        <div className="text-base font-semibold">{s3_total.toFixed(2)}</div>
      </div>
    </section>
  );
}

/* =========================================================
   TECH SECTION – 4.0 Technological Knowledge (NEW UI)
========================================================= */
function TechRow({
  label, id, store, onChange,
}: { label: string; id: keyof S4Store; store: S4Store; onChange: (next: Partial<S4Store>) => void }) {
  const it = store[id] || { credit: 1, units: 0, maxUnits: 5 };
  const clamp = (v: number) => Math.max(0, Math.min(it.maxUnits, v || 0));
  return (
    <tr className="border-t">
      <td className="p-2">{label}</td>
      <td className="p-2 w-28 text-center">{`1 to ${it.maxUnits}`}</td>
      <td className="p-2 w-28 text-center">{it.credit}</td>
      <td className="p-2 w-32">
        <input
          type="number"
          min={0}
          max={it.maxUnits}
          className="w-24 rounded-md border p-1"
          value={it.units}
          onChange={(e) => onChange({ [id]: { ...it, units: clamp(Number(e.target.value)) } })}
        />
      </td>
      <td className="p-2 w-32">{(it.credit * it.units).toFixed(2)}</td>
    </tr>
  );
}

function TechSection({
  store, setStore, s4_41, s4_42, s4_43, s4_44, s4_total,
}: {
  store: S4Store;
  setStore: (patch: Partial<S4Store>) => void;
  s4_41: number; s4_42: number; s4_43: number; s4_44: number; s4_total: number;
}) {
  const change = (patch: Partial<S4Store>) => setStore(patch);

  return (
    <section className="rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 text-blue-900 px-3 py-1 text-sm font-semibold">
            4. Technological Knowledge
          </span>
          <span className="text-xs text-gray-500">(maximum of 50 pts.)</span>
        </div>
      </div>

      {/* 4.1 */}
      <div className="p-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 font-medium">4.1 Basic Knowledge in Microsoft Offices</div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2 w-28 text-center">Scale</th>
                <th className="p-2 w-28 text-center">Credit</th>
                <th className="p-2 w-32"># of Units</th>
                <th className="p-2 w-32">Credit × Units</th>
              </tr>
            </thead>
            <tbody>
              <TechRow label="4.1.1 Microsoft Word"      id="411_word"       store={store} onChange={change} />
              <TechRow label="4.1.2 Excel"                id="412_excel"      store={store} onChange={change} />
              <TechRow label="4.1.3 PowerPoint"           id="413_powerpoint" store={store} onChange={change} />
            </tbody>
          </table>
          <div className="px-3 py-2 text-xs text-gray-600">
            Able to use and create, retrieve, save, edit, create presentation in PowerPoint and utilize formula in Excel.
          </div>
          <div className="px-3 py-2 text-right text-sm text-gray-700">Subtotal 4.1: <b>{s4_41.toFixed(2)}</b></div>
        </div>
      </div>

      {/* 4.2 */}
      <div className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 font-medium">
            4.2 Able to use and utilize educational and other related applications
          </div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2 w-28 text-center">Scale</th>
                <th className="p-2 w-28 text-center">Credit</th>
                <th className="p-2 w-32"># of Units</th>
                <th className="p-2 w-32">Credit × Units</th>
              </tr>
            </thead>
            <tbody>
              <TechRow label="4.2 Educational/related apps" id="42_apps" store={store} onChange={change} />
            </tbody>
          </table>
          <div className="px-3 py-2 text-right text-sm text-gray-700">Subtotal 4.2: <b>{s4_42.toFixed(2)}</b></div>
        </div>
      </div>

      {/* 4.3 (cap 10) */}
      <div className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 font-medium">
            4.3 Training course with duration of at least one year (pro-rated; cap 10 pts.)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-2">Coverage</th>
                <th className="p-2 w-28 text-center">Scale</th>
                <th className="p-2 w-28 text-center">Credit</th>
                <th className="p-2 w-32"># of Units</th>
                <th className="p-2 w-32">Credit × Units</th>
              </tr>
            </thead>
            <tbody>
              <TechRow label="a. International" id="43_international" store={store} onChange={change} />
              <TechRow label="b. National"      id="43_national"      store={store} onChange={change} />
              <TechRow label="c. Local"         id="43_local"         store={store} onChange={change} />
            </tbody>
          </table>
          <div className="px-3 py-2 text-right text-sm text-gray-700">
            Subtotal 4.3 (before cap): <b>{s4Sum(store, ["43_international","43_national","43_local"]).toFixed(2)}</b> •
            Applied cap: <b>{s4_43.toFixed(2)}</b>
          </div>
        </div>
      </div>

      {/* 4.4 */}
      <div className="px-4 pb-4">
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 font-medium">
            4.4 Creative work (each criterion is 25% of 1 point)
          </div>
          <table className="w-full text-sm">
            <thead className="bg-blue-50 text-left">
              <tr>
                <th className="p-2">Criterion</th>
                <th className="p-2 w-28 text-center">Scale</th>
                <th className="p-2 w-28 text-center">Credit</th>
                <th className="p-2 w-32"># of Units</th>
                <th className="p-2 w-32">Credit × Units</th>
              </tr>
            </thead>
            <tbody>
              <TechRow label="a. Originality"                          id="44_originality"   store={store} onChange={change} />
              <TechRow label="b. Acceptability and recognition"        id="44_acceptability" store={store} onChange={change} />
              <TechRow label="c. Relevance and value"                  id="44_relevance"     store={store} onChange={change} />
              <TechRow label="d. Documentation & evidence of dissemination" id="44_documentation" store={store} onChange={change} />
            </tbody>
          </table>
          <div className="px-3 py-2 text-right text-sm text-gray-700">Subtotal 4.4: <b>{s4_44.toFixed(2)}</b></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
        <div className="text-sm text-gray-600">Category Total (cap 50)</div>
        <div className="text-base font-semibold">{s4_total.toFixed(2)}</div>
      </div>
    </section>
  );
}
