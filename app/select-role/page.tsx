"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

const roles = ["student", "trainer", "institution", "monitoring_officer"] as const;

const roleRoutes: Record<(typeof roles)[number], string> = {
  student: "/student",
  trainer: "/trainer",
  institution: "/institution",
  monitoring_officer: "/monitoring",
};

export default function SelectRole() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded) {
    return <main className="p-8">Loading...</main>;
  }

  const saveRole = async () => {
    if (!user || !role) return;

    setIsSaving(true);
    setError("");

    try {
      await apiFetch("/save-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_user_id: user.id,
          name: user.fullName || user.firstName || "User",
          role,
        }),
      });

      router.push(roleRoutes[role as (typeof roles)[number]]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save role");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Select your role</h1>
          <p className="mt-2 text-gray-600">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
        </div>

        <select
          className="w-full rounded-md border px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Choose role</option>
          {roles.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption
                .split("_")
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(" ")}
            </option>
          ))}
        </select>

        <button
          className="rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={!role || isSaving}
          onClick={saveRole}
        >
          {isSaving ? "Saving..." : "Save role"}
        </button>

        {error && <p className="text-red-600">{error}</p>}
      </div>
    </main>
  );
}
