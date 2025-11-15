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

interface DetailedScores {
  educational: {
    degree: number;
    training: number;
    licenses: number;
  };
  experience: {
    relevantYears: number;
    teachingExp: number;
    industryExp: number;
  };
  professionalDev: {
    publications: number;
    certifications: number;
    awards: number;
  };
  technological: {
    digitalLiteracy: number;
    learningManagement: number;
    researchTools: number;
  };
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

  const [educationalScore, setEducationalScore] = useState(0);
  const [experienceScore, setExperienceScore] = useState(0);
  const [professionalDevScore, setProfessionalDevScore] = useState(0);
  const [technologicalScore, setTechnologicalScore] = useState(0);

  const [detailedScores, setDetailedScores] = useState<DetailedScores>({
    educational: { degree: 0, training: 0, licenses: 0 },
    experience: { relevantYears: 0, teachingExp: 0, industryExp: 0 },
    professionalDev: { publications: 0, certifications: 0, awards: 0 },
    technological: { digitalLiteracy: 0, learningManagement: 0, researchTools: 0 },
  });

  const [remarks, setRemarks] = useState("");

  const totalScore = educationalScore + experienceScore + professionalDevScore + technologicalScore;
  const { rank, rate } = calculateRankAndRate(totalScore);
  const isQualified = totalScore >= PASSING_SCORE;

  useEffect(() => {
    if (!isOpen) {
      setEducationalScore(0);
      setExperienceScore(0);
      setProfessionalDevScore(0);
      setTechnologicalScore(0);
      setDetailedScores({
        educational: { degree: 0, training: 0, licenses: 0 },
        experience: { relevantYears: 0, teachingExp: 0, industryExp: 0 },
        professionalDev: { publications: 0, certifications: 0, awards: 0 },
        technological: { digitalLiteracy: 0, learningManagement: 0, researchTools: 0 },
      });
      setRemarks("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const eduTotal = Object.values(detailedScores.educational).reduce((a, b) => a + b, 0);
    const expTotal = Object.values(detailedScores.experience).reduce((a, b) => a + b, 0);
    const profTotal = Object.values(detailedScores.professionalDev).reduce((a, b) => a + b, 0);
    const techTotal = Object.values(detailedScores.technological).reduce((a, b) => a + b, 0);

    setEducationalScore(eduTotal);
    setExperienceScore(expTotal);
    setProfessionalDevScore(profTotal);
    setTechnologicalScore(techTotal);
  }, [detailedScores]);

  const handleDetailedScoreChange = (
    category: keyof DetailedScores,
    field: string,
    value: number
  ) => {
    setDetailedScores((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: Math.max(0, value),
      },
    }));
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
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicant.id,
          educationalScore,
          experienceScore,
          professionalDevScore,
          technologicalScore,
          totalScore,
          rank,
          ratePerHour: rate,
          detailedScores,
          evaluatedBy,
          remarks,
        }),
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
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
                <span className="font-medium">Position:</span> {applicant.desiredPosition || "N/A"}
              </div>
              <div>
                <span className="font-medium">Department:</span> {applicant.department || "N/A"}
              </div>
            </div>
          </div>

          {/* Educational Background */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">1. Educational Background (Max 80 points)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Degree (Max 40)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={detailedScores.educational.degree}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("educational", "degree", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Training (Max 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={detailedScores.educational.training}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("educational", "training", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Licenses (Max 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={detailedScores.educational.licenses}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("educational", "licenses", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="text-sm font-medium">
              Subtotal: {educationalScore} / 80 points
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">2. Experience (Max 80 points)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Relevant Years (Max 40)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={detailedScores.experience.relevantYears}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("experience", "relevantYears", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teaching (Max 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={detailedScores.experience.teachingExp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("experience", "teachingExp", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry (Max 20)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={detailedScores.experience.industryExp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("experience", "industryExp", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="text-sm font-medium">
              Subtotal: {experienceScore} / 80 points
            </div>
          </div>

          {/* Professional Development */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">3. Professional Development (Max 50 points)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Publications (Max 25)</label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  value={detailedScores.professionalDev.publications}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("professionalDev", "publications", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Certifications (Max 15)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={detailedScores.professionalDev.certifications}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("professionalDev", "certifications", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Awards (Max 10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={detailedScores.professionalDev.awards}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("professionalDev", "awards", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="text-sm font-medium">
              Subtotal: {professionalDevScore} / 50 points
            </div>
          </div>

          {/* Technological Skills */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">4. Technological Skills (Max 40 points)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Digital Literacy (Max 15)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={detailedScores.technological.digitalLiteracy}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("technological", "digitalLiteracy", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">LMS (Max 15)</label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={detailedScores.technological.learningManagement}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("technological", "learningManagement", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Research Tools (Max 10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={detailedScores.technological.researchTools}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleDetailedScoreChange("technological", "researchTools", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="text-sm font-medium">
              Subtotal: {technologicalScore} / 40 points
            </div>
          </div>

          {/* Total Score Summary */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Score:</span>
              <span className="text-2xl font-bold text-blue-600">{totalScore} / 250</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Rank:</span>
              <span className="text-lg font-semibold text-green-600">{rank}</span>
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
                {isQualified ? "✓ QUALIFIED (HIRED)" : "✗ NOT QUALIFIED"}
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
            <label className="block text-sm font-medium mb-1">Evaluation Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
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
              Evaluation saved successfully! {isQualified && "Applicant has been hired."}
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