import { VerifyForm } from "@/components/auth/verify-form";
import { redirect } from "next/navigation";

type VerifyPageProps = {
  searchParams: Promise<{
    id?: string;
    firstName?: string;
    destination?: string;
    method?: string;
    expiresAt?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const pendingId = params.id;
  const firstName = params.firstName ? decodeURIComponent(params.firstName) : "there";
  const destination = params.destination
    ? decodeURIComponent(params.destination)
    : "";
  const method = params.method === "phone" ? "phone" : "email";
  const expiresAt = params.expiresAt ?? "";

  if (!pendingId) {
    redirect("/login");
  }

  return (
    <div className="verify-page">
      <div className="verify-page-card">
        <VerifyForm
          pendingId={pendingId}
          firstName={firstName}
          destination={destination}
          method={method}
          initialExpiresAt={expiresAt}
        />
      </div>
    </div>
  );
}
