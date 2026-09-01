import { FormEvent, useEffect, useRef, useState } from "react";
import { Save, Building2, Globe, MapPin, Loader2, CheckCircle2, AlertCircle, Link2, Upload, X } from "lucide-react";
import { api, ApiError, WorkspaceSettings } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const INDUSTRIES = [
  "Technology", "Education", "Healthcare", "Finance", "E-Commerce",
  "Travel", "Food", "Real Estate", "Legal", "Marketing",
  "Manufacturing", "Government", "Other",
];

const COMPANY_SIZES = ["Just Me", "2-10", "11-50", "51-200", "201-500", "500+"];

const MAX_LOGO_SIZE_BYTES = 500 * 1024; // 500KB

export default function WorkspaceSettingsCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoMode, setLogoMode] = useState<"url" | "upload">("url");
  const [website, setWebsite] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [country, setCountry] = useState("");
  const [timeZone, setTimeZone] = useState("");
const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getWorkspaceSettings()
      .then(({ workspace }) => {
        setName(workspace.name);
        setLogoUrl(workspace.logoUrl || "");
        setWebsite(workspace.website || "");
        setBusinessEmail(workspace.businessEmail || "");
        setIndustry(workspace.industry || "");
        setCompanySize(workspace.companySize || "");
        setCountry(workspace.country || "");
        setTimeZone(workspace.timeZone || "");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setError("Logo must be smaller than 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.onerror = () => {
      setError("Couldn't read that file. Try a different image.");
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

 async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setSaving(true);
  setSaved(false);
  setError("");
  try {
    await api.updateWorkspaceSettings({
      name,
      logoUrl: logoUrl || null,
      website: website || null,
      businessEmail: businessEmail || null,
      industry: industry || undefined,
      companySize: companySize || undefined,
      country,
      timeZone,
    });

    await refreshUser(); // ← syncs Dashboard header instantly

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  } catch (err) {
    setError(err instanceof ApiError ? err.message : "Couldn't save workspace.");
  } finally {
    setSaving(false);
  }
}
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── WORKSPACE INFORMATION ── */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">

          <Building2 size={17} className="text-copper" />

          <div>

            <h2 className="text-sm font-semibold">
              Workspace Information
            </h2>

            <p className="text-[11px] text-ink-muted mt-0.5">
              Basic information about your organization.
            </p>

          </div>

        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Workspace Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
              placeholder="Acme Inc."
            />

            <p className="text-[11px] text-ink-muted mt-1.5">
              Visible to everyone in your workspace.
            </p>

          </div>

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Logo
            </label>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-canvas p-1 mb-2.5">
              <button
                type="button"
                onClick={() => setLogoMode("url")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition ${
                  logoMode === "url"
                    ? "bg-surface shadow-sm text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Link2 size={12} />
                Logo URL
              </button>
              <button
                type="button"
                onClick={() => setLogoMode("upload")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition ${
                  logoMode === "upload"
                    ? "bg-surface shadow-sm text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Upload size={12} />
                Upload
              </button>
            </div>

            {logoMode === "url" ? (
              <>
                <input
                  type="url"
                  value={logoUrl.startsWith("data:") ? "" : logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
                  placeholder="https://company.com/logo.png"
                />
                <p className="text-[11px] text-ink-muted mt-1.5">
                  Any publicly accessible image URL.
                </p>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none file:mr-3 file:rounded-md file:border-0 file:bg-copper/10 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-copper hover:file:bg-copper/20 transition"
                />
                <p className="text-[11px] text-ink-muted mt-1.5">
                  PNG, JPG, or SVG. Max 500KB.
                </p>
              </>
            )}

            {logoUrl && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-canvas p-2.5">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-10 w-10 rounded-md object-cover border border-border"
                />
                <span className="flex-1 text-[11px] text-ink-muted truncate">
                  {logoUrl.startsWith("data:") ? "Uploaded image" : logoUrl}
                </span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="text-ink-faint hover:text-red-500 transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── BUSINESS DETAILS ── */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">

          <Globe size={17} className="text-copper" />

          <div>

            <h2 className="text-sm font-semibold">
              Business Details
            </h2>

            <p className="text-[11px] text-ink-muted mt-0.5">
              Public information about your business.
            </p>

          </div>

        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Business Email
            </label>

            <input
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
              placeholder="support@company.com"
            />

            <p className="text-[11px] text-ink-muted mt-1.5">
              Used for customer communication.
            </p>

          </div>

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Website
            </label>

            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
              placeholder="https://company.com"
            />

            <p className="text-[11px] text-ink-muted mt-1.5">
              Your official company website.
            </p>

          </div>

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Industry
            </label>

            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <p className="text-[11px] text-ink-muted mt-1.5">
              Helps personalize your Relay workspace.
            </p>

          </div>

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Company Size
            </label>

            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
            >
              <option value="">Select Company Size</option>
              {COMPANY_SIZES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <p className="text-[11px] text-ink-muted mt-1.5">
              Used for workspace insights.
            </p>

          </div>

        </div>

      </div>

      {/* ── LOCALIZATION ── */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">

          <MapPin size={17} className="text-copper" />

          <div>

            <h2 className="text-sm font-semibold">
              Localization
            </h2>

            <p className="text-[11px] text-ink-muted mt-0.5">
              Configure your workspace location and timezone.
            </p>

          </div>

        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Country
            </label>

            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
              placeholder="Nepal"
            />

            <p className="text-[11px] text-ink-muted mt-1.5">
              Used for regional preferences and reporting.
            </p>

          </div>

          <div>

            <label className="block text-[11px] uppercase text-ink-faint mb-1.5">
              Time Zone
            </label>

            <input
              type="text"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-xs outline-none focus:border-copper transition"
              placeholder="Asia/Kathmandu"
            />

            <p className="text-[11px] text-ink-muted mt-1.5">
              Example: Asia/Kathmandu
            </p>

          </div>

        </div>

      </div>

      {/* ── STATUS MESSAGES ── */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-500" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={15} className="text-green-600" />
          <p className="text-xs text-green-700">Workspace settings saved successfully.</p>
        </div>
      )}

      {/* ── SAVE FOOTER ── */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm px-5 py-4">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold">
              Save Changes
            </p>

            <p className="text-[11px] text-ink-muted mt-0.5">
              Changes will be applied immediately across your workspace.
            </p>

          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-copper px-5 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={13} />
                Saved ✓
              </>
            ) : (
              <>
                <Save size={13} />
                Save Changes
              </>
            )}
          </button>

        </div>

      </div>

    </form>
  );
}