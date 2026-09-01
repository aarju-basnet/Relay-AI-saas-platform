import { useState } from "react";
import { X, KeyRound, Loader2 } from "lucide-react";

interface CreateApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CreateApiKeyModal({
  open,
  onClose,
  onCreate,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleGenerate() {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onCreate(name.trim());
      setName("");
      setDescription("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">

          <div className="flex items-center gap-3">

            <KeyRound
              size={18}
              className="text-copper"
            />

            <div>

              <h2 className="text-lg font-semibold">
                Create API Key
              </h2>

              <p className="text-xs text-ink-muted mt-1">
                Generate a new Relay AI API key.
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-canvas"
          >
            <X size={18} />
          </button>

        </div>

        {/* Body */}

        <div className="space-y-5 p-6">

          <div>

            <label className="mb-2 block text-xs font-medium">
              API Key Name <span className="text-red-500">*</span>
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production Server"
              className="w-full rounded-lg border border-border bg-canvas px-4 py-3 text-sm outline-none transition focus:border-copper"
            />

          </div>

          <div>

            <label className="mb-2 block text-xs font-medium">
              Description <span className="text-ink-faint">(optional)</span>
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Used by our production backend..."
              className="w-full resize-none rounded-lg border border-border bg-canvas px-4 py-3 text-sm outline-none transition focus:border-copper"
            />

          </div>

          <div className="rounded-xl border border-copper/20 bg-copper/5 p-4">

            <p className="text-xs leading-6 text-ink-muted">
              API Keys allow external applications to securely communicate
              with your Relay AI assistant. The key will only be shown once
              after creation — store it safely.
            </p>

          </div>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-border px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-lg border border-border px-5 py-2 text-sm transition hover:bg-canvas"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={!name.trim() || loading}
            className="flex items-center gap-2 rounded-lg bg-copper px-5 py-2 text-sm font-medium text-white transition hover:bg-copper/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              "Generate API Key"
            )}
          </button>

        </div>

      </div>

    </div>
  );
}