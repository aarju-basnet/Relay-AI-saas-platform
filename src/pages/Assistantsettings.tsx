import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Bot } from "lucide-react";
import { api, ApiError, Assistant } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const PURPOSES = [
  "Customer Support",
  "Sales",
  "Product Questions",
  "Refunds",
  "Orders",
  "Appointments",
  "General FAQ",
];

const PREFERRED_MODELS = ["Auto (free fallback chain)", "GPT-5", "Claude", "Gemini"];
const RESPONSE_STYLES = ["Professional", "Friendly", "Formal", "Short", "Detailed"];
const LANGUAGES = ["English", "Nepali", "Hindi", "Japanese"];

export default function AssistantSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const canEdit = user?.workspace?.role === "OWNER" || user?.workspace?.role === "ADMIN";

  const [name, setName] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [preferredModel, setPreferredModel] = useState("");
  const [responseStyle, setResponseStyle] = useState("");
  const [language, setLanguage] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    api
      .getAssistant()
      .then(({ assistant }) => applyAssistant(assistant))
      .finally(() => setLoading(false));
  }, []);

  function applyAssistant(a: Assistant) {
    setName(a.name);
    setPurposes(a.purposes);
    setPreferredModel(a.preferredModel);
    setResponseStyle(a.responseStyle);
    setLanguage(a.language);
    setWelcomeMessage(a.welcomeMessage);
    setSystemPrompt(a.systemPrompt || "");
  }

  function togglePurpose(p: string) {
    setPurposes((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { assistant } = await api.updateAssistant({
        name,
        purposes,
        preferredModel,
        responseStyle,
        language,
        welcomeMessage,
        systemPrompt: systemPrompt || null,
      });
      applyAssistant(assistant);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that, try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Logo size="sm" />
          <Link to="/dashboard" className="text-sm text-ink-muted hover:text-ink flex items-center gap-1.5">
            <ArrowLeft size={15} />
            Back to chat
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="w-11 h-11 rounded-panel bg-copper-dim text-copper flex items-center justify-center mb-4">
          <Bot size={20} />
        </div>
        <h1 className="text-2xl font-semibold mb-1">AI Assistant</h1>
        <p className="text-ink-muted text-sm mb-8">
          Shapes how your assistant sounds and what it's meant to help with.
        </p>

        {loading ? (
          <p className="text-sm text-ink-faint">Loading…</p>
        ) : !canEdit ? (
          <div className="panel p-5 text-sm text-ink-muted">
            Only the workspace owner or an admin can edit the assistant.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="panel p-6 space-y-5">
            {error && (
              <div className="px-3 py-2.5 rounded-panel bg-danger-dim border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="assistantName" className="block text-sm text-ink-muted mb-1.5">
                Assistant name
              </label>
              <input
                id="assistantName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Relay AI"
              />
            </div>

            <div>
              <p className="block text-sm text-ink-muted mb-2">What should it help with?</p>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSES.map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-panel border cursor-pointer transition-colors ${
                      purposes.includes(p) ? "border-copper bg-copper-dim text-copper" : "border-border text-ink-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={purposes.includes(p)}
                      onChange={() => togglePurpose(p)}
                      className="accent-copper"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="preferredModel" className="block text-sm text-ink-muted mb-1.5">
                Preferred AI model
              </label>
              <select
                id="preferredModel"
                value={preferredModel}
                onChange={(e) => setPreferredModel(e.target.value)}
                className="input-field"
              >
                {PREFERRED_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink-faint mt-1.5">
                Relay currently always uses the free fallback chain - this is a preference for future
                "bring your own API key" support.
              </p>
            </div>

            <div>
              <label htmlFor="responseStyle" className="block text-sm text-ink-muted mb-1.5">
                Response style
              </label>
              <select
                id="responseStyle"
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
                className="input-field"
              >
                {RESPONSE_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm text-ink-muted mb-1.5">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="welcomeMessage" className="block text-sm text-ink-muted mb-1.5">
                Welcome message
              </label>
              <input
                id="welcomeMessage"
                type="text"
                required
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="input-field"
                placeholder="Hello! How can I help you today?"
              />
            </div>

            <div>
              <label htmlFor="systemPrompt" className="block text-sm text-ink-muted mb-1.5">
                Custom instructions <span className="text-ink-faint">(advanced, optional)</span>
              </label>
              <textarea
                id="systemPrompt"
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="input-field resize-none"
                placeholder="Leave blank to auto-generate from the settings above."
              />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-1.5">
              <Save size={15} />
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}