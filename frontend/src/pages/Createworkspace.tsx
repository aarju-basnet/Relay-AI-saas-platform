import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";

const INDUSTRIES = [
  "Technology",
  "Education",
  "Healthcare",
  "Finance",
  "E-Commerce",
  "Travel",
  "Food",
  "Real Estate",
  "Legal",
  "Marketing",
  "Manufacturing",
  "Government",
  "Other",
];

const COMPANY_SIZES = ["Just Me", "2-10", "11-50", "51-200", "201-500", "500+"];

export default function CreateWorkspace() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { createWorkspace, user } = useAuth();
  const navigate = useNavigate();

  // Already has a workspace (e.g. came back to this URL manually) - skip ahead.
  if (user?.workspace) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createWorkspace(name, industry || undefined, companySize || undefined);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold">Tell us about your business</h1>
          <p className="text-ink-muted text-sm mt-1">Takes under a minute. You can add more detail later.</p>
        </div>

        <div className="panel p-6">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-panel bg-danger/10 border border-danger/30 text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="workspaceName" className="block text-sm text-ink-muted mb-1.5">
                Workspace name
              </label>
              <input
                id="workspaceName"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Acme Co."
              />
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm text-ink-muted mb-1.5">
                Industry <span className="text-ink-faint">(optional)</span>
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input-field"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="companySize" className="block text-sm text-ink-muted mb-1.5">
                Company size <span className="text-ink-faint">(optional)</span>
              </label>
              <select
                id="companySize"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="input-field"
              >
                <option value="">Select a size</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={submitting || !name.trim()} className="btn-primary w-full">
              {submitting ? "Creating workspace…" : "Create workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}