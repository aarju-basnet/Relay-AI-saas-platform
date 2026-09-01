import { useEffect, useState, FormEvent } from "react";

import {
  Users,
  UserPlus,
  Crown,
  Shield,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError, TeamMember } from "@/lib/api";

export default function TeamSetting() {
  const { user } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [seatCap, setSeatCap] = useState(2);
  const [loading, setLoading] = useState(true);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const canManage =
    user?.workspace?.role === "OWNER" || user?.workspace?.role === "ADMIN";
  const isOwner = user?.workspace?.role === "OWNER";

  const seatsUsed = members.length;
  const seatsFull = seatsUsed >= seatCap;
  const seatPercent =
    seatCap === Infinity ? 0 : Math.min(100, (seatsUsed / seatCap) * 100);

  async function loadMembers() {
    try {
      setLoading(true);
      const res = await api.getTeamMembers();
      setMembers(res.members);
      setSeatCap(res.seatCap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);
    setInviting(true);

    try {
      await api.inviteTeamMember(inviteEmail, inviteName || undefined);
      setInviteEmail("");
      setInviteName("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
      loadMembers();
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "Unable to invite member."
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(id: string, role: "ADMIN" | "MEMBER") {
    try {
      await api.updateMemberRole(id, role);
      loadMembers();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't update role.");
    }
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this team member?")) return;

    try {
      await api.removeTeamMember(id);
      loadMembers();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't remove member.");
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team Management</h1>
          <p className="text-xs text-ink-muted mt-1">
            Invite members, manage roles and workspace permissions.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface px-4 py-3 min-w-[110px]">
          <p className="text-[10px] uppercase text-ink-faint">Seats</p>
          <p className="text-sm font-semibold mt-0.5">
            {seatsUsed} / {seatCap === Infinity ? "∞" : seatCap}
          </p>
          {seatCap !== Infinity && (
            <div className="h-1 w-full rounded-full bg-canvas overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all ${
                  seatsFull ? "bg-red-400" : "bg-copper"
                }`}
                style={{ width: `${seatPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* INVITE CARD */}

      {canManage && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">

          <div className="flex items-center gap-2 mb-5">
            <UserPlus size={17} className="text-copper" />
            <h2 className="text-sm font-semibold">Invite Team Member</h2>
          </div>

          {inviteError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              Invite sent. They'll receive a secure link to set up their account.
            </div>
          )}

          {seatsFull ? (
            <p className="text-xs text-ink-muted">
              You've used all {seatCap} seats on your current plan. Upgrade to
              invite more members.
            </p>
          ) : (
            <form onSubmit={handleInvite} className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-ink-muted">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ink-muted">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
                  placeholder="john@example.com"
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={inviting}
                  className="w-full rounded-lg bg-copper py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
                >
                  {inviting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="mt-3 text-[11px] text-ink-faint leading-5">
            Invitees receive a secure, single-use link that expires in 7 days.
          </p>

        </div>
      )}

      {/* TEAM MEMBERS */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-copper" />
            <h2 className="text-sm font-semibold">Team Members</h2>
          </div>
          <span className="text-[11px] text-ink-muted">
            {members.length} {members.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-copper" size={22} />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-canvas border-b border-border">
              <tr className="text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 text-left">Member</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border hover:bg-canvas/60 transition"
                >

                  {/* MEMBER */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name || member.email}
                          className="h-9 w-9 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-copper/10 text-xs font-semibold text-copper">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold">
                          {member.name || "Unnamed User"}
                        </p>
                        <p className="text-[11px] text-ink-muted">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="px-5 py-4">
                    {isOwner && member.role !== "OWNER" && member.id !== user?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as "ADMIN" | "MEMBER")
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] outline-none"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : member.role === "OWNER" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-copper/10 border border-copper/20 px-2 py-1 text-[11px] font-medium text-copper">
                        <Crown size={11} />
                        Owner
                      </span>
                    ) : member.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-600">
                        <Shield size={11} />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-canvas border border-border px-2 py-1 text-[11px] font-medium text-ink-muted">
                        Member
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">
                    {member.status === "active" ? (
                      <span className="rounded-full bg-green-50 border border-green-200 px-2 py-1 text-[11px] font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-medium text-amber-700">
                        Invited
                      </span>
                    )}
                  </td>

                  {/* JOINED */}
                  <td className="px-5 py-4 text-[11px] text-ink-muted">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">

                      {member.role === "OWNER" && (
                        <span className="text-[11px] text-ink-faint">
                          Workspace Owner
                        </span>
                      )}

                      {isOwner && member.role === "MEMBER" && member.id !== user?.id && (
                        <button
                          onClick={() => handleRoleChange(member.id, "ADMIN")}
                          className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 text-[11px] transition"
                        >
                          Make Admin
                        </button>
                      )}

                      {isOwner && member.role === "ADMIN" && (
                        <button
                          onClick={() => handleRoleChange(member.id, "MEMBER")}
                          className="rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1 text-[11px] transition"
                        >
                          Remove Admin
                        </button>
                      )}

                      {canManage && member.role !== "OWNER" && member.id !== user?.id && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 text-[11px] transition"
                        >
                          Remove
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </div>
  );
}