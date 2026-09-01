import { useEffect, useRef, useState } from "react";
import { MessagesSquare, BarChart3, ShieldCheck, TrendingUp, Check, Sparkles } from "lucide-react";

interface Feature {
  icon: typeof MessagesSquare;
  title: string;
  description: string;
  visual: () => JSX.Element;
}

const FEATURES: Feature[] = [
  {
    icon: MessagesSquare,
    title: "Always-on customer support",
    description:
      "If one AI model is busy or down, Relay automatically hands the conversation to the next one in line - customers never see a broken chat, and every reply still lands in seconds.",
    visual: RelayVisual,
  },
  {
    icon: BarChart3,
    title: "Conversation analytics",
    description:
      "Every conversation is logged, so your team can see volume trends over time, spot spikes early, and understand what people are actually asking - without digging through raw chat logs.",
    visual: AnalyticsVisual,
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    description:
      "Verified email addresses, encrypted and revocable sessions, and plan-based access control keep business data safe by default - not as an afterthought bolted on later.",
    visual: SecurityVisual,
  },
  {
    icon: TrendingUp,
    title: "Scales as you grow",
    description:
      "Start free. Upgrade to Pro in one click when your team needs more room - no migration, no re-signup, no downtime while it happens.",
    visual: ScaleVisual,
  },
];

export function BusinessShowcase() {
  return (
    <section className="border-t border-border bg-canvas">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-3">How Relay supports your business</h2>
          <p className="text-ink-muted max-w-xl mx-auto">
            From the first customer message to team-wide insight - here's what's running underneath.
          </p>
        </div>

        {FEATURES.map((feature, i) => (
          <FeatureRow key={feature.title} feature={feature} reversed={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

/** Reveals once when scrolled into view, then stays visible (doesn't replay on scroll-out). */
function useInView(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** Bumps a counter on an interval - used to remount a visual's inner animation so it loops. */
function useCycle(intervalMs: number, enabled: boolean) {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setCycle((c) => c + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);
  return cycle;
}

function FeatureRow({ feature, reversed }: { feature: Feature; reversed: boolean }) {
  const { ref, inView } = useInView();
  const Visual = feature.visual;

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-14 transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
    >
      <div className={reversed ? "lg:order-2" : ""}>
        <div className="w-11 h-11 rounded-panel bg-copper-dim text-copper flex items-center justify-center mb-5">
          <feature.icon size={20} />
        </div>
        <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
        <p className="text-ink-muted leading-relaxed">{feature.description}</p>
      </div>

      <div
  className={`flex items-center justify-center ${reversed ? "lg:order-1" : ""}`}
>
  {inView && <Visual />}
</div>
    </div>
  );
}

// ---------- Visuals ---------- //

function RelayVisual() {
  const [stage, setStage] = useState(0);
const [typed, setTyped] = useState("");
const [isTyping, setIsTyping] = useState(false);

const [selectedModel, setSelectedModel] = useState(0);

const [showSearch, setShowSearch] = useState(false);

 const DEMOS = [
  {
    question: "How do I reset my password?",
    response:
      "You can reset your password by opening Settings → Security → Reset Password.\n\nA secure reset link has also been sent to your email.",
    search: "Searching account settings...",
    model: "Claude 4",
  },

  {
    question: "Can I change my subscription plan?",
    response:
      "Absolutely! Open Billing from your dashboard and click Upgrade Plan.\n\nYour subscription changes immediately without losing any data.",
    search: "Checking billing information...",
    model: "GPT-5",
  },

  {
    question: "How can I contact support?",
    response:
      "You can contact our support team from Help Center or by emailing support@relay.ai.\n\nAverage response time is under 10 minutes.",
    search: "Opening help center...",
    model: "Gemini 2.5",
  },

  {
    question: "Can I cancel anytime?",
    response:
      "Yes. Your subscription can be cancelled whenever you like.\n\nYou'll continue using Pro until the end of your billing period.",
    search: "Reading subscription policy...",
    model: "Claude 4",
  },

  {
    question: "Is my data encrypted?",
    response:
      "Yes.\n\nAll conversations are encrypted in transit and stored securely using enterprise-grade security standards.",
    search: "Checking security documentation...",
    model: "GPT-5",
  },
];

const [currentDemo, setCurrentDemo] = useState(0);

const current = DEMOS[currentDemo];

  useEffect(() => {
  setStage(0);
  setTyped("");
  setShowSearch(false);
  setSelectedModel(0);
  setIsTyping(false);

  const timers = [
    setTimeout(() => setStage(1), 2000),

    setTimeout(() => setStage(2), 4500),

    setTimeout(() => setStage(3), 7000),

    setTimeout(() => {
      setCurrentDemo((prev) => (prev + 1) % DEMOS.length);
    }, 15000),
  ];

  return () => timers.forEach(clearTimeout);

}, [currentDemo]);

  useEffect(() => {
  if (stage !== 3) {
    setTyped("");
    setIsTyping(false);
    return;
  }

  setIsTyping(true);

 const words = current.response.split(" ");
  let index = 0;

  const timer = setInterval(() => {
    index++;

    setTyped(words.slice(0, index).join(" "));

    if (index >= words.length) {
      clearInterval(timer);
      setIsTyping(false);
    }
  }, 80);

  return () => clearInterval(timer);
}, [stage, currentDemo]);

useEffect(() => {
  if (stage !== 2) return;

  setSelectedModel(0);

  const timers = [
    setTimeout(() => setSelectedModel(1), 800),
    setTimeout(() => setSelectedModel(2), 1600),
  ];

  return () => timers.forEach(clearTimeout);
}, [stage, currentDemo]);

useEffect(() => {
  if (stage !== 1) return;

  const timer = setTimeout(() => {
    setShowSearch(true);
  }, 1200);

  return () => clearTimeout(timer);
}, [stage, currentDemo]);

  return (
   <div className="w-full max-w-[360px] rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
      {/* Header */}

      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-canvas">

        <div>
          <p className="font-semibold text-sm">
            Relay AI
          </p>

          <p className="text-xs text-ink-faint">
            Customer Support Assistant
          </p>
        </div>

        <div className="w-3 h-3 rounded-full bg-teal animate-pulse"/>
      </div>

      {/* Chat */}

      <div className="p-4 space-y-4 min-h-[100px]">

        {/* USER */}

        <div
          className={`transition-all duration-700 ${
            stage >= 0
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <div className="bg-copper text-white rounded-xl rounded-br-md px-3 py-3 max-w-[70%] ml-auto text-xs">
           {current.question}
          </div>
        </div>

        {/* THINKING */}

        <div
  className={`transition-all duration-500 ${
    stage >= 1 && stage < 3
      ? "opacity-100 translate-y-0"
      : "opacity-0 -translate-y-2 pointer-events-none absolute"
  }`}
>
          <div className="bg-base-raised border border-border rounded-xl rounded-bl-md px-3 py-3 max-w-[70%] shadow-xs">
  <div className="flex items-center gap-2 mb-3">
    <div className="w-6 h-5 rounded-full bg-copper-dim text-copper flex items-center justify-center">
      <Sparkles size={14} />
    </div>

    <div>
      <p className="text-sm font-medium">Relay AI</p>
      <p className="text-xs text-ink-faint">Analyzing request</p>
    </div>
  </div>

  <ThinkingDots />

  <div
    className={`overflow-hidden transition-all duration-700 ${
      showSearch ? "max-h-15 opacity-100 mt-3" : "max-h-0 opacity-0"
    }`}
  >
   <div className="space-y-1 text-[11px] text-ink-faint">
     <p className="leading-tight">
  {current.search}
</p>
      <div className="h-1 bg-border rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-copper animate-[progress_1.6s_ease-in-out_infinite]" />
      </div>

     <p className="leading-tight">
  Checking account settings...
</p>
    </div>
  </div>
</div>
        </div>

        {/* MODEL */}

        <div
          className={`transition-all duration-700 ${
            stage >= 2
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
        <div className="rounded-lg bg-canvas border border-border px-3 py-2">

          <p className="text-[11px] text-ink-faint mb-2">
  Thinking...
</p>
<ModelRow
  name="Understanding your question"
  active={stage === 2 && selectedModel === 0}
  finished={stage >= 3}
/>

<ModelRow
  name="Searching company knowledge"
  active={stage === 2 && selectedModel === 1}
  finished={stage >= 3}
/>

<ModelRow
  name="Generating the best answer"
  active={stage === 2 && selectedModel === 2}
  finished={stage >= 3}
/>
          </div>
        </div>

        {/* RESPONSE */}

        <div
          className={`transition-all duration-700 ${
            stage >= 3
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <div className="bg-base-raised border border-border rounded-2xl rounded-bl-md px-4 py-3 text-xs whitespace-pre-line">

            {typed}

           {isTyping && (
  <span className="animate-pulse">
    |
  </span>
)}
          </div>
        </div>

      </div>

      {/* Footer */}

      <div className="border-t border-border px-5 py-3 flex justify-between items-center text-xs">

  <span>

    {stage === 0 && (
      <span className="text-ink-faint">
        Waiting for question...
      </span>
    )}

    {stage === 1 && (
      <span className="text-copper animate-pulse">
        Searching knowledge base...
      </span>
    )}

    {stage === 2 && (
      <span className="text-copper animate-pulse">
        Generating answer...
      </span>
    )}

    {stage === 3 && (
      <span className="text-teal font-medium">
        ✓ Response generated
      </span>
    )}

  </span>

  <span className="text-ink-faint">

    {stage === 3 ? "0.9 sec" : "--"}

  </span>

</div>
    </div>
  );
}

function ThinkingDots() {

  return (
    <div className="flex gap-2">

      <span className="w-2 h-2 rounded-full bg-copper animate-bounce"/>

      <span
        className="w-2 h-2 rounded-full bg-copper animate-bounce"
        style={{ animationDelay: ".2s" }}
      />

      <span
        className="w-2 h-2 rounded-full bg-copper animate-bounce"
        style={{ animationDelay: ".4s" }}
      />

    </div>
  );
}

function ModelRow({
  name,
  active,
  finished,
}: {
  name: string;
  active: boolean;
  finished: boolean;
}) {
  return (
    <div
     className={`flex items-center justify-between py-1 px-2 rounded-md transition-all duration-500 ${
       finished
  ? "bg-teal/10 border border-teal/20"
  : active
  ? "bg-copper/10 border border-copper/20"
  : "border border-transparent"
      }`}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
            finished
  ? "bg-teal"
  : active
  ? "bg-copper animate-pulse"
  : "bg-border"
          }`}
        />

        
 <p
  className={`text-[11px] font-medium leading-tight transition-colors duration-500 ${
    finished
  ? "text-teal"
  : active
  ? "text-copper"
  : "text-ink"
  }`}
>
  {name}
</p>
      </div>

      {/* Right */}
     {finished ? (
  <span className="text-[10px] font-medium text-teal flex items-center gap-1">
    ✓ Completed
  </span>
) : active ? (
  <span className="text-[10px] font-medium text-copper">
    In progress...
  </span>
) : (
  <span className="text-[10px] text-ink-faint">
    Waiting...
  </span>
)}
    </div>
  );
}



function AnalyticsVisual() {
  return <AnalyticsDashboard />;
}

function AnalyticsDashboard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let value = 0;

    const timer = setInterval(() => {
      value += 2;

      if (value > 100) {
        value = 0;
      }

      setProgress(value);
    }, 40);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-md relative">

  {/* Background Glow */}

  <div className="absolute -inset-4 bg-copper/10 blur-3xl rounded-full opacity-60 animate-pulse" />

  <div className="relative rounded-2xl border border-border bg-white/90 backdrop-blur-xl shadow-2xl p-4 h-[440px] overflow-hidden">

    {/* moving shimmer */}

    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      <div className="absolute -left-40 top-0 h-full w-40 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[dashboardShimmer_6s_linear_infinite]" />

    </div>

      {/* Header */}
        <div className="flex items-center justify-between mb-3">

        <div>
          <p className="font-semibold text-[13px]">
            Analytics Dashboard
          </p>

          <p className="text-[11px] text-ink-faint">
            Live business activity
          </p>
        </div>

        <span className="px-2 py-1 rounded-full bg-teal/10 text-teal text-xs font-medium animate-pulse">
          LIVE
        </span>

      </div>
    

      {/* Grid */}

      <div className="grid grid-cols-2 gap-2">

       <div className="rounded-xl border border-border bg-canvas p-3 shadow-sm h-[120px]">
  <ConversationCounter progress={progress} />
</div>

        <div className="rounded-xl border border-border bg-canvas p-3 shadow-sm h-[120px]">
          <ResponseCounter progress={progress} />
        </div>

        <div className="rounded-xl border border-border bg-canvas p-3 shadow-sm h-[140px]">
          <LineChart progress={progress} />
        </div>


        <div className="rounded-xl border border-border bg-canvas p-3 shadow-sm overflow-hidden h-[200px]">
          <NotificationFeed progress={progress} />
        </div>

      </div>

    </div>
</div>
  );
}


function LineChart({ progress }: { progress: number }) {
  const points =
    "10,95 45,80 80,90 120,60 160,70 210,30 260,40 310,15";

  const length = 520;

  const dots = [
    [10, 95],
    [45, 80],
    [80, 90],
    [120, 60],
    [160, 70],
    [210, 30],
    [260, 40],
    [310, 15],
  ];

  const activeIndex = Math.min(
    Math.floor((progress / 100) * (dots.length - 1)),
    dots.length - 1
  );

  const activeDot = dots[activeIndex];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}

      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="font-medium text-sm">
            Conversations
          </p>

          <p className="text-[11px] text-ink-faint">
            Last 24 hours
          </p>
        </div>

        <span className="text-teal text-sm font-semibold">
          +24%
        </span>
      </div>

      <svg
        width="100%"
        height="110"
        viewBox="0 0 320 110"
      >
        <defs>
          <linearGradient
            id="lineGradient"
            x1="0%"
            x2="100%"
          >
            <stop offset="0%" stopColor="#C88648" />
            <stop offset="100%" stopColor="#E2B36D" />
          </linearGradient>

          <linearGradient
            id="areaGradient"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="#C88648"
              stopOpacity=".25"
            />

            <stop
              offset="100%"
              stopColor="#C88648"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Grid */}

        {[20, 40, 60, 80].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="320"
            y2={y}
            stroke="#EFEFEF"
            strokeWidth="1"
          />
        ))}

        {/* Area */}

        <path
          d={`M10 95 L45 80 L80 90 L120 60 L160 70 L210 30 L260 40 L310 15 L310 110 L10 110 Z`}
          fill="url(#areaGradient)"
        />

        {/* Glow */}

        <polyline
          fill="none"
          stroke="#C88648"
          strokeWidth="8"
          opacity=".12"
          points={points}
        />

        {/* Main Line */}

        <polyline
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          strokeDasharray={length}
          strokeDashoffset={
            length - (length * progress) / 100
          }
          style={{
            transition:
              "stroke-dashoffset .05s linear",
          }}
        />

        {/* Dots */}

        {dots.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="#C88648"
          />
        ))}

        {/* Animated Current Point */}

        <circle
          cx={activeDot[0]}
          cy={activeDot[1]}
          r="6"
          fill="#C88648"
        >
          <animate
            attributeName="r"
            values="5;7;5"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Bottom Labels */}

      <div className="flex justify-between text-[10px] text-ink-faint mt-1 px-1">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function ConversationCounter({
  progress,
}: {
  progress: number;
}) {
  const conversations = Math.round(1250 + progress * 12);

  return (
    <div className="h-full flex flex-col justify-between">

      <div>

        <p className="text-[11px] text-ink-faint uppercase tracking-wide">
          Conversations
        </p>

       <h2 className="text-xl font-semibold mt-1 tabular-nums leading-none">
          {conversations.toLocaleString()}
        </h2>

      </div>

      <div className="mt-2">

        <div className="h-2 rounded-full bg-border overflow-hidden">

          <div
            className="h-full rounded-full bg-copper transition-all duration-300"
            style={{
              width: `${40 + progress * 0.5}%`,
            }}
          />

        </div>
<p className="text-[10px] text-teal mt-1">
          ↑ 18% from yesterday
        </p>

      </div>

    </div>
  );
}

function ResponseCounter({
  progress,
}: {
  progress: number;
}) {

  const speed = (1.8 - progress * 0.01).toFixed(1);

  return (
    <div className="h-full flex flex-col justify-between">

      <div>

        <p className="text-xs text-ink-faint uppercase tracking-wide">
          Avg Response
        </p>

        <div className="flex items-end gap-1 mt-1">

          <h2 className="text-xl font-semibold text-copper tabular-nums leading-none">
            {speed}
          </h2>

          <span className="text-xs text-ink-faint mb-0.5">
            sec
          </span>

        </div>

      </div>

      <div className="mt-2">

        <div className="flex justify-between text-xs text-ink-faint mb-2">

          <span>Slow</span>

          <span>Fast</span>

        </div>

        <div className="relative h-2 rounded-full bg-border">

          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-copper shadow-md transition-all duration-300"
            style={{
              left: `${20 + progress * 0.6}%`,
            }}
          />

        </div>

        <p className="text-[10px] text-teal mt-1">
          Faster than 94% of teams
        </p>

      </div>

    </div>
  );
}



function NotificationFeed({
  progress,
}: {
  progress: number;
}) {

  const notifications = [
    {
      avatar: "E",
      color: "bg-blue-500",
      title: "Emma started a new conversation",
      badge: "New",
      time: "Just now",
    },
    {
      avatar: "A",
      color: "bg-copper",
      title: "AI resolved a support request",
      badge: "AI",
      time: "5 sec ago",
    },
    {
      avatar: "L",
      color: "bg-green-500",
      title: "Lucas upgraded to Pro",
      badge: "Pro",
      time: "18 sec ago",
    },
    {
      avatar: "S",
      color: "bg-purple-500",
      title: "Sarah rated support ★★★★★",
      badge: "5★",
      time: "28 sec ago",
    },
    {
      avatar: "M",
      color: "bg-orange-500",
      title: "24 conversations completed",
      badge: "Done",
      time: "36 sec ago",
    },
    {
      avatar: "J",
      color: "bg-teal",
      title: "Knowledge base updated",
      badge: "Sync",
      time: "1 min ago",
    },
  ];

  const activeUsers = 118 + Math.round(progress * 0.3);

  const currentIndex =
    Math.floor(progress / 17) %
    notifications.length;

  const current =
    notifications[currentIndex];

  return (
    <div className="h-full flex flex-col">

      {/* Header */}

      <div className="flex items-center justify-between mb-2">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Live Activity
          </p>

          <p className="text-[10px] text-ink-faint">
            Real-time customer events
          </p>

        </div>

        <div className="flex items-center gap-1">

          <span className="w-2 h-2 rounded-full bg-teal animate-pulse"/>

          <span className="text-[10px] text-teal font-semibold">
            LIVE
          </span>

        </div>

      </div>

      {/* Notification */}

      <div className="relative h-[75px] overflow-hidden">

        <div
          key={currentIndex}
          className="absolute inset-0 rounded-xl border border-border bg-white shadow-sm px-3 py-2 animate-[notificationSlide_.45s_ease]"
        >

          <div className="flex items-start gap-3">

            {/* Avatar */}

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-semibold ${current.color}`}
            >
              {current.avatar}
            </div>

            <div className="flex-1 min-w-0">

              <div className="flex justify-between items-start gap-1">

                <p className="text-[11px] font-medium leading-snug">
                  {current.title}
                </p>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-copper-dim text-copper font-semibold whitespace-nowrap">
                  {current.badge}
                </span>

              </div>

              <p className="text-[10px] text-ink-faint mt-1">
                {current.time}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-auto pt-2 border-t border-border">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[10px] text-ink-faint">
              Active Visitors
            </p>

            <p className="text-sm font-semibold">
            {activeUsers}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] text-ink-faint">
              System
            </p>

            <p className="text-xs font-medium text-teal">
              ● Healthy
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}



function SecurityVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const progress =
    step === 0
      ? 0
      : step === 1
      ? 30
      : step === 2
      ? 65
      : step === 3
      ? 100
      : 100;

  return (
    <div className="w-full max-w-sm mx-auto animate-[float_5s_ease-in-out_infinite]">

      {/* CARD */}

      <div className="relative rounded-2xl border border-border bg-white shadow-xl p-5 overflow-hidden">

        {/* moving shimmer */}

        <div className="absolute inset-0 overflow-hidden pointer-events-none">

          <div className="absolute -left-40 top-0 h-full w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[dashboardShimmer_6s_linear_infinite]" />

        </div>

        {/* Header */}

        <div className="flex justify-between items-center mb-5">

          <div>

            <p className="font-semibold text-sm">
              Security Center
            </p>

            <p className="text-xs text-ink-faint">
              Live protection
            </p>

          </div>

          <span
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-500 ${
              step === 4
                ? "bg-teal/10 text-teal animate-pulse"
                : "bg-copper-dim text-copper animate-pulse"
            }`}
          >
            {step === 4 ? "Protected" : "Scanning"}
          </span>

        </div>

        {/* SHIELD */}

        <div className="flex justify-center mb-5">

          <div
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
              step === 4
                ? "bg-teal/10 scale-110"
                : "bg-copper-dim"
            }`}
          >

            {/* rotating scan */}

            <div className="absolute inset-0 rounded-full border-2 border-copper/20 border-t-copper animate-spin" />

            {/* pulse */}

            <div
              className={`absolute inset-0 rounded-full ${
                step === 4
                  ? "bg-teal/20 animate-ping"
                  : "bg-copper/20 animate-pulse"
              }`}
            />

            <ShieldCheck
              size={28}
              className={`relative transition-colors duration-500 ${
                step === 4
                  ? "text-teal"
                  : "text-copper"
              }`}
            />

          </div>

        </div>

        {/* Progress */}

        <div className="mb-5">

          <div className="flex justify-between text-xs text-ink-faint mb-2">

            <span>Security Scan</span>

            <span>{progress}%</span>

          </div>

          <div className="relative h-2 rounded-full bg-border overflow-hidden">

            <div
              className={`h-full transition-all duration-700 ${
                step === 4
                  ? "bg-teal"
                  : "bg-copper"
              }`}
              style={{
                width: `${progress}%`,
              }}
            />

            {/* shimmer */}

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[dashboardShimmer_2s_linear_infinite]" />

          </div>

        </div>

        {/* Checklist */}

        <div className="space-y-3">

          {[
            "Email verified",
            "Session encrypted",
            "Access granted",
          ].map((item, i) => (

            <div
              key={item}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-500 ${
                step > i + 1
                  ? "border-teal/20 bg-teal/5 translate-x-0 opacity-100"
                  : "border-border -translate-x-2 opacity-70"
              }`}
            >

              <span className="text-sm">
                {item}
              </span>

              {step > i + 1 ? (
                <Check
                  size={16}
                  className="text-teal animate-bounce"
                />
              ) : (
                <div className="w-4 h-4 rounded-full border border-border animate-pulse" />
              )}

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

function ScaleVisual() {
  const [users, setUsers] = useState(1);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const runCounter = (value: number) => {
      setUsers(value);

      let delay = 130;

      // Pause at each pricing tier
      if (value === 5 || value === 25 || value === 55) {
        delay = 1000;
      }

      timer = setTimeout(() => {
        if (value >= 55) {
          runCounter(1);
        } else {
          runCounter(value + 1);
        }
      }, delay);
    };

    runCounter(1);

    return () => clearTimeout(timer);
  }, []);

  let activePlan = 0;

  if (users <= 5) {
    activePlan = 0;
  } else if (users <= 25) {
    activePlan = 1;
  } else {
    activePlan = 2;
  }

  const progress = (users / 55) * 100;

  return (
    <div className="w-full max-w-[370px] rounded-xl border border-border bg-white shadow-lg overflow-hidden">

      {/* Header */}

      <div className="px-4 py-3 border-b border-border flex items-center justify-between">

        <div>

          <h3 className="text-sm font-semibold">

            Auto Scaling

          </h3>

          <p className="text-[11px] text-ink-faint">

            Infrastructure grows automatically

          </p>

        </div>

        

      </div>

      {/* Counter */}

      <div className="px-4 py-4">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-wider text-ink-faint">

              Active Users

            </p>

            <div className="flex items-end gap-2 mt-1">

              <h2
                key={users}
                className="text-3xl font-bold text-copper tabular-nums animate-[fadeIn_.2s]"
              >
                {users}
              </h2>

              <span className="text-xs text-ink-faint mb-1">

                online

              </span>

            </div>

          </div>

          <span className="text-xs font-medium text-teal">

            Auto Upgrade

          </span>

        </div>

        <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">

          <div
            className="h-full bg-copper transition-all duration-150"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Pricing */}

      <PlanSelector active={activePlan} />

    </div>
  );
}


function PlanSelector({
  active,
}: {
  active: number;
}) {
  const plans = [
    {
      name: "Free",
      price: "$0/mo",
      users: "5 Users",
      messages: "50 msgs/day",
    },
    {
      name: "Pro",
      price: "$9/mo",
      users: "25 Users",
      messages: "170 msgs/day",
    },
    {
      name: "Yearly",
      price: "$90/yr",
      users: "55 Users",
      messages: "400 msgs/day",
    },
  ];

  const current = plans[active];

  return (
    <div className="px-4 pb-4">

      {/* Tabs */}

      <div className="grid grid-cols-3 gap-2 mb-3">

        {plans.map((plan, index) => (

          <button
            key={plan.name}
            className={`relative rounded-lg border py-2 transition-all duration-500 ${
              active === index
                ? "border-copper bg-copper/10 shadow-sm"
                : "border-border bg-canvas"
            }`}
          >

            {/* Glow */}

            {active === index && (
              <div className="absolute inset-0 rounded-lg bg-copper/5 animate-pulse" />
            )}

            <div className="relative">

              <div
                className={`mx-auto mb-1 h-2 w-2 rounded-full ${
                  active === index
                    ? "bg-copper animate-pulse"
                    : "bg-border"
                }`}
              />

              <p
                className={`text-[11px] font-semibold ${
                  active === index
                    ? "text-copper"
                    : "text-ink"
                }`}
              >
                {plan.name}
              </p>

            </div>

          </button>

        ))}

      </div>

      {/* Current Plan */}

      <div className="rounded-lg border border-border bg-canvas px-3 py-3">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-wider text-ink-faint">

              Current Plan

            </p>

            <h4 className="mt-1 text-lg font-bold text-copper">

              {current.name}

            </h4>

          </div>

          <span className="rounded-full bg-teal/10 px-2 py-1 text-[10px] font-medium text-teal">

            ACTIVE

          </span>

        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">

          <div>

            <p className="text-[10px] text-ink-faint">
              Price
            </p>

            <p className="text-sm font-semibold">
              {current.price}
            </p>

          </div>

          <div>

            <p className="text-[10px] text-ink-faint">
              Team
            </p>

            <p className="text-sm font-semibold">
              {current.users}
            </p>

          </div>

          <div>

            <p className="text-[9px] text-ink-faint">
              Messages
            </p>

            <p className="text-xs font-semibold">
              {current.messages}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}