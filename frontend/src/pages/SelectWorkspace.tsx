import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Building2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { TopBar } from "@/components/TopBar";

export default function SelectWorkspace() {
  const { user, selectWorkspace } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workspaces = user?.workspaces ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return workspaces;
    return workspaces.filter((w) =>
      w.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [workspaces, search]);

  function handleSelect(id: string) {
    selectWorkspace(id);
    navigate("/dashboard", { replace: true });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.createWorkspace(newName.trim());
      selectWorkspace(res.workspace.id);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't create that workspace, try again."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <TopBar
        showLogo
        onNavigateHelp={() => navigate("/settings")}
        onNavigateAccount={() => navigate("/settings")}
      />

      <div className="flex-1 px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-ink mb-8">
            Your Businesses
          </h1>

          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for an organization"
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm outline-none focus:border-copper transition"
              />
            </div>

            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-copper px-4 py-2.5 text-sm font-medium text-white hover:bg-copper/90 transition shrink-0"
            >
              <Plus size={16} />
              New Business
            </button>
          </div>

         {showCreateForm && (
  <div className="mb-6 rounded-2xl border border-border bg-surface p-5">
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-medium text-ink-muted">
        Business name
      </label>
      <button
        onClick={() => {
          setShowCreateForm(false);
          setNewName("");
          setError(null);
        }}
        aria-label="Cancel"
        className="text-ink-faint hover:text-ink transition"
      >
        <X size={16} />
      </button>
    </div>
    <div className="flex items-center gap-3">
      <input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Acme Inc."
        className="flex-1 rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm outline-none focus:border-copper transition"
      />
      <button
        onClick={handleCreate}
        disabled={creating || !newName.trim()}
        className="rounded-xl bg-copper px-5 py-2.5 text-sm font-medium text-white hover:bg-copper/90 transition disabled:opacity-50 shrink-0"
      >
        {creating ? "Creating…" : "Create"}
      </button>
    </div>
    {error && (
      <p className="text-xs text-danger mt-2">{error}</p>
    )}
  </div>
)}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelect(workspace.id)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5 text-left hover:border-copper/40 hover:shadow-sm transition"
              >
                <WorkspaceIcon logoUrl={workspace.logoUrl} name={workspace.name} />
                <div>
                  <p className="text-sm font-medium text-ink">{workspace.name}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Free Plan · {workspace.role === "OWNER" ? "Owner" : workspace.role === "ADMIN" ? "Admin" : "Member"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-sm text-ink-faint text-center py-12">
              {search ? "No organizations match that search." : "You don't have any organizations yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceIcon({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-10 w-10 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-full bg-surface border border-border flex items-center justify-center">
      <Building2 size={18} className="text-ink-faint" />
    </div>
  );
}