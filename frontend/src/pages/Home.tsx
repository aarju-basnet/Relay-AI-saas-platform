import { FormEvent, useState, useEffect, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import {
  Repeat,
  Code2,
  BarChart3,
  Check,
  Mail,
  Bot,
  Users,
  Building2,
  ShieldCheck,
  KeyRound,
  MessageSquare,
  ChevronDown,
  LayoutDashboard,
  Database,
  LogIn,
  MousePointerClick,
  Eye,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  // Display font for headings, plus an Apple-style eased momentum scroll
  // (via Lenis) instead of the browser's default instant/step scroll.
  useEffect(() => {
    if (!document.getElementById("relay-heading-font")) {
      const link = document.createElement("link");
      link.id = "relay-heading-font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap";
      document.head.appendChild(link);
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    function handleAnchorClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const el = document.querySelector(hash);
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -72 });
      }
    }
    document.addEventListener("click", handleAnchorClick);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <style>{`.font-heading { font-family: 'Poppins', sans-serif; }`}</style>
      <NavBar loggedIn={!!user} />
      <Hero loggedIn={!!user} />
      <LiveDemo />
      <Features />
      <HowItWorks />
      <PricingPreview />
      <FAQ />
      <About />
      <Contact />
      <FooterLinks />
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
    <section className="bg-white max-w-4xl mx-auto px-6 pt-12 pb-10 text-center">
      <span className="inline-block text-xs font-medium text-copper bg-copper-dim px-3 py-1 rounded-full mb-5">
        Free to start · No credit card required
      </span>
      <h1 className="font-heading text-3xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink mb-5 leading-[1.05]">
        Run every business on{" "}
      <span className="relative inline-block border border-emerald-700 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
  Relay
</span>
        .
        <br />
        Let AI handle the support.
      </h1>
      <p className="text-lg text-ink-muted mb-8 max-w-2xl mx-auto leading-relaxed">
        Relay is a workspace for running one business or several - each with its own AI support
        widget, its own team, and its own dashboard. Drop one script tag onto your site and Relay
        answers customer questions instantly. Upgrade to Pro, upload your own documents, and the
        assistant starts answering with your actual business knowledge instead of generic replies.
        Every workspace gets a live dashboard showing exactly what's happening - who's asking what,
        how fast it's answered, and how your support holds up over time.
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

// ---------- LIVE DEMO: a full-width preview of the owner's dashboard ---------- //
// Mirrors what Relay actually tracks per session (SESSION_STARTED, PAGE_VIEW,
// CHAT_WIDGET_LOADED/OPENED/CLOSED, MESSAGE_SENT/RECEIVED) - so the preview
// shows logins, click-through rate, page views, assistant usage, the
// questions people actually ask, and a short AI summary, each compared
// against the previous period rather than a single flat number.

const DASHBOARD_NAV = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: MessageSquare, label: "Conversations" },
  { icon: Database, label: "Knowledge Base" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Users, label: "Team" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const THIS_WEEK_LOGINS = [62, 74, 81, 69, 95, 58, 40];
const LAST_WEEK_LOGINS = [48, 60, 65, 58, 70, 44, 33];
const WEEK_MAX = Math.max(...THIS_WEEK_LOGINS, ...LAST_WEEK_LOGINS);

const TOP_QUESTIONS = [
  { question: "How do I reset my password?", count: 128 },
  { question: "Is there a free plan?", count: 96 },
  { question: "How do I add teammates?", count: 74 },
  { question: "Do you support refunds?", count: 51 },
];

function LiveDemo() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 70);
    return () => clearInterval(timer);
  }, []);

  const loginsToday = Math.round(60 + progress * 0.4);
  const ctr = (3.2 + progress * 0.014).toFixed(1);
  const assistantConvos = Math.round(210 + progress * 0.9);

  return (
    <section className="bg-white border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">See Relay in  <span className="relative inline-block border border-emerald-700 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
  action
</span></h2>
            <p className="text-ink-muted max-w-lg mx-auto">
              What you'll see in your own dashboard once the widget is live on your site.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="w-full rounded-2xl border border-border bg-canvas overflow-hidden shadow-raised">
            <div className="flex flex-col lg:flex-row min-h-[620px]">
              {/* Sidebar */}
              <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-white px-4 py-5">
                <div className="flex items-center gap-2 px-2 mb-6">
                  <div className="w-7 h-7 rounded-md bg-copper-dim text-copper flex items-center justify-center">
                    <Building2 size={14} />
                  </div>
                  <span className="text-sm font-semibold">Relay Studio</span>
                </div>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                  {DASHBOARD_NAV.map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                        active ? "bg-copper-dim text-copper font-medium" : "text-ink-muted"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </div>
                  ))}
                </nav>
              </aside>

              {/* Main panel */}
              <div className="flex-1 p-5 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-semibold">Overview</p>
                    <p className="text-xs text-ink-faint">Relaystudio.com · vs. previous week</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-teal font-medium bg-teal/10 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                    Widget live
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <StatTile icon={LogIn} label="Logins today" value={loginsToday.toString()} trend="↑ 21% vs last week" />
                  <StatTile icon={MousePointerClick} label="Click-through rate" value={`${ctr}%`} trend="↑ 0.6pt" />
                  <StatTile icon={Bot} label="Assistant conversations" value={assistantConvos.toLocaleString()} trend="↑ 12%" />
                  <StatTile icon={Eye} label="Most viewed page" value="/pricing" trend="32% of sessions" />
                </div>

                <div className="grid lg:grid-cols-[1fr_280px] gap-5">
                  <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <p className="text-sm font-medium">Logins - this week vs last week</p>
                      <div className="flex items-center gap-3 text-[11px] text-ink-faint">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-copper" />
                          This week
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-border" />
                          Last week
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                      {DAY_LABELS.map((day, i) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                          <div className="w-full flex items-end justify-center gap-1 h-32">
                            <div
                              className="w-1/2 rounded-t bg-copper/80 transition-all duration-500"
                              style={{
                                height: `${Math.min((THIS_WEEK_LOGINS[i] / WEEK_MAX) * 100, progress * 1.3)}%`,
                              }}
                            />
                            <div
                              className="w-1/2 rounded-t bg-border transition-all duration-500"
                              style={{
                                height: `${Math.min((LAST_WEEK_LOGINS[i] / WEEK_MAX) * 100, progress * 1.3)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-ink-faint">{day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <HelpCircle size={15} className="text-copper" />
                        <p className="text-sm font-medium">Most asked questions</p>
                      </div>
                      <div className="space-y-2.5">
                        {TOP_QUESTIONS.map((q) => (
                          <div key={q.question} className="flex items-start justify-between gap-3">
                            <p className="text-xs text-ink-muted leading-snug">{q.question}</p>
                            <span className="text-[10px] text-ink-faint shrink-0 mt-0.5">{q.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot size={15} className="text-teal" />
                        <p className="text-sm font-medium">AI summary</p>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        Logins are up 21% this week, mostly from the pricing page. The assistant's
                        top question is still password resets - a Knowledge Base article could
                        deflect most of those automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: typeof LogIn;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3.5">
      <div className="flex items-center gap-1.5 text-ink-faint mb-1">
        <Icon size={12} />
        <p className="text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-teal mt-1">{trend}</p>
    </div>
  );
}

const FEATURE_LIST = [
  {
    icon: Code2,
    title: "One script tag, live support the same day",
    description:
      "Paste a single script tag onto your site and Relay's AI chat widget is live immediately. No backend to build, no infrastructure to manage, no engineering time spent - your business has working AI support before the day is over.",
  },
  {
    icon: Bot,
    title: "An assistant that actually knows your business",
    description:
      "On the Pro plan, upload your own documents - policies, FAQs, product details - and Relay's assistant answers using your real business knowledge instead of guessing. If the answer isn't in what you've uploaded, it falls back to general knowledge rather than making something up.",
  },
  {
    icon: Repeat,
    title: "Reliable underneath, every time",
    description:
      "Behind every widget, messages try a chain of AI models automatically. If one model is rate-limited or down, the next one in line picks it up without your customers ever noticing - one provider's outage never becomes your problem.",
  },
  {
    icon: BarChart3,
    title: "Two dashboards - visitors and AI usage",
    description:
      "Business Analytics tracks visitor traffic on your site - sessions, page views, click-throughs - free on every plan. On Pro, a separate Usage dashboard shows how your AI Assistant is performing - conversation volume, message counts, and your busiest hours - so you know how your support is actually holding up.",
  },
  {
    icon: Building2,
    title: "Run more than one business, from one account",
    description:
      "Relay isn't limited to a single workspace. Create separate businesses under one login, each with its own team, its own AI assistant, its own analytics, and its own billing - switch between them in a couple of clicks.",
  },
  {
    icon: Users,
    title: "Built for teams, not just solo owners",
    description:
      "Invite teammates with Owner, Admin, or Member roles, hand off conversations between people, and talk to your team directly inside Relay's shared team chat - all scoped to the workspace they belong to.",
  },
  {
    icon: KeyRound,
    title: "Separate keys for separate jobs",
    description:
      "Analytics and AI Assistant access use entirely separate API keys - so a key that only tracks visitor traffic can never accidentally power your chat widget, and vice versa. Revoke either independently, any time.",
  },
  {
    icon: ShieldCheck,
    title: "Security that doesn't get in your way",
    description:
      "Two-factor authentication, session management, and Google sign-in are built in from day one - so protecting your account doesn't mean fighting your workflow to get it.",
  },
];

function Features() {
  return (
    <section id="features" className="border-t border-border bg-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">Why Relay</h2>
            <p className="text-ink-muted max-w-lg mx-auto">
              Not just a chatbot - a full workspace for running 
<span className="relative inline-block border border-emerald-700 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
 AI
</span> support across one business or
              several, with the dashboards to prove it's working.
            </p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_LIST.map(({ icon: Icon, title, description }) => (
            <Reveal key={title}>
              <div className="panel p-6 h-full">
                <div className="w-10 h-10 rounded-panel bg-copper-dim text-copper flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Building2,
    title: "Create your business",
    description:
      "Sign up and set up your first workspace in under a minute - free, no card required. Add more businesses under the same account whenever you need to.",
  },
  {
    icon: Code2,
    title: "Embed the widget",
    description:
      "Grab your Analytics key (free) or Assistant key (Pro) from your dashboard, paste the script tag onto your site, and Relay is live for your visitors immediately.",
  },
  {
    icon: MessageSquare,
    title: "Let Relay handle support",
    description:
      "Visitors chat with your AI assistant directly on your site. On Pro, upload your own documents so it answers with real business knowledge, not guesses.",
  },
  {
    icon: BarChart3,
    title: "Watch it in your dashboard",
    description:
      "See visitor traffic, conversation volume, and busiest hours roll in live - and invite your team to help manage conversations as they come in.",
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-border bg-white">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">How it
              
 <span className="relative inline-block border border-emerald-500 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
  works
</span></h2>
            <p className="text-ink-muted max-w-lg mx-auto">
              From sign-up to a live AI assistant on your site, in four steps.
            </p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-copper-dim text-copper flex items-center justify-center mx-auto mb-4">
                  <Icon size={20} />
                </div>
                <p className="text-xs font-semibold text-copper mb-1">Step {i + 1}</p>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  return (
    <section className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">
              Start free, upgrade when you need to
            </h2>
            <p className="text-ink-muted">No trials that expire. No 
  <span className="relative inline-block border border-emerald-700 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
 surprise
</span> charges.</p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Reveal>
            <div className="panel p-6 h-full transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:border-copper">
              <h3 className="font-semibold mb-1">Free</h3>
              <p className="text-xs text-ink-muted mb-4">For trying things out</p>
              <p className="text-3xl font-semibold mb-1">
                $0<span className="text-sm font-normal text-ink-muted">/month</span>
              </p>
              <p className="text-xs text-ink-faint mb-5">or NPR 0 for Nepal-based businesses</p>
              <ul className="space-y-2.5 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  5 messages per day
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Full conversation history
                </li>
               <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Analytics API key 
                </li>

                  <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  2 Buisness Account 
                </li>

                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Business Analytics dashboard (visitor traffic)
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  2 people from team up to plan seat cap
                </li>
              </ul>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-panel border-2 border-copper bg-surface p-6 h-full shadow-raised relative transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)]">
              <span className="absolute -top-3 left-6 bg-copper text-white text-[11px] font-medium px-3 py-1 rounded-full">
                Most popular
              </span>
              <h3 className="font-semibold mb-1">Pro</h3>
              <p className="text-xs text-ink-muted mb-4">For businesses that need more</p>
              <p className="text-3xl font-semibold mb-1">
                $9<span className="text-sm font-normal text-ink-muted">/month</span>
              </p>
              <p className="text-xs text-ink-faint mb-1">or NPR 999/month for Nepal-based businesses</p>
              <p className="text-xs text-ink-faint mb-5">
                $90/year (NPR 9,999/year) - two months free when billed yearly
              </p>
              <ul className="space-y-2.5 text-sm text-ink-muted">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  unlimited messages per day
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Full conversation history
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  API playground
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Knowledge Base - upload your own documents
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Analytics API key + Relay AI assistant 
                </li>
                 <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Multiple Business Account
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Usage dashboard - conversations, messages, busiest hours
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-teal shrink-0 mt-0.5" />
                  Priority support
                </li>
              </ul>
              <Link to="/register" className="btn-primary w-full text-center mt-6 block">
                Sign up to upgrade
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="text-center mt-8">
          <Link to="/pricing" className="text-copper hover:text-copper-bright font-medium text-sm">
            See full plan comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "How does Relay's AI Widget work on my website?",
    answer:
      "You copy a single line script tag provided in your Relay dashboard into your site HTML. Relay automatically loads a modern chat bubble that answers user questions using information from your Knowledge Base.",
  },
  {
    question: "What is the Knowledge Base and how do I train the AI?",
    answer:
      "The Knowledge Base is available on our Pro plan. You upload text, FAQs, or documents about your business. Relay processes and indexes them so your widget answers customer questions with your exact context.",
  },
  {
    question: "Do I need my own OpenAI or LLM API key?",
    answer:
      "No. Relay manages the vector storage and AI model pipeline automatically. You do not need to sign up for external AI services.",
  },
  {
    question: "Will the script tag slow down my website?",
    answer:
      "No. The Relay script loads asynchronously, ensuring zero impact on your site's initial load performance or PageSpeed scores.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-border bg-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-3">
   <span className="relative inline-block border border-emerald-700 bg-emerald-500/10 px-2 sm:px-4 text-copper">
  {/* Top-Left Handle */}
  <span className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Top-Right Handle */}
  <span className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Left Handle */}
  <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-emerald-500" />
  {/* Bottom-Right Handle */}
  <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-emerald-500" />
  
  FAQs
</span>
            </h2>
            <p className="text-ink-muted">Everything else people ask before connecting the widget.</p>
          </div>
        </Reveal>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={item.question}>
                <div className="panel overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-medium text-sm sm:text-base">{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-ink-faint transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-ink-muted leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="border-t border-border bg-white">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold mb-6">Why we built this</h2>
          <p className="text-ink-muted leading-relaxed mb-4">
            Individual AI models go down, get rate-limited, or quietly degrade in quality - and most
            chat products just show you an error, or worse, a wrong answer, when that happens. Betting
            a customer conversation on a single provider staying up isn't good enough once real people
            are on the other end of it.
          </p>
          <p className="text-ink-muted leading-relaxed mb-4">
            Relay was built to hide that fragility entirely. Every message tries a sequence of models
            in order, automatically, and the interface shows you exactly which one answered - so
            reliability isn't something your team has to think about, and it's never something your
            customers see break.
          </p>
          <p className="text-ink-muted leading-relaxed">
            And support shouldn't stop at "it's running." Every workspace gets real visibility - who's
            asking what, how fast it's answered, and whether your AI actually knows your business or
            is just guessing. That's the difference between a chatbot and a support system you can
            actually rely on.
          </p>

          <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-border">
            <div>
              <p className="text-2xl font-semibold text-copper">4+</p>
              <p className="text-xs text-ink-muted mt-1">Models in the fallback chain</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-copper">$0</p>
              <p className="text-xs text-ink-muted mt-1">To get started, no card needed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-copper">&lt;1s</p>
              <p className="text-xs text-ink-muted mt-1">Typical time to a working reply</p>
            </div>
          </div>
        </Reveal>
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
    <section id="contact" className="border-t border-border bg-white">
      <div className="max-w-lg mx-auto px-6 py-20">
        <Reveal>
          <div className="text-center mb-8">
            <div className="w-10 h-10 rounded-panel bg-copper-dim text-copper flex items-center justify-center mx-auto mb-4">
              <Mail size={18} />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-2">Get in touch</h2>
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
        </Reveal>
      </div>
    </section>
  );
}

// A dedicated links section, sitting just above the footer, with the Relay
// wordmark rendered large and faint in the background.
function FooterLinks() {
  return (
    <section className="relative border-t border-amber-900/10 bg-white overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="flex justify-center sm:justify-end gap-16">
          <div>
            <p className="text-xs font-semibold text-copper uppercase tracking-wide mb-3">
              About
            </p>
            <ul className="space-y-2 text-sm text-black/70">
              <li>
                <a href="#features" className="hover:text-green-600 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-green-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-green-600 transition-colors">
                  About us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-green-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
              Company
            </p>
            <ul className="space-y-2 text-sm text-black/70">
              <li>
                <a href="#contact" className="hover:text-green-600 transition-colors">
                  Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="font-heading pointer-events-none select-none absolute left-[25%] -translate-x-1/2 bottom-19 w-auto font-bold leading-none text-[20vw] sm:text-[10vw] tracking-tight text-transparent"
        style={{ WebkitTextStroke: "1px rgba(180, 130, 20, 0.45)" }}
      >
        Relay
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <p className="text-xs text-ink-faint">© {new Date().getFullYear()} Relay. All rights reserved.</p>
      </div>
    </footer>
  );
}