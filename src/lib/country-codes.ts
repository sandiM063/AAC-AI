export type CountryCodeOption = {
  dialCode: string;
  label: string;
  iso: string;
};

export const COUNTRY_CODES: CountryCodeOption[] = [
  { dialCode: "+1", label: "United States", iso: "US" },
  { dialCode: "+1", label: "Canada", iso: "CA" },
  { dialCode: "+44", label: "United Kingdom", iso: "GB" },
  { dialCode: "+91", label: "India", iso: "IN" },
  { dialCode: "+977", label: "Nepal", iso: "NP" },
  { dialCode: "+61", label: "Australia", iso: "AU" },
  { dialCode: "+49", label: "Germany", iso: "DE" },
  { dialCode: "+33", label: "France", iso: "FR" },
  { dialCode: "+81", label: "Japan", iso: "JP" },
  { dialCode: "+86", label: "China", iso: "CN" },
  { dialCode: "+52", label: "Mexico", iso: "MX" },
  { dialCode: "+55", label: "Brazil", iso: "BR" },
];
