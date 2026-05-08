"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Batch = {
  id: number;
  name: string;
  student_count?: number;
};

type Session = {
  id: number;
  title: string;
  date: string;
  trainer_name?: string;
  batch_name?: string;
};

type Attendance = {
  id: number;
  student_id: number;
  student_name?: string;
  status: string;
};

function readList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export default function Trainer() {
  const { user, isLoaded } = useUser();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [batchName, setBatchName] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [batchId, setBatchId] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  const authHeaders = user ? { "clerk-id": user.id } : undefined;

  const loadBatches = async () => {
    if (!user) return;

    const res = await apiFetch("/trainer/batches", {
      headers: authHeaders,
    });
    const data = readList<Batch>(await res.json());
    setBatches(data);

    if (!batchId && data[0]) {
      setBatchId(String(data[0].id));
    }
  };

  const loadSessions = async () => {
    if (!user) return;

    const res = await apiFetch("/sessions", {
      headers: authHeaders,
    });
    setSessions(readList<Session>(await res.json()));
  };

  useEffect(() => {
    if (!user) return;

    window.requestAnimationFrame(() => {
      setIsDashboardLoading(true);
      setError("");

      Promise.all([
        apiFetch("/trainer/batches", {
          headers: {
            "clerk-id": user.id,
          },
        }).then((res) => res.json()),
        apiFetch("/sessions", {
          headers: {
            "clerk-id": user.id,
          },
        }).then((res) => res.json()),
      ])
        .then(([batchData, sessionData]) => {
          const nextBatches = readList<Batch>(batchData);
          setBatches(nextBatches);
          setSessions(readList<Session>(sessionData));

          if (nextBatches[0]) {
            setBatchId(String(nextBatches[0].id));
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unable to load dashboard");
        })
        .finally(() => setIsDashboardLoading(false));
    });
  }, [user]);

  const createBatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setMessage("");
    setError("");
    setInviteLink("");

    try {
      const res = await apiFetch("/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clerk-id": user.id,
        },
        body: JSON.stringify({
          name: batchName,
        }),
      });
      const batch = await res.json();

      setBatchName("");
      setBatchId(String(batch.id));
      setMessage("Batch created");
      await loadBatches();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create batch");
    }
  };

  const generateInviteLink = async (id: number) => {
    const link = `${window.location.origin}/join-batch/${id}`;
    setInviteLink(link);
    setMessage("Invite link generated");

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link);
      setMessage("Invite link copied");
    }
  };

  const createSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setMessage("");
    setError("");

    try {
      await apiFetch("/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clerk-id": user.id,
        },
        body: JSON.stringify({
          title,
          date,
          batch_id: Number(batchId),
        }),
      });

      setTitle("");
      setDate("");
      setMessage("Session created");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create session");
    }
  };

  const viewAttendance = async (sessionId: number) => {
    if (!user) return;

    setSelectedSession(sessionId);
    setError("");

    try {
      const res = await apiFetch(`/session-attendance/${sessionId}`, {
        headers: {
          "clerk-id": user.id,
        },
      });
      setAttendance(readList<Attendance>(await res.json()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load attendance");
    }
  };

  if (!isLoaded) return <main className="p-8">Loading...</main>;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Trainer Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Create batches, invite students, and run sessions.
          </p>
        </div>
        <UserButton />
      </header>

      <section className="mb-8 rounded-md border p-4">
        <h2 className="text-xl font-semibold">Create Batch</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={createBatch}>
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Full Stack Batch A"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            required
          />
          <button className="rounded-md bg-black px-4 py-2 text-white" type="submit">
            Create batch
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <h3 className="font-medium">Your Batches</h3>
          {isDashboardLoading && <p className="text-gray-600">Loading batches...</p>}
          {batches.map((batch) => (
            <article
              className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              key={batch.id}
            >
              <div>
                <p className="font-medium">{batch.name}</p>
                <p className="text-sm text-gray-600">
                  {batch.student_count || 0} students
                </p>
              </div>
              <button
                className="rounded-md border px-4 py-2"
                onClick={() => generateInviteLink(batch.id)}
                type="button"
              >
                Generate Invite Link
              </button>
            </article>
          ))}
          {!isDashboardLoading && batches.length === 0 && (
            <p className="text-gray-600">No batches yet.</p>
          )}
          {inviteLink && (
            <p className="break-all rounded-md bg-gray-50 px-3 py-2 text-sm">
              {inviteLink}
            </p>
          )}
        </div>
      </section>

      <form
        className="mb-8 grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_220px_180px_auto]"
        onSubmit={createSession}
      >
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Session title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select
          className="rounded-md border px-3 py-2"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          required
        >
          <option value="">Select batch</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border px-3 py-2"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button
          className="rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={batches.length === 0}
          type="submit"
        >
          Create
        </button>
      </form>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Sessions</h2>
          {isDashboardLoading && <p className="text-gray-600">Loading sessions...</p>}
          {sessions.map((session) => (
            <article key={session.id} className="rounded-md border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-gray-600">
                    {session.batch_name || "No batch"} -{" "}
                    {new Date(session.date).toLocaleDateString()}{" "}
                    {session.trainer_name ? `- ${session.trainer_name}` : ""}
                  </p>
                </div>
                <button
                  className="rounded-md border px-4 py-2"
                  onClick={() => viewAttendance(session.id)}
                >
                  View attendance
                </button>
              </div>
            </article>
          ))}
          {!isDashboardLoading && sessions.length === 0 && <p>No sessions created yet.</p>}
        </div>

        <aside className="rounded-md border p-4">
          <h2 className="text-xl font-semibold">Attendance</h2>
          {!selectedSession && <p className="mt-3 text-gray-600">Select a session.</p>}
          {selectedSession && attendance.length === 0 && (
            <p className="mt-3 text-gray-600">No attendance marked yet.</p>
          )}
          <div className="mt-3 space-y-2">
            {attendance.map((record) => (
              <p key={record.id} className="rounded-md bg-gray-50 px-3 py-2">
                {record.student_name || `Student ${record.student_id}`} - {record.status}
              </p>
            ))}
          </div>
        </aside>
      </section>

      {message && <p className="mt-5 text-green-700">{message}</p>}
      {error && <p className="mt-5 text-red-600">{error}</p>}
    </main>
  );
}
