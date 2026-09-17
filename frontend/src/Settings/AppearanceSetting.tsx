import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, ThemeMode } from "@/context/Themecontext";

export default function AppearanceSetting() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-semibold">Appearance</h1>
        <p className="text-xs text-ink-muted mt-1">
          Customize how Relay looks on this device.
        </p>
      </div>

      <ThemeModeCard />

    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                              THEME MODE                                */
/* ---------------------------------------------------------------------- */

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemeModeCard() {
  const { mode, setMode } = useTheme();

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Sun size={16} className="text-copper" />
        <h2 className="text-sm font-semibold">Theme</h2>
      </div>

      <div className="p-5">
        <p className="text-[11px] text-ink-muted mb-4">
          Choose how Relay looks. Selecting "System" will match your device's setting automatically.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = mode === value;
            return (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 transition ${
                  active
                    ? "border-copper bg-copper/5"
                    : "border-border hover:bg-surface-hover"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? "bg-copper text-white" : "bg-canvas text-ink-muted"
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-xs font-medium ${
                    active ? "text-copper" : "text-ink-muted"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}