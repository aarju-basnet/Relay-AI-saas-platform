import { useState, FormEvent } from "react";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Loader2,
  CheckCircle2,
  MessageSquareText,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How do I add the Relay widget to my website?",
    answer:
      "Go to Settings → API Keys, create a key, then copy the script tag shown right after creation. Paste it right before the closing </body> tag on every page you want the widget to appear on.",
  },
  {
    question: "Why isn't the widget showing up on my site?",
    answer:
      "First, confirm the script tag is present in your page's HTML (view page source, not just the rendered DOM). If it's there, check Settings → Advanced and enable Developer Mode, then check the Developer → Live Debug Console for any errors once someone loads your page.",
  },
  {
    question: "How do I invite my team?",
    answer:
      "Go to Team in the sidebar, enter their name and email under Invite Team Member, and send. They'll get an email with a secure link to set their own password and join your workspace.",
  },
  {
    question: "What's the difference between Owner, Admin, and Member roles?",
    answer:
      "Owner has full control including billing and workspace deletion. Admin can manage team members and most settings but can't delete the workspace. Member has standard access to the dashboard and inbox without administrative controls.",
  },
  {
    question: "How does two-factor authentication work?",
    answer:
      "Go to Settings → Security → Two-Factor Authentication, scan the QR code with an authenticator app like Google Authenticator or Authy, then enter the 6-digit code to confirm. You'll also get backup codes — save those somewhere safe in case you lose access to your app.",
  },
  {
    question: "Can I use my own AI model or API key?",
    answer:
      "Bring-your-own-API-key support is coming soon. For now, Relay automatically routes your assistant's replies through a fallback chain of free models to keep things running reliably.",
  },
  {
    question: "How do I upgrade my plan?",
    answer:
      "Go to Billing in the sidebar and choose a plan. If you're on the Free plan, you'll see an \"Upgrade to Pro\" prompt in a few places across the dashboard too.",
  },
  {
    question: "How do I delete my workspace?",
    answer:
      "Go to Settings → Advanced and scroll to the Danger Zone. Only workspace Owners can do this, and it's permanent — all conversations, team members, and settings are deleted immediately.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-xs font-medium pr-4">{question}</span>
        <ChevronDown
          size={15}
          className={`text-ink-faint shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-4">
          <p className="text-[11px] leading-6 text-ink-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);

    try {
      await api.sendContactMessage(name, email, message);
      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't send your message. Try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Help & Support</h1>
        <p className="text-xs text-ink-muted mt-1">
          Find answers to common questions, or reach out to us directly.
        </p>
      </div>

      {/* FAQ */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <HelpCircle size={16} className="text-copper" />
          <h2 className="text-sm font-semibold">Frequently Asked Questions</h2>
        </div>

        <div>
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>

      </div>

      {/* CONTACT FORM */}

      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">

        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <MessageSquareText size={16} className="text-copper" />
          <h2 className="text-sm font-semibold">Contact Support</h2>
        </div>

        <div className="p-5">

          <p className="text-[11px] text-ink-muted mb-4">
            Can't find what you're looking for? Send us a message and we'll get back to you.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          {sent && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 size={14} />
              Message sent. We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-ink-muted">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-ink-muted">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-ink-muted">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on..."
                className="w-full rounded-lg border border-border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-copper/30 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-copper px-5 py-2 text-xs font-medium text-white hover:bg-copper/90 transition disabled:opacity-60"
            >
              {sending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" />
                  Sending...
                </span>
              ) : (
                "Send Message"
              )}
            </button>

          </form>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-ink-faint">
            <Mail size={13} />
            Or email us directly at support@relay.app
          </div>

        </div>

      </div>

    </div>
  );
}