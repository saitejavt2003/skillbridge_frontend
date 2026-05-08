"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { readList, useRequiredRole } from "@/lib/roles";

type ProgrammeSummary = {
  total_institutions: number;
  total_batches: number;
  total_sessions: number;
  total_students: number;
  overall_attendance_percentage: string | number;
};

type InstitutionSummary = {
  id: number;
  name: string;
  batch_count: number;
  trainer_count: number;
  student_count: number;
  session_count: number;
  attendance_percentage: string | number;
};

export default function MonitoringDashboard() {
  const { user, isLoaded, isAuthorized, isCheckingRole, roleError } =
    useRequiredRole("monitoring_officer");
  const [summary, setSummary] = useState<ProgrammeSummary | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !isAuthorized) return;

    window.requestAnimationFrame(() => {
      const headers = { "clerk-id": user.id };
      setIsLoading(true);
      setError("");

      Promise.all([
        apiFetch("/programme/summary", { headers }).then((res) => res.json()),
        apiFetch("/institutions/summary", { headers }).then((res) => res.json()),
      ])
        .then(([programmeData, institutionData]) => {
          setSummary(programmeData);
          setInstitutions(readList<InstitutionSummary>(institutionData));
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unable to load monitoring data");
        })
        .finally(() => setIsLoading(false));
    });
  }, [isAuthorized, user]);

  if (!isLoaded || isCheckingRole) {
    return <main className="p-8">Checking monitoring access...</main>;
  }

  if (!isAuthorized) {
    return (
      <main className="p-8">
        <p className="text-red-600">{roleError || "Redirecting to your dashboard..."}</p>
      </main>
    );
  }

  const cards = summary
    ? [
        ["Institutions", summary.total_institutions],
        ["Batches", summary.total_batches],
        ["Sessions", summary.total_sessions],
        ["Students", summary.total_students],
        [
          "Attendance",
          `${Number(summary.overall_attendance_percentage).toFixed(1)}%`,
        ],
      ]
    : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Monitoring Officer Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Programme-wide attendance and institution performance.
          </p>
        </div>
        <UserButton />
      </header>

      {isLoading && <p>Loading monitoring data...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && summary && (
        <>
          <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map(([label, value]) => (
              <article className="rounded-md border p-4" key={label}>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-md border">
            <div className="border-b p-4">
              <h2 className="text-xl font-semibold">Institution Summaries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-3">Institution</th>
                    <th className="p-3">Batches</th>
                    <th className="p-3">Trainers</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">Sessions</th>
                    <th className="p-3">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr className="border-b" key={institution.id}>
                      <td className="p-3 font-medium">{institution.name}</td>
                      <td className="p-3">{institution.batch_count}</td>
                      <td className="p-3">{institution.trainer_count}</td>
                      <td className="p-3">{institution.student_count}</td>
                      <td className="p-3">{institution.session_count}</td>
                      <td className="p-3">
                        {Number(institution.attendance_percentage).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {institutions.length === 0 && (
              <p className="p-4 text-gray-600">No institution data yet.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
