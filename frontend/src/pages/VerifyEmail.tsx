import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "@/lib/api";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This link is missing a verification token.");
      return;
    }

    api
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Couldn't verify this link.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="panel p-8">
          {status === "verifying" && (
            <>
              <Spinner />
              <p className="text-ink-muted text-sm mt-4">Verifying your email…</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-10 h-10 rounded-full bg-teal/15 border border-teal/30 text-teal flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h1 className="text-lg font-semibold mb-1">Email verified</h1>
              <p className="text-ink-muted text-sm mb-5">Your account is fully set up.</p>
              <Link to="/dashboard" className="btn-primary block">
                Go to dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-10 h-10 rounded-full bg-danger/15 border border-danger/30 text-danger flex items-center justify-center mx-auto mb-4">
                ✕
              </div>
              <h1 className="text-lg font-semibold mb-1">Verification failed</h1>
              <p className="text-ink-muted text-sm mb-5">{message}</p>
              <Link to="/dashboard" className="btn-secondary block">
                Back to dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-2 border-border border-t-copper rounded-full animate-spin mx-auto" />
  );
}
