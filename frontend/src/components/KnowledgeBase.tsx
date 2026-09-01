import { useEffect, useRef, useState } from "react";
import { BookOpen, Upload, Trash2, Loader2, FileText, Lock } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError, KnowledgeDocument } from "@/lib/api";

export default function KnowledgeBase() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManage =
    user?.workspace?.role === "OWNER" || user?.workspace?.role === "ADMIN";

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
    loadDocuments();
  }, []);

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

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Knowledge Base</h1>
        <p className="text-xs text-ink-muted mt-1">
          Upload documents so your AI assistant can answer questions using
          your business's own information.
        </p>
      </div>

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
          <div className="flex flex-col items-center justify-center py-16 text-center">
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

    </div>
  );
}