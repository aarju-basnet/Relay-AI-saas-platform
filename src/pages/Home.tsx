import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Repeat, ShieldCheck, Database, Check, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <NavBar loggedIn={!!user} />
      <Hero loggedIn={!!user} />
      <Features />
      <PricingPreview />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}

function NavBar({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="border-b border-border sticky top-0 bg-white/90 backdrop-blur z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <nav className="hidden sm:flex items-center gap-8 text-sm text-ink-muted">
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
          <Link to="/pricing" className="hover:text-ink transition-colors">
            Pricing
          </Link>
          <a href="#about" className="hover:text-ink transition-colors">
            About
          </a>
          <a href="#contact" className="hover:text-ink transition-colors">
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <Link to="/dashboard" className="btn-primary text-sm px-4 py-2">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ink-muted hover:text-ink font-medium">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Start for free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
      <span className="inline-block text-xs font-medium text-copper bg-copper-dim px-3 py-1 rounded-full mb-6">
        Free to start · No credit card required
      </span>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink mb-5 leading-tight">
        One question in.
        <br />
        An answer, no matter what.
      </h1>
      <p className="text-lg text-ink-muted mb-9 max-w-xl mx-auto">
        Relay sends every message across a chain of AI models. If one is down, slow, or rate-limited,
        it automatically moves to the next - so you always get a reply.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to={loggedIn ? "/dashboard" : "/register"} className="btn-primary px-6 py-3">
          {loggedIn ? "Go to dashboard" : "Start for free"}
        </Link>
        <Link to="/pricing" className="btn-secondary px-6 py-3">
          See pricing
        </Link>
      </div>
    </section>
  );
}

const FEATURE_LIST = [
  {
    icon: Repeat,
    title: "Automatic fallback chain",
    description:
      "Every message tries a sequence of AI models in order. If one fails or is rate-limited, Relay silently retries the next - you never see an error page.",
  },
  {
    icon: ShieldCheck,
    title: "Real account security",
    description:
      "Email/password or Google sign-in, verified email addresses, revocable sessions, and a proper password-reset flow - not a toy login form.",
  },
  {
    icon: Database,
    title: "Built to actually scale",
    description:
      "Structured account data lives in Postgres, conversation history in MongoDB, and Redis handles rate limiting - so performance holds up as usage grows.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-border bg-canvas">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-3">Why Relay</h2>
          <p className="text-ink-muted max-w-lg mx-auto">
            Built like a product meant to run in production, not a weekend demo.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURE_LIST.map(({ icon: Icon, title, description }) => (
            <div key={title} className="panel p-6">
              <div className="w-10 h-10 rounded-panel bg-copper-dim text-copper flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
          Start free, upgrade when you need to
        </h2>
        <p className="text-ink-muted">
          No trials that expire. No surprise charges.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
        {/* Free */}
        <div className="panel p-5 transition-all duration-700 ease-out hover:-translate-y-4 hover:scale-[1.03] hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)] hover:border-copper">
          <h3 className="font-semibold mb-1">Free</h3>

          <p className="text-2xl font-semibold mb-4">
            $0
            <span className="text-sm font-normal text-ink-muted">
              /month
            </span>
          </p>

          <ul className="space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              20 messages / 5 min
            </li>

            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              Full conversation history
            </li>
          </ul>
        </div>

        {/* Pro Monthly */}
        <div className="rounded-panel border-2 border-copper bg-surface p-5 shadow-raised transition-all duration-700 ease-out hover:-translate-y-4 hover:scale-[1.03] hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)] hover:border-copper">
          <h3 className="font-semibold mb-1">Pro Monthly</h3>

          <p className="text-2xl font-semibold mb-4">
            $9
            <span className="text-sm font-normal text-ink-muted">
              /month
            </span>
          </p>

          <ul className="space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              200 messages / 5 min
            </li>

            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              Priority support
            </li>
          </ul>
        </div>

        {/* Pro Yearly */}
        <div className="panel p-5 transition-all duration-700 ease-out hover:-translate-y-4 hover:scale-[1.03] hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)] hover:border-copper">
          <h3 className="font-semibold mb-1">Pro Yearly</h3>

          <p className="text-2xl font-semibold mb-4">
            $90
            <span className="text-sm font-normal text-ink-muted">
              /year
            </span>
          </p>

          <ul className="space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              200 messages / 5 min
            </li>

            <li className="flex items-center gap-2">
              <Check size={14} className="text-teal shrink-0" />
              Priority support
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          to="/pricing"
          className="text-copper hover:text-copper-bright font-medium text-sm"
        >
          See full plan comparison →
        </Link>
      </div>
    </section>
  );
}
function About() {
  return (
    <section id="about" className="border-t border-border bg-canvas">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Why we built this</h2>
        <p className="text-ink-muted leading-relaxed">
          Individual AI models go down, get rate-limited, or quietly degrade - and most chat apps just
          show you an error when that happens. Relay was built to hide that entirely: it tries a chain
          of models automatically and shows you exactly which one answered, so reliability isn't
          something you have to think about.
        </p>
      </div>
    </section>
  );
}

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.sendContactMessage(name, email, message);
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="max-w-lg mx-auto px-6 py-20">
      <div className="text-center mb-8">
        <div className="w-10 h-10 rounded-panel bg-copper-dim text-copper flex items-center justify-center mx-auto mb-4">
          <Mail size={18} />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Get in touch</h2>
        <p className="text-ink-muted text-sm">Questions, feedback, or bug reports - all welcome.</p>
      </div>

      {status === "sent" ? (
        <div className="panel p-6 text-center text-sm text-teal">
          Thanks - your message is on its way. We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="panel p-6 space-y-4">
          {status === "error" && (
            <div className="px-3 py-2.5 rounded-panel bg-danger-dim border border-danger/20 text-danger text-sm">
              Something went wrong sending that. Try again in a moment.
            </div>
          )}
          <div>
            <label htmlFor="contact-name" className="block text-sm text-ink-muted mb-1.5">
              Name
            </label>
            <input
              id="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm text-ink-muted mb-1.5">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm text-ink-muted mb-1.5">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field resize-none"
              placeholder="How can we help?"
            />
          </div>
          <button type="submit" disabled={status === "sending"} className="btn-primary w-full">
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Relay. All rights reserved.</p>
      </div>
    </footer>
  );
}
