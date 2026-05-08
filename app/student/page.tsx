"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Session = {
  id: number;
  title: string;
  date: string;
  trainer_name?: string;
  batch_name?: string;
};

export default function Student() {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;

      try {
        const res = await apiFetch("/sessions", {
          headers: {
            "clerk-id": user.id,
          },
        });
        setSessions(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load sessions");
      }
    };

    if (isLoaded) loadSessions();
  }, [user, isLoaded]);

  const markAttendance = async (sessionId: number) => {
    if (!user) return;

    setMessage("");
    setError("");

    try {
      const res = await apiFetch("/mark-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clerk-id": user.id,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });
      const data = await res.json();
      setMessage(data.message || "Attendance marked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark attendance");
    }
  };

  if (!isLoaded) return <main className="p-8">Loading...</main>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Student Dashboard</h1>
          <p className="mt-1 text-gray-600">Welcome, {user?.firstName || "student"}</p>
        </div>
        <UserButton />
      </header>

      <section className="space-y-3">
        {sessions.map((session) => (
          <article key={session.id} className="rounded-md border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium">{session.title}</h2>
                <p className="text-sm text-gray-600">
                  {session.batch_name || "No batch"} -{" "}
                  {new Date(session.date).toLocaleDateString()}{" "}
                  {session.trainer_name ? `- ${session.trainer_name}` : ""}
                </p>
              </div>
              <button
                className="rounded-md bg-black px-4 py-2 text-white"
                onClick={() => markAttendance(session.id)}
              >
                Mark attendance
              </button>
            </div>
          </article>
        ))}

        {sessions.length === 0 && <p>No sessions available yet.</p>}
      </section>

      {message && <p className="mt-5 text-green-700">{message}</p>}
      {error && <p className="mt-5 text-red-600">{error}</p>}
    </main>
  );
}
