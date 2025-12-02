"use client";

import { useState, useEffect } from "react";
import { calculateRankAndRate, PASSING_SCORE } from "@/lib/evaluationUtils";

interface Applicant {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  desiredPosition?: string;
  highestDegree?: string;
  trainingHours?: number;
  experiences?: any;
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: Applicant | null;
  evaluatedBy?: string;
  onComplete?: () => void;
}

export default function EvaluationModal({
  isOpen,
  onClose,
  applicant,
  evaluatedBy,
}: EvaluationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"cat1" | "cat2" | "cat3" | "cat4">("cat1");

  // Category 1: Educational Qualifications
  const [highestDegreeKey, setHighestDegreeKey] = useState("");
  const [highestDegreePoints, setHighestDegreePoints] = useState(0);
  const [additionalMasters, setAdditionalMasters] = useState(0);
  const [additionalBachelors, setAdditionalBachelors] = useState(0);
  const [additionalCreditsUnits, setAdditionalCreditsUnits] = useState(0);

  // Category 2: Experience
  const [stateYears, setStateYears] = useState(0);
  const [otherInstitutionYears, setOtherInstitutionYears] = useState(0);
  const [adminBreakdown, setAdminBreakdown] = useState({
    president: 0,
    vicePresident: 0,
    dean: 0,
    departmentHead: 0,
  });
  const [industryBreakdown, setIndustryBreakdown] = useState({
    engineer: 0,
    technician: 0,
    skilledWorker: 0,
  });
  const [teachingBreakdown, setTeachingBreakdown] = useState({
    cooperatingTeacher: 0,
    basicEducation: 0,
  });

  // Category 3: Professional Development (simplified for now)
  const [category3Units, setCategory3Units] = useState<Record<string, number>>({});
  const [professionalDevScore, setProfessionalDevScore] = useState(0);

  // Category 4: Technological Skills
  const [microsoftWord, setMicrosoftWord] = useState(0);
  const [microsoftExcel, setMicrosoftExcel] = useState(0);
  const [microsoftPowerpoint, setMicrosoftPowerpoint] = useState(0);
  const [educationalAppsRating, setEducationalAppsRating] = useState(0);
  const [educationalAppsCount, setEducationalAppsCount] = useState(0);
  const [trainingBreakdown, setTrainingBreakdown] = useState({
    international: 0,
    national: 0,
    local: 0,
  });
  const [creativeWorkBreakdown, setCreativeWorkBreakdown] = useState({
    originality: 0,
    acceptability: 0,
    relevance: 0,
    documentation: 0,
  });

  const [remarks, setRemarks] = useState("");

  // Calculate scores
  const educationalScore =
    highestDegreePoints +
    additionalMasters * 4 +
    additionalBachelors * 3 +
    additionalCreditsUnits * 1;

  const experienceScore =
    stateYears * 1 +
    otherInstitutionYears * 0.75 +
    adminBreakdown.president * 3 +
    adminBreakdown.vicePresident * 2.5 +
    adminBreakdown.dean * 2 +
    adminBreakdown.departmentHead * 1 +
    industryBreakdown.engineer * 1.5 +
    industryBreakdown.technician * 1 +
    industryBreakdown.skilledWorker * 0.5 +
    teachingBreakdown.cooperatingTeacher * 1.5 +
    teachingBreakdown.basicEducation * 1;

  const technologicalScore =
    microsoftWord +
    microsoftExcel +
    microsoftPowerpoint +
    educationalAppsRating * educationalAppsCount +
    trainingBreakdown.international * 5 +
    trainingBreakdown.national * 3 +
    trainingBreakdown.local * 2 +
    creativeWorkBreakdown.originality * 0.25 +
    creativeWorkBreakdown.acceptability * 0.25 +
    creativeWorkBreakdown.relevance * 0.25 +
    creativeWorkBreakdown.documentation * 0.25;

  const totalScore =
    educationalScore + experienceScore + professionalDevScore + technologicalScore;
  const { rank, rate } = calculateRankAndRate(totalScore);
  const isQualified = totalScore >= PASSING_SCORE;

  // Degree options mapping
  const degreeOptions = [
    { key: "doctorate", label: "Doctorate Degree", points: 85 },
    { key: "masters", label: "Master's Degree", points: 65 },
    { key: "llb_md", label: "LLB / MD", points: 65 },
    { key: "diploma", label: "Diploma Course (above bachelor's)", points: 55 },
    { key: "bachelor4", label: "Bachelor's Degree (4 years)", points: 45 },
    { key: "bachelor5", label: "Bachelor's Degree (5 years)", points: 50 },
    { key: "bachelor6", label: "Bachelor's Degree (6 years)", points: 55 },
    { key: "special3yr", label: "Special Course (3-year post secondary)", points: 30 },
    { key: "special2yr", label: "Special Course (2-year post secondary)", points: 25 },
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHighestDegreeKey("");
      setHighestDegreePoints(0);
      setAdditionalMasters(0);
      setAdditionalBachelors(0);
      setAdditionalCreditsUnits(0);
      setStateYears(0);
      setOtherInstitutionYears(0);
      setAdminBreakdown({
        president: 0,
        vicePresident: 0,
        dean: 0,
        departmentHead: 0,
      });
      setIndustryBreakdown({
        engineer: 0,
        technician: 0,
        skilledWorker: 0,
      });
      setTeachingBreakdown({
        cooperatingTeacher: 0,
        basicEducation: 0,
      });
      setCategory3Units({});
      setProfessionalDevScore(0);
      setMicrosoftWord(0);
      setMicrosoftExcel(0);
      setMicrosoftPowerpoint(0);
      setEducationalAppsRating(0);
      setEducationalAppsCount(0);
      setTrainingBreakdown({
        international: 0,
        national: 0,
        local: 0,
      });
      setCreativeWorkBreakdown({
        originality: 0,
        acceptability: 0,
        relevance: 0,
        documentation: 0,
      });
      setRemarks("");
      setError("");
      setSuccess(false);
      setActiveTab("cat1");
    }
  }, [isOpen]);

  const handleDegreeChange = (key: string) => {
    setHighestDegreeKey(key);
    const selected = degreeOptions.find((d) => d.key === key);
    setHighestDegreePoints(selected?.points || 0);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!applicant) return;

  if (totalScore > 250) {
    setError("Total score cannot exceed 250 points");
    return;
  }

  if (totalScore < 0) {
    setError("Total score cannot be negative");
    return;
  }

  setLoading(true);
  setError("");

  try {
    // Build the payload with ALL detailed data
    const payload = {
      applicationId: applicant.id,
      
      // Category 1 detailed data
      highestDegreeKey,
      highestDegreePoints,
      additionalMasters,
      additionalBachelors,
      additionalCreditsUnits,
      
      // Category 2 detailed data
      stateYears,
      otherInstitutionYears,
      adminBreakdown: {
        president: adminBreakdown.president,
        vicePresident: adminBreakdown.vicePresident,
        dean: adminBreakdown.dean,
        departmentHead: adminBreakdown.departmentHead,
      },
      industryBreakdown: {
        engineer: industryBreakdown.engineer,
        technician: industryBreakdown.technician,
        skilledWorker: industryBreakdown.skilledWorker,
      },
      teachingBreakdown: {
        cooperatingTeacher: teachingBreakdown.cooperatingTeacher,
        basicEducation: teachingBreakdown.basicEducation,
      },
      
      // Category 3 detailed data
      category3Units,
      professionalDevScore,
      
      // Category 4 detailed data
      microsoftWord,
      microsoftExcel,
      microsoftPowerpoint,
      educationalAppsRating,
      educationalAppsCount,
      trainingBreakdown: {
        international: trainingBreakdown.international,
        national: trainingBreakdown.national,
        local: trainingBreakdown.local,
      },
      creativeWorkBreakdown: {
        originality: creativeWorkBreakdown.originality,
        acceptability: creativeWorkBreakdown.acceptability,
        relevance: creativeWorkBreakdown.relevance,
        documentation: creativeWorkBreakdown.documentation,
      },
      
      // Calculated scores
      educationalScore,
      experienceScore,
      technologicalScore,
      totalScore,
      rank,
      ratePerHour: rate,
      
      // Other fields
      evaluatedBy,
      remarks,
    };

    // DEBUG: Log what we're sending
    console.log('=== SENDING TO API ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('=====================');

    const response = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save evaluation");
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 2000);
  } catch (err: any) {
    setError(err.message || "An error occurred while saving the evaluation");
  } finally {
    setLoading(false);
  }
};

  if (!applicant || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Evaluate Applicant</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {applicant.fullName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {applicant.email}
              </div>
              <div>
                <span className="font-medium">Position:</span>{" "}
                {applicant.desiredPosition || "N/A"}
              </div>
              <div>
                <span className="font-medium">Department:</span>{" "}
                {applicant.department || "N/A"}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab("cat1")}
              className={`px-4 py-2 font-medium ${
                activeTab === "cat1"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Category 1
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cat2")}
              className={`px-4 py-2 font-medium ${
                activeTab === "cat2"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Category 2
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cat3")}
              className={`px-4 py-2 font-medium ${
                activeTab === "cat3"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Category 3
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cat4")}
              className={`px-4 py-2 font-medium ${
                activeTab === "cat4"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Category 4
            </button>
          </div>

          {/* Category 1: Educational Qualifications */}
          {activeTab === "cat1" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Category 1: Educational Qualifications (Max 85 points)
              </h3>

              {/* 1.1 Highest Degree */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  1.1 Highest Relevant Academic Degree
                </label>
                <select
                  value={highestDegreeKey}
                  onChange={(e) => handleDegreeChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select degree...</option>
                  {degreeOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.points} points)
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-600">
                  Points: {highestDegreePoints}
                </div>
              </div>

              {/* 1.2 Additional Degrees */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  1.2 Additional Equivalent & Relevant Degrees
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      Additional Master's Degrees (4 pts each)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={additionalMasters}
                      onChange={(e) =>
                        setAdditionalMasters(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Additional Bachelor's Degrees (3 pts each)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={additionalBachelors}
                      onChange={(e) =>
                        setAdditionalBachelors(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Points: {additionalMasters * 4 + additionalBachelors * 3}
                </div>
              </div>

              {/* 1.3 Additional Credits */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  1.3 Additional Credits (Max 10 points - 1 pt per 3-unit set)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={additionalCreditsUnits}
                  onChange={(e) =>
                    setAdditionalCreditsUnits(
                      Math.min(10, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Number of 3-unit sets"
                />
                <div className="text-sm text-gray-600">
                  Points: {additionalCreditsUnits * 1}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <span className="font-semibold">
                  Category 1 Total: {educationalScore.toFixed(2)} / 85
                </span>
              </div>
            </div>
          )}

          {/* Category 2: Experience */}
          {activeTab === "cat2" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Category 2: Experience & Professional Services (Max 25 points)
              </h3>

              {/* 2.1 Academic Service - State */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  2.1 Academic Service in State Institutions (1 pt per year)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={stateYears}
                  onChange={(e) =>
                    setStateYears(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Years of service"
                />
                <div className="text-sm text-gray-600">
                  Points: {(stateYears * 1).toFixed(2)}
                </div>
              </div>

              {/* 2.2 Academic Service - Other */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  2.2 Academic Service in Other HEIs/Private Institutions (0.75
                  pts per year)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={otherInstitutionYears}
                  onChange={(e) =>
                    setOtherInstitutionYears(
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Years of service"
                />
                <div className="text-sm text-gray-600">
                  Points: {(otherInstitutionYears * 0.75).toFixed(2)}
                </div>
              </div>

              {/* 2.3 Administrative Designation */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  2.3 Administrative Designation (Years)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      President (3 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={adminBreakdown.president}
                      onChange={(e) =>
                        setAdminBreakdown({
                          ...adminBreakdown,
                          president: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Vice President (2.5 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={adminBreakdown.vicePresident}
                      onChange={(e) =>
                        setAdminBreakdown({
                          ...adminBreakdown,
                          vicePresident: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Dean/Director (2 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={adminBreakdown.dean}
                      onChange={(e) =>
                        setAdminBreakdown({
                          ...adminBreakdown,
                          dean: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Dept Head/Principal (1 pt/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={adminBreakdown.departmentHead}
                      onChange={(e) =>
                        setAdminBreakdown({
                          ...adminBreakdown,
                          departmentHead: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Points:{" "}
                  {(
                    adminBreakdown.president * 3 +
                    adminBreakdown.vicePresident * 2.5 +
                    adminBreakdown.dean * 2 +
                    adminBreakdown.departmentHead * 1
                  ).toFixed(2)}
                </div>
              </div>

              {/* 2.4 Industry Experience */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  2.4 Industrial/Technical Experience (Years)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      Engineer/Manager (1.5 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={industryBreakdown.engineer}
                      onChange={(e) =>
                        setIndustryBreakdown({
                          ...industryBreakdown,
                          engineer: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Technician (1 pt/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={industryBreakdown.technician}
                      onChange={(e) =>
                        setIndustryBreakdown({
                          ...industryBreakdown,
                          technician: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Skilled Worker (0.5 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={industryBreakdown.skilledWorker}
                      onChange={(e) =>
                        setIndustryBreakdown({
                          ...industryBreakdown,
                          skilledWorker: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Points:{" "}
                  {(
                    industryBreakdown.engineer * 1.5 +
                    industryBreakdown.technician * 1 +
                    industryBreakdown.skilledWorker * 0.5
                  ).toFixed(2)}
                </div>
              </div>

              {/* 2.5 Other Teaching Experience */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  2.5 Other Teaching Experience (Years)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      Cooperating Teacher (1.5 pts/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={teachingBreakdown.cooperatingTeacher}
                      onChange={(e) =>
                        setTeachingBreakdown({
                          ...teachingBreakdown,
                          cooperatingTeacher: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Basic Education (1 pt/yr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={teachingBreakdown.basicEducation}
                      onChange={(e) =>
                        setTeachingBreakdown({
                          ...teachingBreakdown,
                          basicEducation: Math.max(
                            0,
                            Number(e.target.value) || 0
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Points:{" "}
                  {(
                    teachingBreakdown.cooperatingTeacher * 1.5 +
                    teachingBreakdown.basicEducation * 1
                  ).toFixed(2)}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <span className="font-semibold">
                  Category 2 Total: {experienceScore.toFixed(2)} / 25
                </span>
              </div>
            </div>
          )}

          {/* Category 3: Professional Development */}
          {activeTab === "cat3" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Category 3: Professional Development (Max 90 points)
              </h3>
              <p className="text-sm text-gray-600">
                This category includes publications, expert services,
                memberships, awards, etc. For now, enter the total calculated
                score.
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Total Professional Development Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="0.01"
                  value={professionalDevScore}
                  onChange={(e) =>
                    setProfessionalDevScore(
                      Math.min(90, Math.max(0, Number(e.target.value) || 0))
                    )
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter calculated score (0-90)"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <span className="font-semibold">
                  Category 3 Total: {professionalDevScore.toFixed(2)} / 90
                </span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800">
                <strong>Note:</strong> Category 3 has many subcategories
                (publications, patents, training, memberships, etc.). Calculate
                the detailed breakdown separately and enter the final score
                here.
              </div>
            </div>
          )}

          {/* Category 4: Technological Skills */}
          {activeTab === "cat4" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Category 4: Technological Knowledge (Max 50 points)
              </h3>

              {/* 4.1 Microsoft Office */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  4.1 Basic Knowledge in Microsoft Office (1–5 rating each)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Word (1–5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={microsoftWord}
                      onChange={(e) =>
                        setMicrosoftWord(
                          Math.min(5, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Excel (1–5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={microsoftExcel}
                      onChange={(e) =>
                        setMicrosoftExcel(
                          Math.min(5, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      PowerPoint (1–5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={microsoftPowerpoint}
                      onChange={(e) =>
                        setMicrosoftPowerpoint(
                          Math.min(5, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Subtotal:{" "}
                  {microsoftWord + microsoftExcel + microsoftPowerpoint}
                </div>
              </div>

              {/* 4.2 Educational Apps */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  4.2 Educational / Related Apps
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Rating (1–5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={educationalAppsRating}
                      onChange={(e) =>
                        setEducationalAppsRating(
                          Math.min(5, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Number of Apps
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={educationalAppsCount}
                      onChange={(e) =>
                        setEducationalAppsCount(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Subtotal: {educationalAppsRating * educationalAppsCount}
                </div>
              </div>

              {/* 4.3 Training Course ≥ 1 Year */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  4.3 Training Course ≥ 1 Year (Ratings: International 1–5,
                  National 1–3, Local 1–2)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      International (×5)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={trainingBreakdown.international}
                      onChange={(e) =>
                        setTrainingBreakdown({
                          ...trainingBreakdown,
                          international: Math.min(
                            5,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">National (×3)</label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={trainingBreakdown.national}
                      onChange={(e) =>
                        setTrainingBreakdown({
                          ...trainingBreakdown,
                          national: Math.min(
                            3,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Local (×2)</label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      value={trainingBreakdown.local}
                      onChange={(e) =>
                        setTrainingBreakdown({
                          ...trainingBreakdown,
                          local: Math.min(
                            2,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Subtotal:{" "}
                  {trainingBreakdown.international * 5 +
                    trainingBreakdown.national * 3 +
                    trainingBreakdown.local * 2}
                </div>
              </div>

              {/* 4.4 Creative Work */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  4.4 Creative Work (Rating 1–5 each, 25% weight)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">
                      Originality (×0.25)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={creativeWorkBreakdown.originality}
                      onChange={(e) =>
                        setCreativeWorkBreakdown({
                          ...creativeWorkBreakdown,
                          originality: Math.min(
                            5,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Acceptability (×0.25)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={creativeWorkBreakdown.acceptability}
                      onChange={(e) =>
                        setCreativeWorkBreakdown({
                          ...creativeWorkBreakdown,
                          acceptability: Math.min(
                            5,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Relevance (×0.25)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={creativeWorkBreakdown.relevance}
                      onChange={(e) =>
                        setCreativeWorkBreakdown({
                          ...creativeWorkBreakdown,
                          relevance: Math.min(
                            5,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Documentation (×0.25)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={creativeWorkBreakdown.documentation}
                      onChange={(e) =>
                        setCreativeWorkBreakdown({
                          ...creativeWorkBreakdown,
                          documentation: Math.min(
                            5,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Subtotal:{" "}
                  {(
                    creativeWorkBreakdown.originality * 0.25 +
                    creativeWorkBreakdown.acceptability * 0.25 +
                    creativeWorkBreakdown.relevance * 0.25 +
                    creativeWorkBreakdown.documentation * 0.25
                  ).toFixed(2)}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <span className="font-semibold">
                  Category 4 Total: {technologicalScore.toFixed(2)} / 50
                </span>
              </div>
            </div>
          )}

          {/* Total Score Summary */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2 border-2 border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Score:</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalScore.toFixed(2)} / 250
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Rank:</span>
              <span className="text-lg font-semibold text-green-600">
                {rank}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Rate per Hour:</span>
              <span className="text-lg font-semibold">₱{rate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Status:</span>
              <span
                className={`text-lg font-semibold ${
                  isQualified ? "text-green-600" : "text-red-600"
                }`}
              >
                {isQualified ? "✓ QUALIFIED" : "✗ NOT QUALIFIED"}
              </span>
            </div>
            {!isQualified && (
              <p className="text-sm text-red-600 mt-2">
                Minimum passing score: {PASSING_SCORE} points
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Evaluation Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional comments or observations about the applicant..."
              rows={4}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
              Evaluation saved successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Submit Evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}