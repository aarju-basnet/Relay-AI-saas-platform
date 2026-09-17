import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Lock,
  UploadCloud,
  Sparkles,
  MessageCircle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError, KnowledgeDocument } from "@/lib/api";

export default function KnowledgeBase() {
  const { user, activeWorkspace } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage =
    activeWorkspace?.role === "OWNER" || activeWorkspace?.role === "ADMIN";
  const isFreePlan = user?.plan === "FREE";

  function loadDocuments() {
    setLoading(true);
    api
      .getKnowledgeDocuments()
      .then((res) => setDocuments(res.documents))
      .catch((err) => {
        console.error(err);
        setError("Couldn't load documents.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!isFreePlan) loadDocuments();
    else setLoading(false);
  }, [isFreePlan]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      await api.uploadKnowledgeDocument(file);
      loadDocuments();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't upload that file."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document? The AI will no longer reference it.")) return;

    setDeletingId(id);
    try {
      await api.deleteKnowledgeDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  const HOW_IT_WORKS = [
    {
      icon: UploadCloud,
      title: "Upload your documents",
      description: "Add PDFs, Word docs, or text files — FAQs, policies, product info, pricing sheets.",
    },
    {
      icon: Sparkles,
      title: "Relay reads and indexes them",
      description: "Your files are broken into searchable chunks the AI can reference accurately.",
    },
    {
      icon: MessageCircle,
      title: "Your AI answers using them",
      description: "When a customer asks something covered in your docs, Relay pulls the real answer instead of guessing.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Knowledge Base</h1>
        <p className="text-xs text-ink-muted mt-1">
          Upload documents so your AI assistant can answer questions using
          your business's own information.
        </p>
      </div>

      {/* ── PRO GATE (FREE PLAN) ── */}
      {isFreePlan ? (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-copper/10 mb-4">
              <Lock size={20} className="text-copper" />
            </div>
            <h3 className="text-sm font-semibold">Knowledge Base is a Pro feature</h3>
            <p className="text-[11px] text-ink-muted mt-1.5 max-w-sm">
              Upgrade to Pro to upload your business documents and let your AI
              assistant answer questions using your own content instead of
              general knowledge.
            </p>
            <Link
              to="/pricing"
              className="mt-4 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      ) : (
        /* ── DOCUMENTS (PRO) ── */
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-copper" />
              <h2 className="text-sm font-semibold">Documents</h2>
            </div>

            {canManage && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      Upload Document
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600 flex items-start gap-2">
              {error.toLowerCase().includes("pro") || error.toLowerCase().includes("upgrade") ? (
                <Lock size={14} className="mt-0.5 shrink-0" />
              ) : null}
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-copper" size={22} />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <BookOpen size={32} className="text-copper mb-3" />
              <h3 className="text-sm font-semibold">No documents yet</h3>
              <p className="text-[11px] text-ink-muted mt-1 max-w-xs">
                Upload PDFs, Word docs, or text files with your business info —
                FAQs, policies, product details — so your AI can answer
                accurately.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-copper/10 shrink-0">
                      <FileText size={15} className="text-copper" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{doc.name}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {doc.fileType.toUpperCase()} · {doc.chunkCount} chunks ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                        doc.status === "READY"
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : doc.status === "FAILED"
                          ? "bg-red-50 border border-red-200 text-red-600"
                          : "bg-amber-50 border border-amber-200 text-amber-700"
                      }`}
                    >
                      {doc.status === "READY"
                        ? "Ready"
                        : doc.status === "FAILED"
                        ? "Failed"
                        : "Processing"}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-ink-faint hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">How it works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-copper/10 text-copper shrink-0">
                    <Icon size={14} />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-faint">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-ink">{step.title}</h3>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}