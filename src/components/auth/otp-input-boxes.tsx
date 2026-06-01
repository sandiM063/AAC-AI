"use client";

import { OTP_LENGTH } from "@/lib/otp";
import {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";

type OtpInputBoxesProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function OtpInputBoxes({ value, onChange, disabled }: OtpInputBoxesProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, " ").slice(0, OTP_LENGTH).split("");

  const setDigitAt = useCallback(
    (index: number, digit: string) => {
      const next = value.padEnd(OTP_LENGTH, " ").split("");
      next[index] = digit;
      onChange(next.join("").replace(/\s/g, "").slice(0, OTP_LENGTH));
    },
    [onChange, value],
  );

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function focusInput(index: number) {
    const target = inputRefs.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))];
    target?.focus();
    target?.select();
  }

  function handleChange(index: number, nextValue: string) {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    if (!digit) {
      setDigitAt(index, "");
      return;
    }

    setDigitAt(index, digit);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (digits[index]?.trim()) {
        setDigitAt(index, "");
        return;
      }
      if (index > 0) {
        event.preventDefault();
        setDigitAt(index - 1, "");
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    onChange(pasted);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  return (
    <div
      className="otp-boxes"
      role="group"
      aria-label={`${OTP_LENGTH}-digit verification code`}
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[index]?.trim() ?? ""}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className="otp-box"
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
