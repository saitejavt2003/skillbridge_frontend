"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Batch = {
  id: number;
  name: string;
};

export default function JoinBatchPage() {
  const { user, isLoaded } = useUser();
  const params = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user || !params.batchId) return;

    const joinBatch = async () => {
      try {
        const batchRes = await apiFetch(`/batches/${params.batchId}`);
        setBatch(await batchRes.json());

        const joinRes = await apiFetch(`/join-batch/${params.batchId}`, {
          method: "POST",
          headers: {
            "clerk-id": user.id,
          },
        });
        const data = await joinRes.json();
        setMessage(`You joined ${data.batch.name}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to join batch. Make sure your account role is Student."
        );
      }
    };

    joinBatch();
  }, [isLoaded, params.batchId, user]);

  if (!isLoaded) return <main className="p-8">Loading...</main>;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="rounded-md border p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Join Batch</h1>
            <p className="mt-2 text-gray-600">
              {batch?.name || "Joining your trainer's batch..."}
            </p>
          </div>
          <UserButton />
        </div>

        {message && <p className="text-green-700">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="mt-6">
          <Link className="rounded-md bg-black px-4 py-2 text-white" href="/student">
            Go to student dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
