"use client";

import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;

      try {
        const res = await apiFetch(`/get-user/${user.id}`);
        const data = await res.json();

        if (data?.role === "student") router.push("/student");
        else if (data?.role === "trainer") router.push("/trainer");
        else if (data?.role === "institution") router.push("/institution");
        else if (data?.role === "monitoring_officer") router.push("/monitoring");
        else router.push("/select-role");
      } catch {
        router.push("/select-role");
      }
    };

    if (isLoaded) checkRole();
  }, [user, isLoaded, router]);

  if (!isLoaded) return <main className="p-8">Loading...</main>;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      {isSignedIn ? (
        <p>Redirecting...</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-semibold">SkillBridge</h1>
            <p className="mt-3 text-lg text-gray-600">
              Attendance, roles, and training sessions in one working flow.
            </p>
          </div>

          <div className="flex gap-3">
            <SignInButton mode="modal">
              <button className="rounded-md bg-black px-4 py-2 text-white">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-md border px-4 py-2">Sign up</button>
            </SignUpButton>
          </div>
        </div>
      )}
    </main>
  );
}
