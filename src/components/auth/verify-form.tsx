"use client";

import { OTP_LENGTH, OTP_TTL_SECONDS } from "@/lib/otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { OtpIllustration } from "./otp-illustration";
import { OtpInputBoxes } from "./otp-input-boxes";

type VerifyFormProps = {
  pendingId: string;
  firstName: string;
  destination: string;
  method: "email" | "phone";
  initialExpiresAt: string;
};

export function VerifyForm({
  pendingId,
  firstName,
  destination,
  method,
  initialExpiresAt,
}: VerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getSecondsRemaining(initialExpiresAt),
  );

  const canResend = secondsLeft <= 0;
  const channelWord = method === "email" ? "email" : "mobile";

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = useCallback(async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId }),
      });

      const data = (await response.json()) as {
        error?: string;
        expiresAt?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not resend code");
        return;
      }

      if (data.expiresAt) {
        setSecondsLeft(getSecondsRemaining(data.expiresAt));
      } else {
        setSecondsLeft(OTP_TTL_SECONDS);
      }

      setCode("");
    } catch {
      setError("Unable to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  }, [canResend, isResending, pendingId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId, code }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }

      router.push("/onboarding/profession");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="verify-form" noValidate>
      <Link href="/login" className="verify-back" aria-label="Back to sign in">
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <OtpIllustration />

      <h1 className="verify-title">OTP Verification</h1>
      <p className="verify-greeting">Hello {firstName},</p>

      <p className="verify-instructions">
        Thank you for registering with us. Please type the OTP as shared on your{" "}
        {channelWord}{" "}
        <span className="font-medium text-aac-foreground">{destination}</span>.
        {!canResend && (
          <>
            {" "}
            Code expires in{" "}
            <span className="font-semibold text-aac-primary">{secondsLeft}s</span>.
          </>
        )}
      </p>

      {error && (
        <div role="alert" className="verify-error">
          {error}
        </div>
      )}

      <OtpInputBoxes value={code} onChange={setCode} disabled={isLoading} />

      <p className="verify-resend-line">
        OTP not received?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend || isResending}
          className="verify-resend-button"
        >
          {isResending
            ? "Sending…"
            : canResend
              ? "Resend"
              : `Resend in ${secondsLeft}s`}
        </button>
      </p>

      <button
        type="submit"
        disabled={isLoading || code.length !== OTP_LENGTH}
        className="verify-submit"
      >
        {isLoading ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function getSecondsRemaining(expiresAt: string): number {
  if (!expiresAt) return OTP_TTL_SECONDS;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, Math.min(diff, OTP_TTL_SECONDS));
}
