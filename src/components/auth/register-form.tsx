"use client";

import { useReadonlyUntilFocus } from "@/hooks/use-readonly-until-focus";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { InputField } from "./input-field";
import { AuthDivider, GoogleSignInButton } from "./google-sign-in-button";
import { LockIcon, MailIcon, UserIcon } from "./auth-icons";
import { PhoneNumberField } from "./phone-number-field";

type VerificationMethod = "email" | "phone";

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationMethod, setVerificationMethod] =
    useState<VerificationMethod>("email");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const passwordField = useReadonlyUntilFocus();
  const confirmPasswordField = useReadonlyUntilFocus();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          verificationMethod,
          email: verificationMethod === "email" ? email : undefined,
          countryCode: verificationMethod === "phone" ? countryCode : undefined,
          phone: verificationMethod === "phone" ? phone : undefined,
          password,
          confirmPassword,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        fieldErrors?: Record<string, string>;
        pendingId?: string;
        firstName?: string;
        destination?: string;
        method?: VerificationMethod;
        expiresAt?: string;
      };

      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setFormError(data.error ?? "Unable to register");
        }
        return;
      }

      const params = new URLSearchParams({
        id: data.pendingId!,
        firstName: data.firstName ?? firstName,
        destination: data.destination ?? "",
        method: data.method ?? verificationMethod,
        expiresAt: data.expiresAt ?? "",
      });

      router.push(`/verify?${params.toString()}`);
    } catch {
      setFormError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative min-w-0 space-y-4"
      noValidate
      autoComplete="off"
    >
      {formError && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <GoogleSignInButton disabled={isLoading} />
      <AuthDivider />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          id="firstName"
          label="First name"
          placeholder="First name"
          icon={<UserIcon className="h-5 w-5" />}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isLoading}
          error={fieldErrors.firstName}
          autoComplete="given-name"
        />
        <InputField
          id="lastName"
          label="Last name"
          placeholder="Last name"
          icon={<UserIcon className="h-5 w-5" />}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isLoading}
          error={fieldErrors.lastName}
          autoComplete="family-name"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-aac-foreground">
          Verify with
        </legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVerificationMethod("email")}
            className={`auth-method-tab ${verificationMethod === "email" ? "auth-method-tab-active" : ""}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setVerificationMethod("phone")}
            className={`auth-method-tab ${verificationMethod === "phone" ? "auth-method-tab-active" : ""}`}
          >
            Phone
          </button>
        </div>
      </fieldset>

      {verificationMethod === "email" ? (
        <InputField
          id="email"
          label="Email"
          type="email"
          placeholder="Email"
          icon={<MailIcon className="h-5 w-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          error={fieldErrors.email}
          autoComplete="off"
        />
      ) : (
        <PhoneNumberField
          idPrefix="register"
          countryCode={countryCode}
          phone={phone}
          onCountryCodeChange={setCountryCode}
          onPhoneChange={setPhone}
          countryCodeError={fieldErrors.countryCode}
          phoneError={fieldErrors.phone}
          disabled={isLoading}
        />
      )}

      <InputField
        id="password"
        label="Password"
        type="password"
        name="aac-register-password"
        placeholder="Create a password"
        icon={<LockIcon className="h-5 w-5" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={passwordField.unlock}
        readOnly={passwordField.readonly}
        disabled={isLoading}
        error={fieldErrors.password}
        autoComplete="off"
      />

      <InputField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        name="aac-register-confirm-password"
        placeholder="Re-enter password"
        icon={<LockIcon className="h-5 w-5" />}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onFocus={confirmPasswordField.unlock}
        readOnly={confirmPasswordField.readonly}
        disabled={isLoading}
        error={fieldErrors.confirmPassword}
        autoComplete="off"
      />

      <button type="submit" disabled={isLoading} className="aac-button-primary auth-submit">
        {isLoading ? "Creating account…" : "Sign up"}
      </button>

      <p className="text-center text-sm text-aac-muted lg:hidden">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-aac-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
