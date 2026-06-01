"use client";

import {
  searchProfessions,
  type Profession,
  type ProfessionId,
} from "@/lib/professions";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProfessionPickerProps = {
  firstName: string;
};

export function ProfessionPicker({ firstName }: ProfessionPickerProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<ProfessionId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const results = useMemo(() => searchProfessions(query), [query]);

  async function handleContinue() {
    if (!selectedId) {
      setError("Select a profession to continue");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionId: selectedId }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to save your profession");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="profession-picker">
      <header className="profession-picker-header">
        <span className="profession-picker-badge">Step 1 of 1</span>
        <h1 className="profession-picker-title">
          Welcome, {firstName}. What is your profession?
        </h1>
        <p className="profession-picker-subtitle">
          Physicians, caregivers, and educators share communication goals but get
          different presets and templates. Search to find your role.
        </p>
      </header>

      <div className="profession-search-wrap">
        <svg
          className="profession-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M16.5 16.5L21 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search physician, caregiver, teacher, education…"
          className="profession-search-input"
          aria-label="Search professions"
        />
      </div>

      {error && (
        <div role="alert" className="profession-error">
          {error}
        </div>
      )}

      <div className="profession-results" role="listbox" aria-label="Professions">
        {results.length === 0 ? (
          <p className="profession-empty">
            No professions match your search. Try &quot;physician&quot;,
            &quot;caregiver&quot;, or &quot;teacher&quot;.
          </p>
        ) : (
          results.map((profession) => (
            <ProfessionCard
              key={profession.id}
              profession={profession}
              selected={selectedId === profession.id}
              onSelect={() => {
                setSelectedId(profession.id as ProfessionId);
                setError(null);
              }}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={isLoading || !selectedId}
        className="profession-continue"
      >
        {isLoading ? "Saving…" : "Continue to dashboard"}
      </button>
    </div>
  );
}

function ProfessionCard({
  profession,
  selected,
  onSelect,
}: {
  profession: Profession;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`profession-card ${selected ? "profession-card-selected" : ""}`}
    >
      <div className="profession-card-top">
        <h2 className="profession-card-title">{profession.label}</h2>
        <span className={`profession-card-radio ${selected ? "profession-card-radio-on" : ""}`} />
      </div>
      <p className="profession-card-desc">{profession.description}</p>
      <ul className="profession-card-features">
        {profession.featurePreview.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </button>
  );
}
