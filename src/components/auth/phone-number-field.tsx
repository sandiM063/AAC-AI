import { COUNTRY_CODES } from "@/lib/country-codes";
import { PhoneIcon } from "./auth-icons";

type PhoneNumberFieldProps = {
  idPrefix: string;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  countryCodeError?: string;
  phoneError?: string;
  disabled?: boolean;
};

export function PhoneNumberField({
  idPrefix,
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  countryCodeError,
  phoneError,
  disabled,
}: PhoneNumberFieldProps) {
  return (
    <div className="phone-field">
      <div className="phone-field-grid">
        <div className="phone-field-code-wrap">
          <label htmlFor={`${idPrefix}-countryCode`} className="sr-only">
            Country code
          </label>
          <select
            id={`${idPrefix}-countryCode`}
            aria-label="Country code"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            disabled={disabled}
            className="aac-input auth-input phone-field-code"
          >
            {COUNTRY_CODES.map((country) => (
              <option
                key={`${country.iso}-${country.dialCode}`}
                value={country.dialCode}
              >
                {country.dialCode} {country.iso}
              </option>
            ))}
          </select>
        </div>

        <div className="phone-field-input-wrap">
          <label htmlFor={`${idPrefix}-phone`} className="sr-only">
            Phone number
          </label>
          <div className="relative min-w-0">
            <span
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-aac-muted"
              aria-hidden
            >
              <PhoneIcon className="h-5 w-5" />
            </span>
            <input
              id={`${idPrefix}-phone`}
              type="tel"
              inputMode="numeric"
              name={`${idPrefix}-phone`}
              placeholder="Phone number"
              className="aac-input auth-input auth-input-with-icon w-full"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={disabled}
              autoComplete="off"
              aria-invalid={phoneError ? true : undefined}
            />
          </div>
        </div>
      </div>

      {countryCodeError && (
        <p className="mt-1.5 text-xs text-red-600">{countryCodeError}</p>
      )}
      {phoneError && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {phoneError}
        </p>
      )}
    </div>
  );
}
