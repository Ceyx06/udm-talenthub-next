'use client';

import type React from 'react';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ======================= TYPES ======================= */

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  desiredPosition?: string;
  department?: string;
  stage?: string;
  status?: string;
  fileStatus?: string;
  vacancy?: {
    id: string;
    title: string;
    college: string;
  };
  pdsUrl?: string;
  transcriptUrl?: string;
  trainingsUrl?: string;
  employmentUrl?: string;
}

/* ======================= HELPERS (FROM OLD FORM) ======================= */

type RankBand = { min: number; max: number; rank: string; rate: number };

const rankScale: RankBand[] = [
  { min: 0, max: 149.99, rank: 'Lecturer I', rate: 220.0 },
  { min: 150, max: 179.99, rank: 'Lecturer II', rate: 236.55 },
  { min: 180, max: 199.99, rank: 'Lecturer III', rate: 260.2 },
  { min: 200, max: 219.99, rank: 'Instructor I', rate: 285.0 },
  { min: 220, max: 239.99, rank: 'Instructor II', rate: 310.0 },
  { min: 240, max: 259.99, rank: 'Instructor III', rate: 335.0 },
  { min: 260, max: 279.99, rank: 'Asst. Prof I', rate: 360.0 },
  { min: 280, max: 299.99, rank: 'Asst. Prof II', rate: 400.0 },
  { min: 300, max: 324.99, rank: 'Assoc. Prof I', rate: 450.0 },
  { min: 325, max: 350.0, rank: 'Assoc. Prof II', rate: 500.0 },
];

const computeRank = (total: number) => {
  const band = rankScale.find((r) => total >= r.min && total <= r.max);
  if (!band) return { rank: 'Unclassified', rate: 0 };
  return { rank: band.rank, rate: band.rate };
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(v) ? v : 0));

const PASSING_SCORE = 175;

/* ====== CATEGORY 3 CREDIT TABLE (for totals) ====== */

type Cat3Units = Record<string, number>;

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

/* ======================= MAIN PAGE ======================= */

export default function EvaluationPage() {
  const router = useRouter();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
    }
  }, [router]);

  // Fetch applicants for evaluation
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await fetch('/api/application?include=vacancy');
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to fetch applications');
        }

        const data = await response.json();
        const applications = Array.isArray(data) ? data : data.data || [];

        // Filter for applicants ready for evaluation
        let eligibleApplicants = applications.filter(
          (app: Applicant) =>
            app.stage === 'INTERVIEW_COMPLETED' ||
            app.stage === 'DEMO_COMPLETED' ||
            app.status === 'APPROVED' ||
            (app.fileStatus === 'complete' && app.stage !== 'HIRED'),
        );

        // Fallback: show all non-hired & non-rejected
        if (eligibleApplicants.length === 0) {
          eligibleApplicants = applications.filter(
            (app: Applicant) => app.stage !== 'HIRED' && app.stage !== 'REJECTED',
          );
        }

        setApplicants(eligibleApplicants);
      } catch (error: any) {
        console.error('Error fetching applicants:', error);
        alert('Failed to load applicants: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplicants();
    }
  }, [user]);

  const handleEvaluate = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const handleEvaluationComplete = () => {
    setIsModalOpen(false);
    setSelectedApplicant(null);
    window.location.reload();
  };

  const getFileStatusBadge = (status?: string) => {
    if (status === 'complete') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          Complete
        </span>
      );
    } else if (status === 'partial') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          Partial
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      );
    }
  };

  const getStageBadge = (stage?: string) => {
    const stageColors: Record<string, string> = {
      APPLIED: 'bg-blue-100 text-blue-800',
      INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
      INTERVIEW_COMPLETED: 'bg-indigo-100 text-indigo-800',
      DEMO_COMPLETED: 'bg-cyan-100 text-cyan-800',
      EVALUATING: 'bg-yellow-100 text-yellow-800',
      HIRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };

    const colorClass = stageColors[stage || ''] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colorClass}`}>
        {stage || 'N/A'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header + List Summary button */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluation</h1>
            <p className="text-gray-600 mt-1">Review and evaluate applicants</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/hr/evaluation/list-summary')}
            className="h-10 min-w-[150px] rounded-lg border border-orange-300 bg-orange-50 px-4 text-sm font-medium text-orange-800 hover:bg-orange-100"
          >
            List Summary
          </button>
        </div>

        {/* Applicants Table */}
        {applicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">No applicants ready for evaluation</p>
            <p className="text-gray-500 text-sm mt-2">
              Applicants will appear here once they complete their interviews or
              document submissions.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {applicant.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {applicant.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {applicant.vacancy?.college ||
                          applicant.department ||
                          'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {applicant.vacancy?.title ||
                          applicant.desiredPosition ||
                          'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFileStatusBadge(applicant.fileStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStageBadge(applicant.stage)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEvaluate(applicant)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Applicants</p>
            <p className="text-2xl font-bold text-gray-900">{applicants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Files Complete</p>
            <p className="text-2xl font-bold text-green-600">
              {applicants.filter((a) => a.fileStatus === 'complete').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending Evaluation</p>
            <p className="text-2xl font-bold text-yellow-600">
              {
                applicants.filter(
                  (a) => a.stage !== 'HIRED' && a.stage !== 'REJECTED',
                ).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        applicant={selectedApplicant}
        evaluatedBy={user?.id || user?.email || 'Unknown'}
        onComplete={handleEvaluationComplete}
      />
    </div>
  );
}

/* ======================= MODAL COMPONENT ======================= */

type EvaluationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  evaluatedBy: string;
  onComplete: () => void;
};

type EvaluationCategory = 'EDUCATION' | 'EXPERIENCE' | 'PROF_DEV' | 'TECH';

const DEGREE_POINTS: Record<string, number> = {
  doctorate: 85,
  masters: 65,
  llb_md: 65,
  diploma_above_bachelor: 55,
  bachelor_4yr: 45,
  bachelor_5yr: 50,
  bachelor_6yr: 55,
  bachelor_other: 0,
  special_3yr: 30,
  special_2yr: 25,
};

function EvaluationModal({
  isOpen,
  onClose,
  applicant,
  evaluatedBy,
  onComplete,
}: EvaluationModalProps) {
  const [showPointSummary, setShowPointSummary] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState<EvaluationCategory>('EDUCATION');

  // Single scroll container inside the modal
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // When the category changes, always scroll the inner container to the top
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory]);

  // When toggling between form and point summary, just reset to top
  // (no attempt to restore old positions – avoids jumpiness)
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: 0 });
  }, [showPointSummary]);


  /* ========== CATEGORY 1 – EDUCATIONAL QUALIFICATIONS (1.1–1.3) ========== */

  // 1.1 Highest Degree (radio)
  const [highestDegree, setHighestDegree] = useState<string | null>(null);
  const [otherDegreePoints, setOtherDegreePoints] = useState(0);

  // 1.2 Additional equivalent / relevant degree earned
  const [addMastersCount, setAddMastersCount] = useState(0);
  const [addBachelorsCount, setAddBachelorsCount] = useState(0);

  // 1.3 Additional credits earned (units)
  const [additionalUnits, setAdditionalUnits] = useState(0);

  /* ========== CATEGORY 2 – EXPERIENCE & PROFESSIONAL SERVICES (2.1–2.5) ========== */

  // 2.1 Academic service in SUCs / CHED / TESDA-supervised
  const [expAcadStateYears, setExpAcadStateYears] = useState(0);

  // 2.2 Academic service in other HEIs / private / research institutions
  const [expAcadOtherYears, setExpAcadOtherYears] = useState(0);

  // 2.3 Administrative designation
  const [expAdminPresidentYears, setExpAdminPresidentYears] = useState(0);
  const [expAdminVpYears, setExpAdminVpYears] = useState(0);
  const [expAdminDeanYears, setExpAdminDeanYears] = useState(0);
  const [expAdminPrincipalYears, setExpAdminPrincipalYears] = useState(0);

  // 2.4 Industrial / agricultural / technical experience
  const [expIndustryEngineerYears, setExpIndustryEngineerYears] = useState(0);
  const [expIndustryTechnicianYears, setExpIndustryTechnicianYears] =
    useState(0);
  const [expIndustrySkilledYears, setExpIndustrySkilledYears] = useState(0);

  // 2.5 Other experience (cooperating / basic ed teacher)
  const [expOtherCoopYears, setExpOtherCoopYears] = useState(0);
  const [expOtherBasicEdYears, setExpOtherBasicEdYears] = useState(0);

  /* ========== CATEGORY 3 – DETAILED (3.1–3.6) ========== */

  const [cat3Units, setCat3Units] = useState<Cat3Units>({});
    // Scroll-safe updater for Category 3 units
  const handleCat3UnitsChange = useCallback(
    (field: keyof typeof CAT3_CREDITS, value: number) => {
      // If we're in Category 3 and the scroll container exists,
      // capture the current scroll position BEFORE updating state.
      if (activeCategory === 'PROF_DEV' && scrollRef.current) {
        const container = scrollRef.current;
        const prevTop = container.scrollTop;

        setCat3Units((prev) => ({ ...prev, [field]: value }));

        // After React commits the update, restore scrollTop.
        requestAnimationFrame(() => {
          if (scrollRef.current === container) {
            container.scrollTop = prevTop;
          }
        });
      } else {
        // Fallback: if not in Category 3, just update normally
        setCat3Units((prev) => ({ ...prev, [field]: value }));
      }
    },
    [activeCategory],
  );

  /* ========== CATEGORY 4 – TECHNOLOGICAL KNOWLEDGE (4.1–4.4) ========== */

  /* 4.1 Basic Knowledge in Microsoft Offices (max 15 pts) */
  const [msWord, setMsWord] = useState(0); // 0–5
  const [msExcel, setMsExcel] = useState(0); // 0–5
  const [msPowerPoint, setMsPowerPoint] = useState(0); // 0–5

  /* 4.2 Educational / related apps (max 5 pts) */
  const [eduApps, setEduApps] = useState(0); // 0–5

  /* 4.3 Training course of at least one year (cap 10 pts) */
  const [tcIntl, setTcIntl] = useState(0); // 0–5
  const [tcNat, setTcNat] = useState(0); // 0–3
  const [tcLocal, setTcLocal] = useState(0); // 0–2

  /* 4.4 Creative work (each criterion 25% of 1 pt., cap 10 pts) */
  const [cwOriginality, setCwOriginality] = useState(0); // 0–5
  const [cwAcceptability, setCwAcceptability] = useState(0); // 0–5
  const [cwRelevance, setCwRelevance] = useState(0); // 0–5
  const [cwDocumentation, setCwDocumentation] = useState(0); // 0–5

  // keep remarks only in payload (no textarea in UI)
  const [remarks, setRemarks] = useState('');

  // Reset form each time modal opens for a new applicant
  useEffect(() => {
    if (!isOpen) return;

    setShowPointSummary(false);
    setActiveCategory('EDUCATION');

    setHighestDegree(null);
    setOtherDegreePoints(0);
    setAddMastersCount(0);
    setAddBachelorsCount(0);
    setAdditionalUnits(0);

    setExpAcadStateYears(0);
    setExpAcadOtherYears(0);
    setExpAdminPresidentYears(0);
    setExpAdminVpYears(0);
    setExpAdminDeanYears(0);
    setExpAdminPrincipalYears(0);
    setExpIndustryEngineerYears(0);
    setExpIndustryTechnicianYears(0);
    setExpIndustrySkilledYears(0);
    setExpOtherCoopYears(0);
    setExpOtherBasicEdYears(0);

    setCat3Units({});

    setMsWord(0);
    setMsExcel(0);
    setMsPowerPoint(0);
    setEduApps(0);
    setTcIntl(0);
    setTcNat(0);
    setTcLocal(0);
    setCwOriginality(0);
    setCwAcceptability(0);
    setCwRelevance(0);
    setCwDocumentation(0);

    setRemarks('');
  }, [isOpen, applicant?.id]);

  /* ====== COMPUTATIONS (per category) ====== */

  // EDUCATION (1.1–1.3)
  const educationComputed = useMemo(() => {
    let highestPoints = 0;

    if (highestDegree === 'bachelor_other') {
      // Use user-entered points for "c. Others please specify"
      highestPoints = clamp(
        otherDegreePoints,
        0,
        Number.POSITIVE_INFINITY,
      );
    } else if (highestDegree && DEGREE_POINTS[highestDegree]) {
      highestPoints = DEGREE_POINTS[highestDegree];
    }

    const addDegreePoints = clamp(
      addMastersCount * 4 + addBachelorsCount * 3,
      0,
      Number.POSITIVE_INFINITY,
    );

    // Every 3 units = 1 point, max 10 pts
    const triples = Math.floor(
      clamp(additionalUnits, 0, Number.POSITIVE_INFINITY) / 3,
    );
    const additionalCreditsPoints = clamp(triples, 0, 10);

    const subtotal = highestPoints + addDegreePoints + additionalCreditsPoints;

    return {
      highestPoints,
      addDegreePoints,
      additionalCreditsPoints,
      subtotal: Math.min(subtotal, 85),
    };
  }, [
    highestDegree,
    otherDegreePoints, // NEW DEP
    addMastersCount,
    addBachelorsCount,
    additionalUnits,
  ]);

  const {
    highestPoints: eduHighestPoints,
    addDegreePoints: eduAddDegreePoints,
    additionalCreditsPoints: eduAddCreditsPoints,
    subtotal: section1,
  } = educationComputed;

  // EXPERIENCE & PROFESSIONAL SERVICES (2.1–2.5)
  const experienceComputed = useMemo(() => {
    const p21 = expAcadStateYears * 1;
    const p22 = expAcadOtherYears * 0.75;
    const p23 =
      expAdminPresidentYears * 3 +
      expAdminVpYears * 2.5 +
      expAdminDeanYears * 2 +
      expAdminPrincipalYears * 1;
    const p24 =
      expIndustryEngineerYears * 1.5 +
      expIndustryTechnicianYears * 1 +
      expIndustrySkilledYears * 0.5;
    const p25 =
      expOtherCoopYears * 1.5 + expOtherBasicEdYears * 1;

    const subtotal = p21 + p22 + p23 + p24 + p25;

    return { p21, p22, p23, p24, p25, subtotal: Math.min(subtotal, 25) };
  }, [
    expAcadStateYears,
    expAcadOtherYears,
    expAdminPresidentYears,
    expAdminVpYears,
    expAdminDeanYears,
    expAdminPrincipalYears,
    expIndustryEngineerYears,
    expIndustryTechnicianYears,
    expIndustrySkilledYears,
    expOtherCoopYears,
    expOtherBasicEdYears,
  ]);

  const {
    p21,
    p22,
    p23,
    p24,
    p25,
    subtotal: section2,
  } = experienceComputed;

  // PROFESSIONAL DEVELOPMENT (3.1–3.6, cap 90)
  const section3 = useMemo(() => {
    let sum = 0;
    for (const key of Object.keys(CAT3_CREDITS)) {
      const units = cat3Units[key] ?? 0;
      sum += CAT3_CREDITS[key] * units;
    }
    return clamp(sum, 0, 90);
  }, [cat3Units]);

  // TECHNOLOGICAL KNOWLEDGE – 4.1–4.4 (max 50 pts)
  const techComputed = useMemo(() => {
    // 4.1 Basic Microsoft Offices (Word, Excel, PowerPoint) – max 15
    const word = clamp(msWord, 0, 5);
    const excel = clamp(msExcel, 0, 5);
    const ppt = clamp(msPowerPoint, 0, 5);
    const sub41 = clamp(word + excel + ppt, 0, 15);

    // 4.2 Educational / related apps – max 5
    const apps = clamp(eduApps, 0, 5);
    const sub42 = clamp(apps, 0, 5);

    // 4.3 Training course ≥1 year (pro-rated, cap 10)
    const intl = clamp(tcIntl, 0, 5);
    const nat = clamp(tcNat, 0, 3);
    const local = clamp(tcLocal, 0, 2);
    const sub43Raw = intl + nat + local;
    const sub43Capped = clamp(sub43Raw, 0, 10);

    // 4.4 Creative work (each criterion 1 pt, cap 20)
    const orig = clamp(cwOriginality, 0, 5);
    const acc = clamp(cwAcceptability, 0, 5);
    const rel = clamp(cwRelevance, 0, 5);
    const doc = clamp(cwDocumentation, 0, 5);
    const sub44Raw = orig + acc + rel + doc;
    const sub44Capped = clamp(sub44Raw, 0, 20);

    const subtotal = clamp(
      sub41 + sub42 + sub43Capped + sub44Capped,
      0,
      50,
    );

    return {
      sub41,
      sub42,
      sub43Raw,
      sub43Capped,
      sub44Raw,
      sub44Capped,
      subtotal,
    };
  }, [
    msWord,
    msExcel,
    msPowerPoint,
    eduApps,
    tcIntl,
    tcNat,
    tcLocal,
    cwOriginality,
    cwAcceptability,
    cwRelevance,
    cwDocumentation,
  ]);

  const {
    sub41,
    sub42,
    sub43Raw,
    sub43Capped,
    sub44Raw,
    sub44Capped,
    subtotal: section4,
  } = techComputed;

  const totalScore = useMemo(
    () => clamp(section1 + section2 + section3 + section4, 0, 250),
    [section1, section2, section3, section4],
  );

  const { rank, rate } = useMemo(
    () => computeRank(totalScore),
    [totalScore],
  );

  const isQualified = totalScore >= PASSING_SCORE;

const handleSave = async () => {
  if (!applicant) return;

  // Keep your rich breakdown in one JSON object
  const detailedScores = {
    educational: {
      highestDegree,
      highestDegreePoints: eduHighestPoints,
      additionalDegrees: {
        mastersCount: addMastersCount,
        bachelorsCount: addBachelorsCount,
        points: eduAddDegreePoints,
      },
      additionalCredits: {
        totalUnits: additionalUnits,
        points: eduAddCreditsPoints,
      },
      subtotal: section1,
    },
    experience: {
      academicService: {
        stateYears: expAcadStateYears,
        statePoints: p21,
        otherYears: expAcadOtherYears,
        otherPoints: p22,
      },
      administrative: {
        presidentYears: expAdminPresidentYears,
        vpYears: expAdminVpYears,
        deanYears: expAdminDeanYears,
        principalYears: expAdminPrincipalYears,
        points: p23,
      },
      industry: {
        engineerYears: expIndustryEngineerYears,
        technicianYears: expIndustryTechnicianYears,
        skilledWorkerYears: expIndustrySkilledYears,
        points: p24,
      },
      otherTeaching: {
        cooperatingTeacherYears: expOtherCoopYears,
        basicEdTeacherYears: expOtherBasicEdYears,
        points: p25,
      },
      subtotal: section2,
    },
    professionalDevelopment: {
      details: cat3Units,
      subtotal: section3,
    },
    technologicalSkills: {
      basicMicrosoft: {
        word: msWord,
        excel: msExcel,
        powerpoint: msPowerPoint,
        subtotal: sub41,
      },
      educationalApps: {
        apps: eduApps,
        subtotal: sub42,
      },
      longTraining: {
        international: tcIntl,
        national: tcNat,
        local: tcLocal,
        subtotalRaw: sub43Raw,
        subtotalCapped: sub43Capped,
      },
      creativeWork: {
        originality: cwOriginality,
        acceptability: cwAcceptability,
        relevance: cwRelevance,
        documentation: cwDocumentation,
        subtotalRaw: sub44Raw,
        subtotalCapped: sub44Capped,
      },
      subtotal: section4,
    },
  };

  const payload = {
    applicationId: applicant.id,          // ⬅️ must match Evaluation.applicationId
    educationalScore: section1,
    experienceScore: section2,
    professionalDevScore: section3,
    technologicalScore: section4,
    totalScore,
    rank,
    ratePerHour: rate,
    detailedScores,
    evaluatedBy,
    remarks,
  };

  try {
    const res = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = 'Failed to save evaluation.';
      try {
        const err = await res.json();
        if (err?.message) msg = err.message;
      } catch {
        // ignore JSON parse error
      }
      alert(msg);
      return;
    }

    const data = await res.json();
    console.log('Evaluation saved:', data);
    onComplete(); // this will close modal + reload list (you already wired it)
  } catch (error) {
    console.error('Error saving evaluation:', error);
    alert('Error saving evaluation. Please try again.');
  }
};

  if (!isOpen || !applicant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Evaluate Applicant</h2>
            <p className="text-xs text-gray-500 mt-1">
              {applicant.fullName} •{' '}
              {applicant.vacancy?.title ||
                applicant.desiredPosition ||
                'N/A'}{' '}
              •{' '}
              {applicant.vacancy?.college ||
                applicant.department ||
                'N/A'}
            </p>
            <p className="text-xs text-gray-400">
              Evaluator: {evaluatedBy}
            </p>
          </div>

          {/* RED BOX – Point Summary toggle */}
          <button
            type="button"
            onClick={() => setShowPointSummary((v) => !v)}
            className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
          >
            {showPointSummary ? 'Back to Form' : 'Point Summary'}
          </button>
        </div>

        {/* BODY */}
        {!showPointSummary ? (
          <>
            {/* ORANGE BOX – Category dropdown */}
            <div className="flex items-center justify-between border-b bg-orange-50 px-6 py-3">
              <div>
                <p className="text-sm font-semibold">
                  Evaluation Category
                </p>
                <p className="text-xs text-gray-600">
                  Switch between Educational Qualifications, Experience,
                  Professional Development, and Technological Knowledge.
                </p>
              </div>
              <select
                value={activeCategory}
                onChange={(e) =>
                  setActiveCategory(e.target.value as EvaluationCategory)
                }
                className="rounded-md border px-3 py-1.5 text-sm bg-white"
              >
                <option value="EDUCATION">
                  1. Educational Qualifications
                </option>
                <option value="EXPERIENCE">
                  2. Experience &amp; Professional Services
                </option>
                <option value="PROF_DEV">
                  3. Professional Development, Achievement &amp; Honors
                </option>
                <option value="TECH">4. Technological Knowledge</option>
              </select>
            </div>

            {/* PINK BOX – Scrollable evaluation content */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-4 bg-pink-50/40"
              >
              {activeCategory === 'EDUCATION' && (
                <EducationQualificationsSection
                  highestDegree={highestDegree}
                  setHighestDegree={setHighestDegree}
                  otherDegreePoints={otherDegreePoints}
                  setOtherDegreePoints={setOtherDegreePoints}
                  addMastersCount={addMastersCount}
                  setAddMastersCount={setAddMastersCount}
                  addBachelorsCount={addBachelorsCount}
                  setAddBachelorsCount={setAddBachelorsCount}
                  additionalUnits={additionalUnits}
                  setAdditionalUnits={setAdditionalUnits}
                  highestPoints={eduHighestPoints}
                  addDegreePoints={eduAddDegreePoints}
                  additionalCreditsPoints={eduAddCreditsPoints}
                  subtotal={section1}
                />
              )}

              {activeCategory === 'EXPERIENCE' && (
                <ExperienceSection
                  expAcadStateYears={expAcadStateYears}
                  setExpAcadStateYears={setExpAcadStateYears}
                  expAcadOtherYears={expAcadOtherYears}
                  setExpAcadOtherYears={setExpAcadOtherYears}
                  expAdminPresidentYears={expAdminPresidentYears}
                  setExpAdminPresidentYears={setExpAdminPresidentYears}
                  expAdminVpYears={expAdminVpYears}
                  setExpAdminVpYears={setExpAdminVpYears}
                  expAdminDeanYears={expAdminDeanYears}
                  setExpAdminDeanYears={setExpAdminDeanYears}
                  expAdminPrincipalYears={expAdminPrincipalYears}
                  setExpAdminPrincipalYears={setExpAdminPrincipalYears}
                  expIndustryEngineerYears={expIndustryEngineerYears}
                  setExpIndustryEngineerYears={setExpIndustryEngineerYears}
                  expIndustryTechnicianYears={expIndustryTechnicianYears}
                  setExpIndustryTechnicianYears={
                    setExpIndustryTechnicianYears
                  }
                  expIndustrySkilledYears={expIndustrySkilledYears}
                  setExpIndustrySkilledYears={setExpIndustrySkilledYears}
                  expOtherCoopYears={expOtherCoopYears}
                  setExpOtherCoopYears={setExpOtherCoopYears}
                  expOtherBasicEdYears={expOtherBasicEdYears}
                  setExpOtherBasicEdYears={setExpOtherBasicEdYears}
                  p21={p21}
                  p22={p22}
                  p23={p23}
                  p24={p24}
                  p25={p25}
                  subtotal={section2}
                />
              )}

              {activeCategory === 'PROF_DEV' && (
                <Category3Section
                  units={cat3Units}
                  onUnitsChange={handleCat3UnitsChange}
                  subtotal={section3}
                />
              )}

              {activeCategory === 'TECH' && (
                <TechnologicalKnowledgeSection
                  msWord={msWord}
                  setMsWord={setMsWord}
                  msExcel={msExcel}
                  setMsExcel={setMsExcel}
                  msPowerPoint={msPowerPoint}
                  setMsPowerPoint={setMsPowerPoint}
                  eduApps={eduApps}
                  setEduApps={setEduApps}
                  tcIntl={tcIntl}
                  setTcIntl={setTcIntl}
                  tcNat={tcNat}
                  setTcNat={setTcNat}
                  tcLocal={tcLocal}
                  setTcLocal={setTcLocal}
                  cwOriginality={cwOriginality}
                  setCwOriginality={setCwOriginality}
                  cwAcceptability={cwAcceptability}
                  setCwAcceptability={setCwAcceptability}
                  cwRelevance={cwRelevance}
                  setCwRelevance={setCwRelevance}
                  cwDocumentation={cwDocumentation}
                  setCwDocumentation={setCwDocumentation}
                  sub41={sub41}
                  sub42={sub42}
                  sub43Raw={sub43Raw}
                  sub43Capped={sub43Capped}
                  sub44Raw={sub44Raw}
                  sub44Capped={sub44Capped}
                  subtotal={section4}
                />
              )}
            </div>
          </>
        ) : (
          // BLUE BOX – Point Summary view
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-blue-50">
            <div className="max-w-xl mx-auto rounded-xl border border-blue-200 bg-white p-4">
              <h3 className="font-semibold mb-3 text-blue-900">
                Point Summary
              </h3>
              <div className="space-y-2 text-sm">
                <SummaryRow
                  label="1. Educational Qualifications"
                  value={section1}
                  max={85}
                />
                <SummaryRow
                  label="2. Experience & Professional Services"
                  value={section2}
                  max={25}
                />
                <SummaryRow
                  label="3. Professional Development, Achievement & Honors"
                  value={section3}
                  max={90}
                />
                <SummaryRow
                  label="4. Technological Knowledge"
                  value={section4}
                  max={50}
                />
              </div>

              <div className="mt-4 border-t pt-3 flex items-center justify-between text-sm">
                <span className="font-semibold">Total Score</span>
                <span className="font-semibold text-blue-700">
                  {totalScore.toFixed(0)} / 250
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">
                    Accorded Rank
                  </p>
                  <p className="font-semibold">{rank}</p>
                </div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">
                    Rate / hour
                  </p>
                  <p className="font-semibold">
                    ₱ {rate.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">
                    Status
                  </p>
                  <p
                    className={
                      'font-semibold ' +
                      (isQualified
                        ? 'text-green-700'
                        : 'text-red-600')
                    }
                  >
                    {isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] text-gray-500">
                Minimum passing score: {PASSING_SCORE} points
              </p>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======================= SMALL REUSABLE PIECES & SECTIONS ======================= */

type NumberFieldProps = {
  label: string;
  value: number;
  max?: number;
  onChange: (v: number) => void;
};

function NumberField({ label, value, max, onChange }: NumberFieldProps) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-gray-700">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(
            clamp(
              Number(e.target.value),
              0,
              max ?? Number.POSITIVE_INFINITY,
            ),
          )
        }
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
      {typeof max === 'number' && (
        <span className="mt-1 block text-[11px] text-gray-400">
          Max: {max} pts
        </span>
      )}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
      <span className="text-xs text-gray-700">{label}</span>
      <span className="text-sm font-semibold">
        {value.toFixed(2)} / {max}
      </span>
    </div>
  );
}

/* ---- Category 1 UI ---- */

interface EducationQualificationsSectionProps {
  highestDegree: string | null;
  setHighestDegree: (key: string) => void;
  otherDegreePoints: number;
  setOtherDegreePoints: (v: number) => void;
  addMastersCount: number;
  setAddMastersCount: (v: number) => void;
  addBachelorsCount: number;
  setAddBachelorsCount: (v: number) => void;
  additionalUnits: number;
  setAdditionalUnits: (v: number) => void;
  highestPoints: number;
  addDegreePoints: number;
  additionalCreditsPoints: number;
  subtotal: number;
}

function EducationQualificationsSection({
  highestDegree,
  setHighestDegree,
  otherDegreePoints,
  setOtherDegreePoints,
  addMastersCount,
  setAddMastersCount,
  addBachelorsCount,
  setAddBachelorsCount,
  additionalUnits,
  setAdditionalUnits,
  highestPoints,
  addDegreePoints,
  additionalCreditsPoints,
  subtotal,
}: EducationQualificationsSectionProps) {
  return (
    <div className="space-y-4">
      {/* 1.1 Highest relevant academic degree */}
      <div className="rounded-lg border overflow-hidden bg-white">
        <div className="bg-blue-50 px-4 py-2 text-sm font-semibold">
          1.1 Highest relevant academic Degree or educational attainment with
          the following maximum points credits
        </div>
        <div className="grid grid-cols-[minmax(0,1.8fr)_100px_100px] border-t text-xs font-semibold">
          <div className="px-4 py-2">Highest Degree</div>
          <div className="px-4 py-2 text-center">
            1 = yes, 0 = no
          </div>
          <div className="px-4 py-2 text-right">Points</div>
        </div>

        {[
          { key: 'doctorate', label: '1.1.1 Doctorate Degree', points: 85 },
          { key: 'masters', label: "1.1.2 Master's Degree", points: 65 },
          { key: 'llb_md', label: '1.1.3 LLB and MD', points: 65 },
          {
            key: 'diploma_above_bachelor',
            label: "1.1.4 Diploma course (above bachelor's degree)",
            points: 55,
          },
          {
            key: 'bachelor_4yr',
            label: '1.1.5 Bachelor’s Degree (4 years)',
            points: 45,
          },
          {
            key: 'bachelor_5yr',
            label: 'a. 5 year course',
            points: 50,
          },
          {
            key: 'bachelor_6yr',
            label: 'b. 6 year course',
            points: 55,
          },
          {
            key: 'bachelor_other',
            label: 'c. Others please specify',
            points: 0,
          },
          {
            key: 'special_3yr',
            label: '1.1.6 Special Courses – 3-year post secondary course',
            points: 30,
          },
          {
            key: 'special_2yr',
            label: '* 2-year post secondary course',
            points: 25,
          },
        ].map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[minmax(0,1.8fr)_100px_100px] border-t items-center text-sm"
          >
            <div className="px-4 py-2">{row.label}</div>
            <div className="px-4 py-2 text-center">
              <input
                type="radio"
                name="highestDegree"
                checked={highestDegree === row.key}
                onChange={() => setHighestDegree(row.key)}
              />
            </div>
            <div className="px-4 py-2 text-right">
              {row.key === 'bachelor_other' ? (
                <input
                  type="number"
                  min={0}
                  className="w-24 rounded-md border px-2 py-1 text-sm text-right"
                  value={otherDegreePoints}
                  onChange={(e) =>
                    setOtherDegreePoints(
                      clamp(
                        Number(e.target.value),
                        0,
                        Number.POSITIVE_INFINITY,
                      ),
                    )
                  }
                />
              ) : (
                row.points
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-4 font-semibold">Sub-Category Total:</span>
          <span className="w-24 text-right font-semibold">
            {highestPoints.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 1.2 Additional equivalent & relevant degree earned */}
      <div className="rounded-lg border overflow-hidden bg-white">
        <div className="bg-blue-50 px-4 py-2 text-sm font-semibold">
          1.2 Additional equivalent and relevant degree earned
        </div>
        <div className="grid grid-cols-[minmax(0,1.6fr)_120px_120px_120px] border-t text-xs font-semibold">
          <div className="px-4 py-2">Additional Degree</div>
          <div className="px-4 py-2 text-right"># of Degree</div>
          <div className="px-4 py-2 text-right">Credit Points</div>
          <div className="px-4 py-2 text-right"># × Credit</div>
        </div>

        {/* Additional Master's */}
        <div className="grid grid-cols-[minmax(0,1.6fr)_120px_120px_120px] border-t items-center text-sm">
          <div className="px-4 py-2">
            1.2.1 Additional Master&apos;s degree
          </div>
          <div className="px-4 py-2">
            <input
              type="number"
              min={0}
              value={addMastersCount}
              onChange={(e) =>
                setAddMastersCount(
                  clamp(
                    Number(e.target.value),
                    0,
                    Number.POSITIVE_INFINITY,
                  ),
                )
              }
              className="w-24 rounded-md border px-2 py-1 text-sm text-right"
            />
          </div>
          <div className="px-4 py-2 text-right">4</div>
          <div className="px-4 py-2 text-right">
            {(addMastersCount * 4).toFixed(2)}
          </div>
        </div>

        {/* Additional Bachelor’s */}
        <div className="grid grid-cols-[minmax(0,1.6fr)_120px_120px_120px] border-t items-center text-sm">
          <div className="px-4 py-2">
            1.2.2 Additional Bachelor&apos;s degree
          </div>
          <div className="px-4 py-2">
            <input
              type="number"
              min={0}
              value={addBachelorsCount}
              onChange={(e) =>
                setAddBachelorsCount(
                  clamp(
                    Number(e.target.value),
                    0,
                    Number.POSITIVE_INFINITY,
                  ),
                )
              }
              className="w-24 rounded-md border px-2 py-1 text-sm text-right"
            />
          </div>
          <div className="px-4 py-2 text-right">3</div>
          <div className="px-4 py-2 text-right">
            {(addBachelorsCount * 3).toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-4 font-semibold">Sub-Category Total:</span>
          <span className="w-24 text-right font-semibold">
            {addDegreePoints.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 1.3 Additional credits earned */}
      <div className="rounded-lg border overflow-hidden bg-white">
        <div className="bg-blue-50 px-4 py-2 text-sm font-semibold">
          1.3 Additional credits earned (maximum of 10 pts.)
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_160px_160px_160px] border-t text-xs font-semibold">
          <div className="px-4 py-2">Additional Degree</div>
          <div className="px-4 py-2 text-right">
            # of 3 Units Earned
          </div>
          <div className="px-4 py-2 text-right">Credited Points</div>
          <div className="px-4 py-2 text-right"># × Credit</div>
        </div>

        <div className="grid grid-cols-[minmax(0,2fr)_160px_160px_160px] border-t items-center text-sm">
          <div className="px-4 py-2">
            1.3.1 For every 3 units earned toward a higher approved
            degree course : 1
            <div className="text-xs text-gray-500">
              Enter total units below (auto-computes).
            </div>
          </div>
          <div className="px-4 py-2">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-600">
                Total units:
              </span>
              <input
                type="number"
                min={0}
                value={additionalUnits}
                onChange={(e) =>
                  setAdditionalUnits(
                    clamp(
                      Number(e.target.value),
                      0,
                      Number.POSITIVE_INFINITY,
                    ),
                  )
                }
                className="w-24 rounded-md border px-2 py-1 text-sm text-right"
              />
            </div>
          </div>
          <div className="px-4 py-2 text-right">1</div>
          <div className="px-4 py-2 text-right">
            {additionalCreditsPoints.toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-4 font-semibold">Sub-Category Total:</span>
          <span className="w-24 text-right font-semibold">
            {additionalCreditsPoints.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-end items-center px-1 pt-1 text-sm font-semibold">
        <span className="mr-2">
          Category Total (1. Educational Qualifications):
        </span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ---- Category 2 UI ---- */

interface ExperienceSectionProps {
  expAcadStateYears: number;
  setExpAcadStateYears: (v: number) => void;
  expAcadOtherYears: number;
  setExpAcadOtherYears: (v: number) => void;
  expAdminPresidentYears: number;
  setExpAdminPresidentYears: (v: number) => void;
  expAdminVpYears: number;
  setExpAdminVpYears: (v: number) => void;
  expAdminDeanYears: number;
  setExpAdminDeanYears: (v: number) => void;
  expAdminPrincipalYears: number;
  setExpAdminPrincipalYears: (v: number) => void;
  expIndustryEngineerYears: number;
  setExpIndustryEngineerYears: (v: number) => void;
  expIndustryTechnicianYears: number;
  setExpIndustryTechnicianYears: (v: number) => void;
  expIndustrySkilledYears: number;
  setExpIndustrySkilledYears: (v: number) => void;
  expOtherCoopYears: number;
  setExpOtherCoopYears: (v: number) => void;
  expOtherBasicEdYears: number;
  setExpOtherBasicEdYears: (v: number) => void;
  p21: number;
  p22: number;
  p23: number;
  p24: number;
  p25: number;
  subtotal: number;
}

function ExperienceSection(props: ExperienceSectionProps) {
  const {
    expAcadStateYears,
    setExpAcadStateYears,
    expAcadOtherYears,
    setExpAcadOtherYears,
    expAdminPresidentYears,
    setExpAdminPresidentYears,
    expAdminVpYears,
    setExpAdminVpYears,
    expAdminDeanYears,
    setExpAdminDeanYears,
    expAdminPrincipalYears,
    setExpAdminPrincipalYears,
    expIndustryEngineerYears,
    setExpIndustryEngineerYears,
    expIndustryTechnicianYears,
    setExpIndustryTechnicianYears,
    expIndustrySkilledYears,
    setExpIndustrySkilledYears,
    expOtherCoopYears,
    setExpOtherCoopYears,
    expOtherBasicEdYears,
    setExpOtherBasicEdYears,
    p21,
    p22,
    p23,
    p24,
    p25,
    subtotal,
  } = props;

  return (
    <div className="space-y-4">
      {/* 2.1 */}
      <ExperienceBlock
        title="2.1 For every year of full-time academic service in a state institution of higher learning"
        rows={[
          {
            label:
              'State SUC/CHED-supervised HEI / TESDA-supervised TEI',
            creditScore: 1,
            years: expAcadStateYears,
            onChangeYears: setExpAcadStateYears,
            creditedPoints: p21,
          },
        ]}
      />

      {/* 2.2 */}
      <ExperienceBlock
        title="2.2 For every year of full-time academic service in other HEIs / private / public research institutions"
        rows={[
          {
            label: 'Other HEIs / private / research institutions',
            creditScore: 0.75,
            years: expAcadOtherYears,
            onChangeYears: setExpAcadOtherYears,
            creditedPoints: p22,
          },
        ]}
      />

      {/* 2.3 */}
      <ExperienceBlock
        title="2.3 For every year of administrative designation as"
        rows={[
          {
            label: 'a. President',
            creditScore: 3,
            years: expAdminPresidentYears,
            onChangeYears: setExpAdminPresidentYears,
          },
          {
            label: 'b. Vice-President (incl. Board Secretary)',
            creditScore: 2.5,
            years: expAdminVpYears,
            onChangeYears: setExpAdminVpYears,
          },
          {
            label:
              'c. Dean / Director / School Superintendent',
            creditScore: 2,
            years: expAdminDeanYears,
            onChangeYears: setExpAdminDeanYears,
          },
          {
            label:
              'd. Principal / Supervisor / Department Chair / Head of Unit',
            creditScore: 1,
            years: expAdminPrincipalYears,
            onChangeYears: setExpAdminPrincipalYears,
          },
        ]}
      />

      {/* 2.4 */}
      <ExperienceBlock
        title="2.4 For every year of full-time industrial / agricultural / technical experience as"
        rows={[
          {
            label: 'a. Engineer / Plant / Farm Manager',
            creditScore: 1.5,
            years: expIndustryEngineerYears,
            onChangeYears: setExpIndustryEngineerYears,
          },
          {
            label: 'b. Technician',
            creditScore: 1,
            years: expIndustryTechnicianYears,
            onChangeYears: setExpIndustryTechnicianYears,
          },
          {
            label: 'c. Skilled Worker',
            creditScore: 0.5,
            years: expIndustrySkilledYears,
            onChangeYears: setExpIndustrySkilledYears,
          },
        ]}
      />

      {/* 2.5 */}
      <ExperienceBlock
        title="2.5 For every year of experience as"
        rows={[
          {
            label: 'a. Cooperating Teacher',
            creditScore: 1.5,
            years: expOtherCoopYears,
            onChangeYears: setExpOtherCoopYears,
          },
          {
            label: 'b. Basic Education Teacher',
            creditScore: 1,
            years: expOtherBasicEdYears,
            onChangeYears: setExpOtherBasicEdYears,
          },
        ]}
      />

      <div className="flex justify-end items-center px-1 pt-1 text-sm font-semibold">
        <span className="mr-2">
          Category Total (2. Experience &amp; Professional Services):
        </span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

interface ExperienceRowConfig {
  label: string;
  creditScore: number;
  years: number;
  onChangeYears: (v: number) => void;
  creditedPoints?: number;
}

interface ExperienceBlockProps {
  title: string;
  rows: ExperienceRowConfig[];
}

function ExperienceBlock({ title, rows }: ExperienceBlockProps) {
  return (
    <div className="rounded-lg border overflow-hidden bg-white">
      <div className="bg-blue-50 px-4 py-2 text-sm font-semibold">
        {title}
      </div>
      <div className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px] border-t text-xs font-semibold">
        <div className="px-4 py-2">Description</div>
        <div className="px-4 py-2 text-right">Credit Score</div>
        <div className="px-4 py-2 text-right"># of Years / Units</div>
        <div className="px-4 py-2 text-right">Credited Points</div>
      </div>

      {rows.map((row, idx) => {
        const credited =
          typeof row.creditedPoints === 'number'
            ? row.creditedPoints
            : row.years * row.creditScore;

        return (
          <div
            key={idx}
            className="grid grid-cols-[minmax(0,1.8fr)_100px_140px_140px] border-t items-center text-sm"
          >
            <div className="px-4 py-2">{row.label}</div>
            <div className="px-4 py-2 text-right">
              {row.creditScore}
            </div>
            <div className="px-4 py-2">
              <input
                type="number"
                min={0}
                value={row.years}
                onChange={(e) =>
                  row.onChangeYears(
                    clamp(
                      Number(e.target.value),
                      0,
                      Number.POSITIVE_INFINITY,
                    ),
                  )
                }
                className="w-24 rounded-md border px-2 py-1 text-sm text-right"
              />
            </div>
            <div className="px-4 py-2 text-right">
              {credited.toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Category 3 Detailed UI (3.1–3.6) ---- */

interface Category3SectionProps {
  units: Cat3Units;
  onUnitsChange: (field: keyof typeof CAT3_CREDITS, value: number) => void;
  subtotal: number;
}
function Category3Section({
  units,
  onUnitsChange,
  subtotal,
}: Category3SectionProps) {
  const handle = (
    field: keyof typeof CAT3_CREDITS,
    value: string,
  ) => {
    const n = Math.max(0, Number(value) || 0);
    onUnitsChange(field, n);
  };

  const computeSubtotal = (keys: (keyof typeof CAT3_CREDITS)[]) =>
    keys.reduce(
      (sum, k) =>
        sum + (units[k] ?? 0) * CAT3_CREDITS[k],
      0,
    );

  // 3.1 – 3.6 key groups
  const keys31: (keyof typeof CAT3_CREDITS)[] = [
    // 3.1.1 Inventions / Discoveries / Creative works
    'inv_patent_intl',
    'inv_patent_nat',
    'inv_patent_inst',
    'inv_pending_intl',
    'inv_pending_nat',
    'inv_pending_inst',
    'disc_originality',
    'disc_dissemination',
    'cw_accept',
    'cw_recognition',
    'cw_relevance',
    'cw_documentation',
    // 3.1.2–3.1.4 Books / Articles / Instructional
    'book_sa_tertiary',
    'book_sa_hs',
    'book_sa_elem',
    'book_ca_tertiary',
    'book_ca_hs',
    'book_ca_elem',
    'book_rev_tertiary',
    'book_rev_hs',
    'book_rev_elem',
    'book_trans_tertiary',
    'book_trans_hs',
    'book_trans_elem',
    'book_edit_tertiary',
    'book_edit_hs',
    'book_edit_elem',
    'book_comp_tertiary',
    'book_comp_hs',
    'book_comp_elem',
    'art_intl_sa',
    'art_intl_ca',
    'art_nat_sa',
    'art_nat_ca',
    'art_local_sa',
    'art_local_ca',
    'inst_single',
    'inst_co',
  ];

  const keys32: (keyof typeof CAT3_CREDITS)[] = [
    // 3.2.1 Training & Seminars
    'ts_intl',
    'ts_nat',
    'ts_local',
    'ts_industry',
    'ts_conf_intl',
    'ts_conf_nat',
    'ts_conf_local',
    // 3.2.2 Expert Services
    'es_intl',
    'es_nat',
    'es_local',
    'coord_intl',
    'coord_nat',
    'coord_local',
    'adv_doc',
    'adv_master',
    'adv_undergrad',
    'es_reviewer',
    'es_accredit',
    'es_trade',
    'es_coach',
  ];

  const keys33: (keyof typeof CAT3_CREDITS)[] = [
    // 3.3.1 Professional Organizations
    'po_full',
    'po_assoc',
    'po_honor',
    'po_science',
    'po_officer',
    'po_member',
    // 3.3.2 Scholarship / Fellowship
    'sf_intl_degree',
    'sf_intl_non',
    'sf_nat_degree',
    'sf_nat_non',
  ];

  const keys34: (keyof typeof CAT3_CREDITS)[] = [
    'award_intl',
    'award_nat',
    'award_local',
  ];

  const keys35: (keyof typeof CAT3_CREDITS)[] = ['co_service'];

  const keys36: (keyof typeof CAT3_CREDITS)[] = [
    'pex_eng_law_teachers',
    'pex_marine_elec',
    'pex_trade_other',
  ];

  const sub31 = computeSubtotal(keys31);
  const sub32 = computeSubtotal(keys32);
  const sub33 = computeSubtotal(keys33);
  const sub34 = computeSubtotal(keys34);
  const sub35 = computeSubtotal(keys35);
  const sub36 = computeSubtotal(keys36);

  const Row = ({
    label,
    credit,
    field,
  }: {
    label: string;
    credit: number;
    field: keyof typeof CAT3_CREDITS;
  }) => {
    const u = units[field] ?? 0;
    const total = credit * u;
    return (
      <div className="grid grid-cols-12 items-center border-b py-2 text-sm">
        <div className="col-span-6 pl-2">{label}</div>
        <div className="col-span-2 text-center">{credit}</div>
        <div className="col-span-2 text-center">
          <input
            type="number"
            min={0}
            className="w-full border rounded px-2 py-1 text-sm text-right"
            value={u}
            onChange={(e) => handle(field, e.target.value)}
          />
        </div>
        <div className="col-span-2 text-center">
          {total.toFixed(2)}
        </div>
      </div>
    );
  };

  const TableHeader = () => (
    <div className="grid grid-cols-12 bg-gray-50 border-b text-xs font-semibold py-2">
      <div className="col-span-6 pl-2">Item / Description</div>
      <div className="col-span-2 text-center">
        Credit / Unit
      </div>
      <div className="col-span-2 text-center"># of Units</div>
      <div className="col-span-2 text-center">Credit × Units</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 3.1 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.1 Innovations, patented inventions, publications and other
          creative works
        </div>

        {/* 3.1.1 Inventions / Discoveries / Creative works */}
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
          3.1.1 Inventions, discoveries and creative works
        </div>
        <TableHeader />
        <Row
          label="If patented – an international scale"
          credit={CAT3_CREDITS.inv_patent_intl}
          field="inv_patent_intl"
        />
        <Row
          label="If patented – a national scale"
          credit={CAT3_CREDITS.inv_patent_nat}
          field="inv_patent_nat"
        />
        <Row
          label="If patented – institutional level"
          credit={CAT3_CREDITS.inv_patent_inst}
          field="inv_patent_inst"
        />
        <Row
          label="If patent pending – an international scale"
          credit={CAT3_CREDITS.inv_pending_intl}
          field="inv_pending_intl"
        />
        <Row
          label="If patent pending – a national scale"
          credit={CAT3_CREDITS.inv_pending_nat}
          field="inv_pending_nat"
        />
        <Row
          label="If patent pending – institutional level"
          credit={CAT3_CREDITS.inv_pending_inst}
          field="inv_pending_inst"
        />

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          Discoveries
        </div>
        <TableHeader />
        <Row
          label="Originality, Educational impact (60% of 7 = 4.2)"
          credit={CAT3_CREDITS.disc_originality}
          field="disc_originality"
        />
        <Row
          label="Evidence of dissemination (40% of 7 = 2.8)"
          credit={CAT3_CREDITS.disc_dissemination}
          field="disc_dissemination"
        />

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          Creative work has to satisfy one or more of the following
          criteria
        </div>
        <TableHeader />
        <Row
          label="Acceptability (25% of 7 = 1.75)"
          credit={CAT3_CREDITS.cw_accept}
          field="cw_accept"
        />
        <Row
          label="Recognition (25% of 7 = 1.75)"
          credit={CAT3_CREDITS.cw_recognition}
          field="cw_recognition"
        />
        <Row
          label="Relevance & value (25% of 7 = 1.75)"
          credit={CAT3_CREDITS.cw_relevance}
          field="cw_relevance"
        />
        <Row
          label="Documentation & evidence (25% of 7 = 1.75)"
          credit={CAT3_CREDITS.cw_documentation}
          field="cw_documentation"
        />

        {/* 3.1.2 Books */}
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          3.1.2 Published book (last 10 yrs)
        </div>
        <TableHeader />
        <Row
          label="Single Author – Tertiary"
          credit={CAT3_CREDITS.book_sa_tertiary}
          field="book_sa_tertiary"
        />
        <Row
          label="Single Author – High School"
          credit={CAT3_CREDITS.book_sa_hs}
          field="book_sa_hs"
        />
        <Row
          label="Single Author – Elementary"
          credit={CAT3_CREDITS.book_sa_elem}
          field="book_sa_elem"
        />
        <Row
          label="Co-author – Tertiary"
          credit={CAT3_CREDITS.book_ca_tertiary}
          field="book_ca_tertiary"
        />
        <Row
          label="Co-author – High School"
          credit={CAT3_CREDITS.book_ca_hs}
          field="book_ca_hs"
        />
        <Row
          label="Co-author – Elementary"
          credit={CAT3_CREDITS.book_ca_elem}
          field="book_ca_elem"
        />
        <Row
          label="Reviewer – Tertiary"
          credit={CAT3_CREDITS.book_rev_tertiary}
          field="book_rev_tertiary"
        />
        <Row
          label="Reviewer – High School"
          credit={CAT3_CREDITS.book_rev_hs}
          field="book_rev_hs"
        />
        <Row
          label="Reviewer – Elementary"
          credit={CAT3_CREDITS.book_rev_elem}
          field="book_rev_elem"
        />
        <Row
          label="Translator – Tertiary"
          credit={CAT3_CREDITS.book_trans_tertiary}
          field="book_trans_tertiary"
        />
        <Row
          label="Translator – High School"
          credit={CAT3_CREDITS.book_trans_hs}
          field="book_trans_hs"
        />
        <Row
          label="Translator – Elementary"
          credit={CAT3_CREDITS.book_trans_elem}
          field="book_trans_elem"
        />
        <Row
          label="Editor – Tertiary"
          credit={CAT3_CREDITS.book_edit_tertiary}
          field="book_edit_tertiary"
        />
        <Row
          label="Editor – High School"
          credit={CAT3_CREDITS.book_edit_hs}
          field="book_edit_hs"
        />
        <Row
          label="Editor – Elementary"
          credit={CAT3_CREDITS.book_edit_elem}
          field="book_edit_elem"
        />
        <Row
          label="Compiler – Tertiary"
          credit={CAT3_CREDITS.book_comp_tertiary}
          field="book_comp_tertiary"
        />
        <Row
          label="Compiler – High School"
          credit={CAT3_CREDITS.book_comp_hs}
          field="book_comp_hs"
        />
        <Row
          label="Compiler – Elementary"
          credit={CAT3_CREDITS.book_comp_elem}
          field="book_comp_elem"
        />

        {/* 3.1.3 Articles */}
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          3.1.3 Scholarly/technical/educational articles – Coverage and
          Role
        </div>
        <TableHeader />
        <Row
          label="International – Single author"
          credit={CAT3_CREDITS.art_intl_sa}
          field="art_intl_sa"
        />
        <Row
          label="International – Co-author"
          credit={CAT3_CREDITS.art_intl_ca}
          field="art_intl_ca"
        />
        <Row
          label="National – Single author"
          credit={CAT3_CREDITS.art_nat_sa}
          field="art_nat_sa"
        />
        <Row
          label="National – Co-author"
          credit={CAT3_CREDITS.art_nat_ca}
          field="art_nat_ca"
        />
        <Row
          label="Local – Single author"
          credit={CAT3_CREDITS.art_local_sa}
          field="art_local_sa"
        />
        <Row
          label="Local – Co-author"
          credit={CAT3_CREDITS.art_local_ca}
          field="art_local_ca"
        />

        {/* 3.1.4 Instructional materials */}
        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          3.1.4 Instructional manual / audio-visual material developed
          &amp; approved
        </div>
        <TableHeader />
        <Row
          label="Single author or maker"
          credit={CAT3_CREDITS.inst_single}
          field="inst_single"
        />
        <Row
          label="Co-author / co-maker"
          credit={CAT3_CREDITS.inst_co}
          field="inst_co"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.1 Total:
          </span>
          <span>{sub31.toFixed(2)}</span>
        </div>
      </section>

      {/* 3.2 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.2 For expert services, training and active participation in
          professional/technical activities
        </div>

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
          3.2.1 Training &amp; Seminars (cap 10)
        </div>
        <TableHeader />
        <Row
          label="Training – International (5)"
          credit={CAT3_CREDITS.ts_intl}
          field="ts_intl"
        />
        <Row
          label="Training – National (3)"
          credit={CAT3_CREDITS.ts_nat}
          field="ts_nat"
        />
        <Row
          label="Training – Local (2)"
          credit={CAT3_CREDITS.ts_local}
          field="ts_local"
        />
        <Row
          label="Industrial/Agro/Fishery training – points per hour"
          credit={CAT3_CREDITS.ts_industry}
          field="ts_industry"
        />
        <Row
          label="Conference participation – International (3)"
          credit={CAT3_CREDITS.ts_conf_intl}
          field="ts_conf_intl"
        />
        <Row
          label="Conference participation – National (2)"
          credit={CAT3_CREDITS.ts_conf_nat}
          field="ts_conf_nat"
        />
        <Row
          label="Conference participation – Local (1)"
          credit={CAT3_CREDITS.ts_conf_local}
          field="ts_conf_local"
        />

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          3.2.2 Expert Services Rendered (cap 20)
        </div>
        <TableHeader />
        <Row
          label="Consultant/Expert – International (7)"
          credit={CAT3_CREDITS.es_intl}
          field="es_intl"
        />
        <Row
          label="Consultant/Expert – National (5)"
          credit={CAT3_CREDITS.es_nat}
          field="es_nat"
        />
        <Row
          label="Consultant/Expert – Local (2)"
          credit={CAT3_CREDITS.es_local}
          field="es_local"
        />
        <Row
          label="Coordinator/Lecturer/Resource – International (5)"
          credit={CAT3_CREDITS.coord_intl}
          field="coord_intl"
        />
        <Row
          label="Coordinator/Lecturer/Resource – National (3)"
          credit={CAT3_CREDITS.coord_nat}
          field="coord_nat"
        />
        <Row
          label="Coordinator/Lecturer/Resource – Local (2)"
          credit={CAT3_CREDITS.coord_local}
          field="coord_local"
        />
        <Row
          label="Adviser – Doctoral (1)"
          credit={CAT3_CREDITS.adv_doc}
          field="adv_doc"
        />
        <Row
          label="Adviser – Masteral (0.5)"
          credit={CAT3_CREDITS.adv_master}
          field="adv_master"
        />
        <Row
          label="Adviser – Undergraduate (0.25)"
          credit={CAT3_CREDITS.adv_undergrad}
          field="adv_undergrad"
        />
        <Row
          label="PRC/CSC Reviewer/Examiner (1)"
          credit={CAT3_CREDITS.es_reviewer}
          field="es_reviewer"
        />
        <Row
          label="Accreditation/Board/Committee (1)"
          credit={CAT3_CREDITS.es_accredit}
          field="es_accredit"
        />
        <Row
          label="Trade skills certification (1)"
          credit={CAT3_CREDITS.es_trade}
          field="es_trade"
        />
        <Row
          label="Coach/Trainer/Adviser per year (1)"
          credit={CAT3_CREDITS.es_coach}
          field="es_coach"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.2 Total:
          </span>
          <span>{sub32.toFixed(2)}</span>
        </div>
      </section>

      {/* 3.3 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.3 Membership in professional organizations/ honor societies
          and honors received
        </div>

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold">
          3.3.1 Professional Organizations (cap 10)
        </div>
        <TableHeader />
        <Row
          label="Learned Society – Full member (2)"
          credit={CAT3_CREDITS.po_full}
          field="po_full"
        />
        <Row
          label="Learned Society – Associate member (1)"
          credit={CAT3_CREDITS.po_assoc}
          field="po_assoc"
        />
        <Row
          label="Honor Society (1)"
          credit={CAT3_CREDITS.po_honor}
          field="po_honor"
        />
        <Row
          label="Scientific Society (1)"
          credit={CAT3_CREDITS.po_science}
          field="po_science"
        />
        <Row
          label="Professional Organization – Officer (1)"
          credit={CAT3_CREDITS.po_officer}
          field="po_officer"
        />
        <Row
          label="Professional Organization – Member (0.5)"
          credit={CAT3_CREDITS.po_member}
          field="po_member"
        />

        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold border-t">
          3.3.2 Scholarship / Fellowship (cap 10)
        </div>
        <TableHeader />
        <Row
          label="International (Degree) (5)"
          credit={CAT3_CREDITS.sf_intl_degree}
          field="sf_intl_degree"
        />
        <Row
          label="International (Non-Degree) (4)"
          credit={CAT3_CREDITS.sf_intl_non}
          field="sf_intl_non"
        />
        <Row
          label="National (Degree) (3)"
          credit={CAT3_CREDITS.sf_nat_degree}
          field="sf_nat_degree"
        />
        <Row
          label="National (Non-Degree) (2)"
          credit={CAT3_CREDITS.sf_nat_non}
          field="sf_nat_non"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.3 Total:
          </span>
          <span>{sub33.toFixed(2)}</span>
        </div>
      </section>

      {/* 3.4 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.4 Awards of distinction received in recognition of
          achievements in relevant areas of specialization/profession
          and/or assignment
        </div>
        <TableHeader />
        <Row
          label="International (5)"
          credit={CAT3_CREDITS.award_intl}
          field="award_intl"
        />
        <Row
          label="National/Regional (3)"
          credit={CAT3_CREDITS.award_nat}
          field="award_nat"
        />
        <Row
          label="Local (1)"
          credit={CAT3_CREDITS.award_local}
          field="award_local"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.4 Total:
          </span>
          <span>{sub34.toFixed(2)}</span>
        </div>
      </section>

      {/* 3.5 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.5 Community outreach
        </div>
        <TableHeader />
        <Row
          label="Service-oriented project – per year (1)"
          credit={CAT3_CREDITS.co_service}
          field="co_service"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.5 Total:
          </span>
          <span>{sub35.toFixed(2)}</span>
        </div>
      </section>

      {/* 3.6 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold border-b">
          3.6 Professional examinations
        </div>
        <TableHeader />
        <Row
          label="Engineering/Accounting/Medicine/Law/Teachers etc. (5)"
          credit={CAT3_CREDITS.pex_eng_law_teachers}
          field="pex_eng_law_teachers"
        />
        <Row
          label="Marine Board / Master Electrician / similar (2)"
          credit={CAT3_CREDITS.pex_marine_elec}
          field="pex_marine_elec"
        />
        <Row
          label="Other trade skill certificate (1)"
          credit={CAT3_CREDITS.pex_trade_other}
          field="pex_trade_other"
        />

        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">
            Sub-Category 3.6 Total:
          </span>
          <span>{sub36.toFixed(2)}</span>
        </div>
      </section>

      {/* Overall Category 3 total */}
      <div className="flex justify-end items-center px-1 pt-1 text-sm font-semibold">
        <span className="mr-2">
          Category Total (3. Professional Development, Achievement
          &amp; Honors):
        </span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ---- Category 4 – Technological Knowledge (4.1–4.4) ---- */

interface TechnologicalKnowledgeSectionProps {
  msWord: number;
  setMsWord: (v: number) => void;
  msExcel: number;
  setMsExcel: (v: number) => void;
  msPowerPoint: number;
  setMsPowerPoint: (v: number) => void;
  eduApps: number;
  setEduApps: (v: number) => void;
  tcIntl: number;
  setTcIntl: (v: number) => void;
  tcNat: number;
  setTcNat: (v: number) => void;
  tcLocal: number;
  setTcLocal: (v: number) => void;
  cwOriginality: number;
  setCwOriginality: (v: number) => void;
  cwAcceptability: number;
  setCwAcceptability: (v: number) => void;
  cwRelevance: number;
  setCwRelevance: (v: number) => void;
  cwDocumentation: number;
  setCwDocumentation: (v: number) => void;
  sub41: number;
  sub42: number;
  sub43Raw: number;
  sub43Capped: number;
  sub44Raw: number;
  sub44Capped: number;
  subtotal: number;
}

function TechnologicalKnowledgeSection({
  msWord,
  setMsWord,
  msExcel,
  setMsExcel,
  msPowerPoint,
  setMsPowerPoint,
  eduApps,
  setEduApps,
  tcIntl,
  setTcIntl,
  tcNat,
  setTcNat,
  tcLocal,
  setTcLocal,
  cwOriginality,
  setCwOriginality,
  cwAcceptability,
  setCwAcceptability,
  cwRelevance,
  setCwRelevance,
  cwDocumentation,
  setCwDocumentation,
  sub41,
  sub42,
  sub43Raw,
  sub43Capped,
  sub44Raw,
  sub44Capped,
  subtotal,
}: TechnologicalKnowledgeSectionProps) {
  const Row = ({
    label,
    scale,
    credit,
    value,
    onChange,
    maxUnits,
  }: {
    label: string;
    scale: string;
    credit: number;
    value: number;
    onChange: (v: number) => void;
    maxUnits: number;
  }) => {
    const v = clamp(value, 0, maxUnits);
    const product = credit * v;

    return (
      <div className="grid grid-cols-[minmax(0,4fr)_90px_70px_90px_110px] items-center border-t text-sm">
        <div className="px-4 py-2">{label}</div>
        <div className="px-4 py-2 text-center text-xs text-gray-600">
          {scale}
        </div>
        <div className="px-4 py-2 text-center text-sm">
          {credit}
        </div>
        <div className="px-4 py-2">
          <input
            type="number"
            min={0}
            max={maxUnits}
            value={v}
            onChange={(e) =>
              onChange(
                clamp(
                  Number(e.target.value) || 0,
                  0,
                  maxUnits,
                ),
              )
            }
            className="w-full rounded-md border px-2 py-1 text-sm text-right"
          />
        </div>
        <div className="px-4 py-2 text-right">
          {product.toFixed(2)}
        </div>
      </div>
    );
  };

  const TableHeader = ({
    firstColLabel,
  }: {
    firstColLabel: string;
  }) => (
    <div className="grid grid-cols-[minmax(0,4fr)_90px_70px_90px_110px] bg-gray-50 border-t text-xs font-semibold">
      <div className="px-4 py-2">{firstColLabel}</div>
      <div className="px-4 py-2 text-center">Scale</div>
      <div className="px-4 py-2 text-center">Credit</div>
      <div className="px-4 py-2 text-center"># of Units</div>
      <div className="px-4 py-2 text-center">Credit × Units</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 4.1 Basic Knowledge in Microsoft Offices */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold">
          4.1 Basic Knowledge in Microsoft Offices
        </div>
        <TableHeader firstColLabel="Item" />
        <Row
          label="4.1.1 Microsoft Word"
          scale="1 to 5"
          credit={1}
          value={msWord}
          onChange={setMsWord}
          maxUnits={5}
        />
        <Row
          label="4.1.2 Excel"
          scale="1 to 5"
          credit={1}
          value={msExcel}
          onChange={setMsExcel}
          maxUnits={5}
        />
        <Row
          label="4.1.3 PowerPoint"
          scale="1 to 5"
          credit={1}
          value={msPowerPoint}
          onChange={setMsPowerPoint}
          maxUnits={5}
        />
        <div className="px-4 py-2 text-xs text-gray-600 border-t">
          Able to use and create, retrieve, save, edit, create
          presentation in PowerPoint and utilize formula in Excel.
        </div>
        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">Subtotal 4.1:</span>
          <span>{sub41.toFixed(2)}</span>
        </div>
      </section>

      {/* 4.2 Educational and related applications */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold">
          4.2 Able to use and utilize educational and other related
          applications
        </div>
        <TableHeader firstColLabel="Item" />
        <Row
          label="4.2 Educational/related apps"
          scale="1 to 5"
          credit={1}
          value={eduApps}
          onChange={setEduApps}
          maxUnits={5}
        />
        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-sm">
          <span className="mr-2 font-semibold">Subtotal 4.2:</span>
          <span>{sub42.toFixed(2)}</span>
        </div>
      </section>

      {/* 4.3 Training course (≥ 1 year, cap 10 pts) */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold">
          4.3 Training course with duration of at least one year
          (pro-rated; cap 10 pts.)
        </div>
        <TableHeader firstColLabel="Coverage" />
        <Row
          label="a. International"
          scale="1 to 5"
          credit={1}
          value={tcIntl}
          onChange={setTcIntl}
          maxUnits={5}
        />
        <Row
          label="b. National"
          scale="1 to 3"
          credit={1}
          value={tcNat}
          onChange={setTcNat}
          maxUnits={3}
        />
        <Row
          label="c. Local"
          scale="1 to 2"
          credit={1}
          value={tcLocal}
          onChange={setTcLocal}
          maxUnits={2}
        />
        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-xs">
          <span className="mr-2 font-semibold">
            Subtotal 4.3 (before cap):
          </span>
          <span className="mr-4">
            {sub43Raw.toFixed(2)}
          </span>
          <span className="mr-2 font-semibold">• Applied cap:</span>
          <span>{sub43Capped.toFixed(2)}</span>
        </div>
      </section>

      {/* 4.4 Creative work */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 text-sm font-semibold">
          4.4 Creative work (each criterion is 25% of 1 point)
        </div>
        <TableHeader firstColLabel="Criterion" />
        <Row
          label="a. Originality: 25% of 1"
          scale="1 to 5"
          credit={1}
          value={cwOriginality}
          onChange={setCwOriginality}
          maxUnits={5}
        />
        <Row
          label="b. Acceptability and recognition: 25% of 1"
          scale="1 to 5"
          credit={1}
          value={cwAcceptability}
          onChange={setCwAcceptability}
          maxUnits={5}
        />
        <Row
          label="c. Relevance and value: 25% of 1"
          scale="1 to 5"
          credit={1}
          value={cwRelevance}
          onChange={setCwRelevance}
          maxUnits={5}
        />
        <Row
          label="d. Documentation & evidence of dissemination: 25% of 1"
          scale="1 to 5"
          credit={1}
          value={cwDocumentation}
          onChange={setCwDocumentation}
          maxUnits={5}
        />
        <div className="flex justify-end items-center border-t bg-gray-50 px-4 py-2 text-xs">
          <span className="mr-2 font-semibold">
            Subtotal 4.4 (before cap):
          </span>
          <span className="mr-4">
            {sub44Raw.toFixed(2)}
          </span>
          <span className="mr-2 font-semibold">• Applied cap:</span>
          <span>{sub44Capped.toFixed(2)}</span>
        </div>
      </section>

      {/* Category 4 total */}
      <div className="flex justify-end items-center px-1 pt-1 text-sm font-semibold">
        <span className="mr-2">
          Category Total (4. Technological Knowledge):
        </span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
