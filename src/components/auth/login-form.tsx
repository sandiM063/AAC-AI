"use client";

import { useReadonlyUntilFocus } from "@/hooks/use-readonly-until-focus";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { InputField } from "./input-field";
import { LockIcon, MailIcon } from "./auth-icons";
import { PhoneNumberField } from "./phone-number-field";

type LoginMethod = "email" | "phone";

export function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const passwordField = useReadonlyUntilFocus();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginMethod,
          email: loginMethod === "email" ? email : undefined,
          countryCode: loginMethod === "phone" ? countryCode : undefined,
          phone: loginMethod === "phone" ? phone : undefined,
          password,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        fieldErrors?: Record<string, string>;
        needsOnboarding?: boolean;
      };

      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setFormError(data.error ?? "Unable to sign in");
        }
        return;
      }

      router.push(
        data.needsOnboarding ? "/onboarding" : "/dashboard",
      );
      router.refresh();
    } catch {
      setFormError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 space-y-4"
      noValidate
      autoComplete="off"
    >
      <input
        type="text"
        name="aac-prevent-autofill"
        tabIndex={-1}
        autoComplete="off"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        aria-hidden
      />

      {formError && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-aac-foreground">Sign in with</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`auth-method-tab ${loginMethod === "email" ? "auth-method-tab-active" : ""}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`auth-method-tab ${loginMethod === "phone" ? "auth-method-tab-active" : ""}`}
          >
            Phone
          </button>
        </div>
      </fieldset>

      {loginMethod === "email" ? (
        <InputField
          id="login-email"
          label="Email"
          type="email"
          name="aac-login-email"
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
          idPrefix="login"
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
        id="login-password"
        label="Password"
        type="password"
        name="aac-login-password"
        placeholder="Enter your password"
        icon={<LockIcon className="h-5 w-5" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={passwordField.unlock}
        readOnly={passwordField.readonly}
        disabled={isLoading}
        error={fieldErrors.password}
        autoComplete="off"
      />

      <button type="submit" disabled={isLoading} className="aac-button-primary auth-submit">
        {isLoading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-aac-muted lg:hidden">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-aac-primary hover:underline"
        >
          Create account
        </button>
      </p>
    </form>
  );
}
