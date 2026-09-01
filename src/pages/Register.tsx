import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Check, X } from "lucide-react";

export default function Register() {
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasDigit;

  // Calculate strength score (0 to 3)
  const strengthScore = [hasMinLength, hasUppercase, hasDigit].filter(Boolean).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter and one number.");
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, businessName, name || undefined);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-4 text-center">
          <div className="inline-flex mb-3">
            <Logo />
          </div>
          <h1 className="text-[23px] font-semibold leading-tight">Register your business</h1>
          <p className="text-ink-muted text-xs mt-0.5">Free to use. No credit card required.</p>
        </div>

        <div className="panel p-5">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-panel bg-danger/10 border border-danger/30 text-danger text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="businessName" className="block text-xs text-ink-muted mb-1">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="input-field text-sm py-1.5"
                placeholder="Acme Co."
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-xs text-ink-muted mb-1">
                Name <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-sm py-1.5"
                placeholder="Ada Lovelace"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs text-ink-muted mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-sm py-1.5"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-ink-muted mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field text-sm py-1.5 pr-10"
                  placeholder="Create a strong password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-copper transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Compact Password Strength Meter & Guidelines */}
              {password.length > 0 && (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        strengthScore === 1
                          ? "w-1/3 bg-copper/50"
                          : strengthScore === 2
                          ? "w-2/3 bg-copper/80"
                          : strengthScore === 3
                          ? "w-full bg-copper"
                          : "w-0"
                      }`}
                    />
                  </div>

                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted">
                    <div className="flex items-center gap-1">
                      {hasMinLength ? <Check size={12} className="text-copper" /> : <X size={12} className="text-ink-faint" />}
                      <span className={hasMinLength ? "text-ink font-medium" : "text-ink-faint"}>8+ chars</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasUppercase ? <Check size={12} className="text-copper" /> : <X size={12} className="text-ink-faint" />}
                      <span className={hasUppercase ? "text-ink font-medium" : "text-ink-faint"}>1 uppercase (A-Z)</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasDigit ? <Check size={12} className="text-copper" /> : <X size={12} className="text-ink-faint" />}
                      <span className={hasDigit ? "text-ink font-medium" : "text-ink-faint"}>1 number (0-9)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox Agreement */}
            <div className="flex items-start gap-2 pt-0.5">
              <input
                type="checkbox"
                id="terms"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border text-copper focus:ring-copper accent-copper cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-ink-muted leading-tight cursor-pointer select-none">
                I agree to Relay's{" "}
                <Link to="/terms" target="_blank" className="text-copper hover:text-copper-bright underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link to="/privacy" target="_blank" className="text-copper hover:text-copper-bright underline">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !agreed || !isPasswordValid}
              className={`btn-primary w-full py-2 text-sm transition-opacity ${
                !agreed || !isPasswordValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-[11px] text-ink-faint font-mono">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <a href={api.googleLoginUrl()} className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2">
            <GoogleIcon />
            Continue with Google
          </a>
          <p className="text-[11px] text-ink-faint text-center mt-1.5">
            We'll create a starter business for you - rename it anytime.
          </p>
        </div>

        <p className="text-center text-xs text-ink mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-copper hover:text-copper-bright font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5l-6.6-5.6C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.6C41.6 35.9 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}