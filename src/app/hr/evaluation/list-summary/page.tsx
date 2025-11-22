// src/app/hr/evaluation/list-summary/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';


function formatDate(d: Date | null | undefined) {
  if (!d) return '';
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}


function makeEvaluationNumber(index: number, evaluatedAt: Date | null | undefined) {
  if (!evaluatedAt) return '';
  const year = evaluatedAt.getFullYear();
  const nextYear = year + 1;
  const seq = String(index + 1).padStart(3, '0');
  return `${year}-${nextYear}_${seq}`;
}


export default async function ListSummaryPage() {
  const evaluations = await prisma.evaluation.findMany({
    include: {
      application: {
        include: {
          vacancy: true,
        },
      },
    },
    orderBy: { evaluatedAt: 'asc' },
  });


  // Layout wrapper: fill almost full viewport, let inner card own the space
  return (
    <div className="h-[calc(100vh-2rem)] w-full p-3 md:p-4">
      <div className="h-full w-full rounded-xl bg-white shadow flex flex-col overflow-hidden">
        {/* Header with Back button */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/hr/evaluation"
              className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Back to Evaluation
            </Link>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">List Summary</h1>
          </div>
        </div>


        {/* Content area (fills remaining height, table scrolls inside) */}
        <div className="flex-1 overflow-auto">
          {evaluations.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 py-6">
              <p className="text-sm text-gray-600">
                No evaluations recorded yet.
              </p>
            </div>
          ) : (
            <div className="min-w-full">
              <table className="min-w-full text-[11px] md:text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border px-2 py-1">NO.</th>
                    <th className="border px-2 py-1">DATE RECEIVED</th>
                    <th className="border px-2 py-1">DATE EVALUATED</th>
                    <th className="border px-2 py-1">DATE ENDORSED TO DEAN/NPA</th>
                    <th className="border px-2 py-1">EVALUATION NUMBER</th>
                    <th className="border px-2 py-1">NAME</th>
                    <th className="border px-2 py-1">Educational Qualifications (max 85)</th>
                    <th className="border px-2 py-1">Academic Experience (max 25)</th>
                    <th className="border px-2 py-1">
                      Professional Development (max 90)
                    </th>
                    <th className="border px-2 py-1">
                      Technological Knowledge (max 50)
                    </th>
                    <th className="border px-2 py-1">TOTAL POINTS (max 250)</th>
                    <th className="border px-2 py-1">Rank</th>
                    <th className="border px-2 py-1">Accorded RATE/hr</th>
                    <th className="border px-2 py-1">Educational Attainment</th>
                    <th className="border px-2 py-1">Relevant Experience</th>
                    <th className="border px-2 py-1">Relevant Training</th>
                    <th className="border px-2 py-1">Technical Competency</th>
                    <th className="border px-2 py-1">
                      Eligibility (Board / TESDA NC)
                    </th>
                    <th className="border px-2 py-1">
                      Unpublished/Published Research
                    </th>
                    <th className="border px-2 py-1">Civic Welfare Activities</th>
                    <th className="border px-2 py-1">COLLEGE</th>
                    <th className="border px-2 py-1">Dean / Certified Correct by</th>
                    <th className="border px-2 py-1">Position (Certified Correct)</th>
                    <th className="border px-2 py-1">Birthdate</th>
                    <th className="border px-2 py-1">Gender</th>
                    <th className="border px-2 py-1">Civil Status</th>
                    <th className="border px-2 py-1">Teaching Load</th>
                    <th className="border px-2 py-1">Subjects Taught</th>
                    <th className="border px-2 py-1">Contact No</th>
                    <th className="border px-2 py-1">Email Add</th>
                    <th className="border px-2 py-1">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((evalRow, index) => {
                    const app = evalRow.application;
                    const vac = app?.vacancy;
                    return (
                      <tr key={evalRow.id} className="hover:bg-gray-50">
                        {/* NO. */}
                        <td className="border px-2 py-1 text-center">
                          {index + 1}
                        </td>


                        {/* DATE RECEIVED */}
                        <td className="border px-2 py-1 text-center">
                          {formatDate(app?.appliedDate ?? null)}
                        </td>


                        {/* DATE EVALUATED */}
                        <td className="border px-2 py-1 text-center">
                          {formatDate(evalRow.evaluatedAt)}
                        </td>


                        {/* DATE ENDORSED TO DEAN/NPA */}
                        <td className="border px-2 py-1 text-center">
                          {formatDate(app?.endorsedDate ?? null)}
                        </td>


                        {/* EVALUATION NUMBER */}
                        <td className="border px-2 py-1 text-center">
                          {makeEvaluationNumber(index, evalRow.evaluatedAt)}
                        </td>


                        {/* NAME */}
                        <td className="border px-2 py-1">
                          {app?.fullName}
                        </td>


                        {/* Category scores */}
                        <td className="border px-2 py-1 text-center">
                          {evalRow.educationalScore.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {evalRow.experienceScore.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {evalRow.professionalDevScore.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {evalRow.technologicalScore.toFixed(2)}
                        </td>
                        <td className="border px-2 py-1 text-center font-semibold">
                          {evalRow.totalScore.toFixed(2)}
                        </td>


                        {/* Rank & rate */}
                        <td className="border px-2 py-1 text-center">
                          {evalRow.rank ?? ''}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {evalRow.ratePerHour != null
                            ? evalRow.ratePerHour.toFixed(2)
                            : ''}
                        </td>


                        {/* Educational Attainment */}
                        <td className="border px-2 py-1">
                          {app?.highestDegree ?? ''}
                        </td>


                        {/* Placeholder columns (not yet mapped) */}
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />


                        {/* College */}
                        <td className="border px-2 py-1">
                          {vac?.college ?? ''}
                        </td>


                        {/* Dean / Position – not stored yet */}
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />


                        {/* Personal info */}
                        <td className="border px-2 py-1 text-center">
                          {formatDate(app?.dob ?? null)}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {app?.gender ?? ''}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {app?.civilStatus ?? ''}
                        </td>


                        {/* Teaching load / subjects – not stored yet */}
                        <td className="border px-2 py-1" />
                        <td className="border px-2 py-1" />


                        {/* Contact / email */}
                        <td className="border px-2 py-1">
                          {app?.contactNo ?? app?.phone ?? ''}
                        </td>
                        <td className="border px-2 py-1">
                          {app?.email ?? ''}
                        </td>


                        {/* Remarks */}
                        <td className="border px-2 py-1">
                          {evalRow.remarks ?? ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Footer note */}
        <div className="border-t px-4 py-2 text-[10px] md:text-[11px] text-gray-500">
          Note: Some columns are blank because the current Prisma schema does not yet
          store those specific values. You can later extend the schema and update this
          page to populate them (e.g., from <code>detailedScores</code> JSON or new
          fields).
        </div>
      </div>
    </div>
  );
}
