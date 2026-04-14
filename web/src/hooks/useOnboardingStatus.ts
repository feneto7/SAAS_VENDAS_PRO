import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type OnboardingStep = "personal" | "company" | "completed" | "loading" | "error";

export function useOnboardingStatus() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [tenant, setTenant] = useState<{ slug: string; name: string } | null>(null);

  const checkStatus = useCallback(async () => {
    if (!isLoaded || !user) {
        if (isLoaded && !user) setStep("personal"); // Public user
        return;
    }

    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";
      const res = await fetch(`${serverUrl}/auth/status/${user.id}`);
      
      if (!res.ok) throw new Error("Failed to fetch status");

      const data = await res.json();
      setStep(data.onboardingStep);
      setTenant(data.tenant || null);

      if (data.tenant?.slug) {
        localStorage.setItem("tenant_slug", data.tenant.slug);
      }

      // Logic for automatic redirection based on path
      if ((pathname.startsWith("/dashboard") || pathname === "/") && data.onboardingStep !== "completed") {
        if (data.onboardingStep === 'personal') {
          router.push("/setup/personal");
        } else if (data.onboardingStep === 'company' || (data.hasTenant && data.onboardingStep !== 'completed')) {
          router.push("/setup");
        }
      }
      
      if ((pathname === "/setup" || pathname === "/setup/personal" || pathname === "/") && data.onboardingStep === "completed") {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error("Onboarding status check error:", err);
      setStep("error");
    }
  }, [isLoaded, user, router, pathname]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { step, tenant, isLoaded, user, refresh: checkStatus };
}
