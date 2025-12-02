"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, Clock, Download } from "lucide-react";

interface Evaluation {
  id: string;
  applicationId: string;
  educationalScore: number;
  experienceScore: number;
  professionalDevScore: number;
  technologicalScore: number;
  totalScore: number;
  rank: string;
  ratePerHour: number;
  evaluatedBy: string;
  evaluatedAt: string;
  remarks?: string;
  contractStatus?: "pending" | "approved" | "declined";
  contractActionDate?: string;
  application?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    desiredPosition?: string;
    department?: string;
    stage?: string;
    vacancy?: {
      id: string;
      title: string;
      college: string;
    };
  };
}

export default function ContractQueuePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "declined"
  >("pending");

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/");
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/");
    }
  }, [router]);

  // Fetch evaluations
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/evaluations");
        if (!response.ok) {
          throw new Error("Failed to fetch evaluations");
        }

        const data = await response.json();
        const evaluationsList = Array.isArray(data) ? data : data.data || [];

        // Filter for evaluated applicants that are qualified (HIRED status)
        const queueEvaluations = evaluationsList.filter(
          (evaluation: Evaluation) => {
            const isQualified = evaluation.totalScore >= 175;
            return isQualified;
          }
        );

        setEvaluations(queueEvaluations);
      } catch (error: any) {
        console.error("Error fetching evaluations:", error);
        alert("Failed to load evaluations: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEvaluations();
    }
  }, [user]);

  const handleContractAction = async (
    evaluationId: string,
    action: "approved" | "declined"
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${
          action === "approved" ? "approve" : "decline"
        } this applicant for contract?`
      )
    ) {
      return;
    }

    setActionLoading(evaluationId);

    try {
      const response = await fetch(
        `/api/evaluations/${evaluationId}/contract-action`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractStatus: action,
            contractActionDate: new Date().toISOString(),
            actionBy: user?.id || user?.email || "HR",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update contract status");
      }

      // Update local state
      setEvaluations((prev) =>
        prev.map((evaluation) =>
          evaluation.id === evaluationId
            ? {
                ...evaluation,
                contractStatus: action,
                contractActionDate: new Date().toISOString(),
              }
            : evaluation
        )
      );

      alert(
        `Applicant ${action === "approved" ? "approved" : "declined"} successfully!`
      );
    } catch (error: any) {
      console.error("Error updating contract status:", error);
      alert("Failed to update contract status: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (evaluation: Evaluation) => {
    const details = `
Name: ${evaluation.application?.fullName}
Position: ${
      evaluation.application?.vacancy?.title ||
      evaluation.application?.desiredPosition ||
      "N/A"
    }
College: ${
      evaluation.application?.vacancy?.college ||
      evaluation.application?.department ||
      "N/A"
    }
Total Score: ${evaluation.totalScore}/250
Rank: ${evaluation.rank}
Rate per Hour: ₱${evaluation.ratePerHour.toFixed(2)}
Evaluated By: ${evaluation.evaluatedBy}
    `.trim();
    alert(details);
  };

  // NEW: Download PDF handler
  const handleDownloadPdf = async (evaluation: Evaluation) => {
    try {
      const res = await fetch(`/api/evaluations/${evaluation.id}/pdf`, {
        method: "GET",
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(
          err || "Failed to generate evaluation report PDF. Please try again."
        );
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const rawName =
        evaluation.application?.fullName || evaluation.applicationId || "evaluation";
      const safeName = rawName.replace(/[^\w\-]+/g, "_");

      link.href = url;
      link.download = `UDM_Evaluation_Report_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading PDF:", error);
      alert(error.message || "Failed to download evaluation report PDF.");
    }
  };

  const totalInQueue = evaluations.length;
  const pendingCount = evaluations.filter(
    (e) => !e.contractStatus || e.contractStatus === "pending"
  ).length;
  const approvedCount = evaluations.filter(
    (e) => e.contractStatus === "approved"
  ).length;

  // Filter evaluations based on selected status
  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending")
      return !evaluation.contractStatus || evaluation.contractStatus === "pending";
    if (filterStatus === "approved")
      return evaluation.contractStatus === "approved";
    if (filterStatus === "declined")
      return evaluation.contractStatus === "declined";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading contract queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Contract Queue</h2>
          <p className="text-gray-600 mt-1">
            Review and approve evaluated applicants for contract preparation
          </p>
        </div>

        {/* Stats - Now Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus("all")}
            className={`bg-white p-4 rounded-lg shadow-sm border text-left transition-all hover:shadow-md ${
              filterStatus === "all" ? "ring-2 ring-gray-900" : ""
            }`}
          >
            <p className="text-sm text-gray-600">Total in Queue</p>
            <p className="text-2xl font-bold text-gray-900">{totalInQueue}</p>
            {filterStatus === "all" && (
              <p className="text-xs text-gray-500 mt-1">● Currently viewing</p>
            )}
          </button>

          <button
            onClick={() => setFilterStatus("pending")}
            className={`bg-white p-4 rounded-lg shadow-sm border text-left transition-all hover:shadow-md ${
              filterStatus === "pending" ? "ring-2 ring-amber-600" : ""
            }`}
          >
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            {filterStatus === "pending" && (
              <p className="text-xs text-amber-600 mt-1">● Currently viewing</p>
            )}
          </button>

          <button
            onClick={() => setFilterStatus("approved")}
            className={`bg-white p-4 rounded-lg shadow-sm border text-left transition-all hover:shadow-md ${
              filterStatus === "approved" ? "ring-2 ring-green-600" : ""
            }`}
          >
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {approvedCount}
            </p>
            {filterStatus === "approved" && (
              <p className="text-xs text-green-600 mt-1">● Currently viewing</p>
            )}
          </button>
        </div>

        {/* Evaluations List */}
        {filteredEvaluations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filterStatus === "pending" && "No Pending Reviews"}
              {filterStatus === "approved" && "No Approved Applicants"}
              {filterStatus === "declined" && "No Declined Applicants"}
              {filterStatus === "all" && "No Applicants in Queue"}
            </h3>
            <p className="text-gray-600">
              {filterStatus === "pending" &&
                "All qualified applicants have been processed."}
              {filterStatus === "approved" &&
                "No applicants have been approved yet."}
              {filterStatus === "declined" &&
                "No applicants have been declined yet."}
              {filterStatus === "all" &&
                "No qualified applicants in the queue yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvaluations.map((evaluation) => {
              const isPending =
                !evaluation.contractStatus ||
                evaluation.contractStatus === "pending";
              const isApproved = evaluation.contractStatus === "approved";
              const isDeclined = evaluation.contractStatus === "declined";
              const isProcessing = actionLoading === evaluation.id;

              return (
                <div
                  key={evaluation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  {/* Header with Name and Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {evaluation.application?.fullName || "Unknown"}
                        </h3>
                        {isPending && (
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircle size={14} /> Approved
                          </span>
                        )}
                        {isDeclined && (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <XCircle size={14} /> Declined
                          </span>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Position</p>
                          <p className="font-medium text-gray-900 break-words">
                            {evaluation.application?.vacancy?.title ||
                              evaluation.application?.desiredPosition ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            College/Department
                          </p>
                          <p className="font-medium text-gray-900 break-words">
                            {evaluation.application?.vacancy?.college ||
                              evaluation.application?.department ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Evaluation Score
                          </p>
                          <p className="font-medium text-teal-700">
                            {evaluation.totalScore}/250
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rank</p>
                          <p className="font-medium text-gray-900">
                            {evaluation.rank}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Rate per Hour</p>
                          <p className="font-medium text-gray-900">
                            ₱{evaluation.ratePerHour.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Evaluated By</p>
                          <p className="font-medium text-gray-900 break-words">
                            {evaluation.evaluatedBy}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900 break-words">
                            {evaluation.application?.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">
                            {evaluation.application?.phone || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Evaluated:</span>{" "}
                          {new Date(
                            evaluation.evaluatedAt
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div>
                          <span className="font-medium">
                            Submitted to Queue:
                          </span>{" "}
                          {new Date(
                            evaluation.evaluatedAt
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {evaluation.contractActionDate && (
                          <div>
                            <span className="font-medium">Action Date:</span>{" "}
                            {new Date(
                              evaluation.contractActionDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>

                      {evaluation.remarks && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 font-medium mb-1">
                            Remarks:
                          </p>
                          <p className="text-sm text-gray-700">
                            {evaluation.remarks}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() =>
                          handleContractAction(evaluation.id, "approved")
                        }
                        disabled={!isPending || isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          isPending && !isProcessing
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <CheckCircle size={18} />
                        {isProcessing ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() =>
                          handleContractAction(evaluation.id, "declined")
                        }
                        disabled={!isPending || isProcessing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          isPending && !isProcessing
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <XCircle size={18} />
                        {isProcessing ? "Processing..." : "Decline"}
                      </button>

                      {/* View Details */}
                      <button
                        onClick={() => handleViewDetails(evaluation)}
                        className="flex items-center justify-center p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>

                      {/* NEW: Download PDF */}
                      <button
                        onClick={() => handleDownloadPdf(evaluation)}
                        className="flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Download Evaluation PDF"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
