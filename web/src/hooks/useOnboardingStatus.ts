import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export type OnboardingStep = "personal" | "company" | "completed" | "loading" | "error";

export function useOnboardingStatus() {
  const { user, loading: isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [tenant, setTenant] = useState<{ slug: string; name: string } | null>(null);

  const checkStatus = useCallback(async () => {
    console.log('[useOnboardingStatus] Checking status...', { isLoaded, userId: user?.id });
    // loading property in useAuth means we're still checking session
    if (isLoaded || !user) {
        if (!isLoaded && !user) {
          console.log('[useOnboardingStatus] Auth loaded, no user. Setting step to personal.');
          setStep("personal");
        }
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

      if ((pathname.startsWith("/dashboard") || pathname === "/") && data.onboardingStep !== "completed") {
        console.log('[useOnboardingStatus] Redirecting based on step:', data.onboardingStep);
        if (data.onboardingStep === 'personal') {
          router.push("/setup/personal");
        } else if (data.onboardingStep === 'company' || (data.hasTenant && data.onboardingStep !== 'completed')) {
          router.push("/setup");
        }
      }
      
      if ((pathname === "/setup" || pathname === "/setup/personal" || pathname === "/") && data.onboardingStep === "completed") {
        console.log('[useOnboardingStatus] Completed. Redirecting to dashboard.');
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
