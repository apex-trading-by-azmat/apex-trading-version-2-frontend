"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import assets from "@/assets/assets";

/**
 * Dashboard Protected Layout Guard
 * Verifies that `access_token` exists in localStorage before rendering
 * `/dashboard` or any subroute (`/dashboard/*`). Redirects to `/auth/login` if missing.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      router.replace("/auth/login");
    } else {
      setAuthorized(true);
    }
  }, [router, pathname]);

  return (
    <>
      {!authorized && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-secondary/80 border border-border flex items-center justify-center p-1.5 shadow-md">
            <Image
              src={assets.logo}
              alt="Apex Signal Trading"
              width={36}
              height={36}
              className="w-full h-full object-contain animate-pulse"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Verifying Terminal Authorization...
            </span>
          </div>
        </div>
      )}
      <div className={!authorized ? "invisible select-none pointer-events-none" : undefined}>
        {children}
      </div>
    </>
  );
}
