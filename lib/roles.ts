"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type UserRole =
  | "student"
  | "trainer"
  | "institution"
  | "monitoring_officer";

export const roleRoutes: Record<UserRole, string> = {
  student: "/student",
  trainer: "/trainer",
  institution: "/institution",
  monitoring_officer: "/monitoring",
};

export function isUserRole(role: unknown): role is UserRole {
  return (
    role === "student" ||
    role === "trainer" ||
    role === "institution" ||
    role === "monitoring_officer"
  );
}

export function readList<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function useRequiredRole(requiredRole: UserRole) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    const frame = window.requestAnimationFrame(() => {
      if (!user) {
        setIsCheckingRole(false);
        setIsAuthorized(false);
        return;
      }

      setIsCheckingRole(true);
      setRoleError("");

      apiFetch(`/get-user/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          const role = data?.role;

          if (role === requiredRole) {
            setIsAuthorized(true);
            return;
          }

          setIsAuthorized(false);
          router.replace(isUserRole(role) ? roleRoutes[role] : "/select-role");
        })
        .catch((err) => {
          setIsAuthorized(false);
          setRoleError(err instanceof Error ? err.message : "Unable to verify role");
          router.replace("/select-role");
        })
        .finally(() => setIsCheckingRole(false));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoaded, requiredRole, router, user]);

  return {
    user,
    isLoaded,
    isAuthorized,
    isCheckingRole,
    roleError,
  };
}
