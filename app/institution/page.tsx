"use client";

import { UserButton } from "@clerk/nextjs";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { readList, useRequiredRole } from "@/lib/roles";

type BatchSummary = {
  id: number;
  name: string;
  student_count: number;
  session_count: number;
  attendance_percentage: string | number;
};

type Trainer = {
  id: number;
  clerk_user_id: string;
  name: string;
  batch_count: number;
};

export default function InstitutionDashboard() {
  const { user, isLoaded, isAuthorized, isCheckingRole, roleError } =
    useRequiredRole("institution");
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [batchName, setBatchName] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [trainerClerkId, setTrainerClerkId] = useState("");
  const [trainerBatchId, setTrainerBatchId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    if (!user) return;

    const headers = { "clerk-id": user.id };
    const [batchRes, trainerRes] = await Promise.all([
      apiFetch("/batches/institution", { headers }),
      apiFetch("/institution/trainers", { headers }),
    ]);

    setBatches(readList<BatchSummary>(await batchRes.json()));
    setTrainers(readList<Trainer>(await trainerRes.json()));
  };

  useEffect(() => {
    if (!user || !isAuthorized) return;

    window.requestAnimationFrame(() => {
      const headers = { "clerk-id": user.id };
      setIsLoading(true);
      setError("");
      Promise.all([
        apiFetch("/batches/institution", { headers }).then((res) => res.json()),
        apiFetch("/institution/trainers", { headers }).then((res) => res.json()),
      ])
        .then(([batchData, trainerData]) => {
          setBatches(readList<BatchSummary>(batchData));
          setTrainers(readList<Trainer>(trainerData));
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unable to load institution data");
        })
        .finally(() => setIsLoading(false));
    });
  }, [isAuthorized, user]);

  const createBatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setError("");
    setMessage("");

    try {
      await apiFetch("/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clerk-id": user.id,
        },
        body: JSON.stringify({ name: batchName }),
      });
      setBatchName("");
      setMessage("Batch created");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create batch");
    }
  };

  const assignTrainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setError("");
    setMessage("");

    try {
      await apiFetch("/trainers/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "clerk-id": user.id,
        },
        body: JSON.stringify({
          clerk_user_id: trainerClerkId,
          name: trainerName,
          batch_id: trainerBatchId ? Number(trainerBatchId) : undefined,
        }),
      });
      setTrainerName("");
      setTrainerClerkId("");
      setTrainerBatchId("");
      setMessage("Trainer assigned");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign trainer");
    }
  };

  if (!isLoaded || isCheckingRole) {
    return <main className="p-8">Checking institution access...</main>;
  }

  if (!isAuthorized) {
    return (
      <main className="p-8">
        <p className="text-red-600">{roleError || "Redirecting to your dashboard..."}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Institution Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Manage batches, trainers, and attendance performance.
          </p>
        </div>
        <UserButton />
      </header>

      <section className="mb-8 grid gap-4 lg:grid-cols-2">
        <form className="rounded-md border p-4" onSubmit={createBatch}>
          <h2 className="text-xl font-semibold">Create Batch</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Full Stack Batch A"
              value={batchName}
              onChange={(event) => setBatchName(event.target.value)}
              required
            />
            <button className="rounded-md bg-black px-4 py-2 text-white" type="submit">
              Create
            </button>
          </div>
        </form>

        <form className="rounded-md border p-4" onSubmit={assignTrainer}>
          <h2 className="text-xl font-semibold">Assign Trainer</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Trainer name"
              value={trainerName}
              onChange={(event) => setTrainerName(event.target.value)}
              required
            />
            <input
              className="rounded-md border px-3 py-2"
              placeholder="Trainer Clerk user ID"
              value={trainerClerkId}
              onChange={(event) => setTrainerClerkId(event.target.value)}
              required
            />
            <select
              className="rounded-md border px-3 py-2"
              value={trainerBatchId}
              onChange={(event) => setTrainerBatchId(event.target.value)}
            >
              <option value="">Assign to batch later</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
            <button className="rounded-md bg-black px-4 py-2 text-white" type="submit">
              Assign trainer
            </button>
          </div>
        </form>
      </section>

      {isLoading && <p>Loading institution data...</p>}

      {!isLoading && (
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-3 text-xl font-semibold">Batches</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {batches.map((batch) => (
                <article className="rounded-md border p-4" key={batch.id}>
                  <h3 className="font-medium">{batch.name}</h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Students</p>
                      <p className="text-lg font-semibold">{batch.student_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Sessions</p>
                      <p className="text-lg font-semibold">{batch.session_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Attendance</p>
                      <p className="text-lg font-semibold">
                        {Number(batch.attendance_percentage).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {batches.length === 0 && <p className="text-gray-600">No batches yet.</p>}
          </div>

          <aside className="rounded-md border p-4">
            <h2 className="text-xl font-semibold">Trainers</h2>
            <div className="mt-4 space-y-3">
              {trainers.map((trainer) => (
                <article className="rounded-md bg-gray-50 px-3 py-2" key={trainer.id}>
                  <p className="font-medium">{trainer.name}</p>
                  <p className="text-sm text-gray-600">{trainer.clerk_user_id}</p>
                  <p className="text-sm text-gray-600">{trainer.batch_count} batches</p>
                </article>
              ))}
              {trainers.length === 0 && <p className="text-gray-600">No trainers assigned.</p>}
            </div>
          </aside>
        </section>
      )}

      {message && <p className="mt-5 text-green-700">{message}</p>}
      {error && <p className="mt-5 text-red-600">{error}</p>}
    </main>
  );
}
