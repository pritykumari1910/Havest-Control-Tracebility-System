import { useLang, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const opts: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "es", label: "ES" },
  ];
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-background/70 p-0.5 shadow-sm backdrop-blur",
        className,
      )}
    >
      {opts.map((o) => {
        const active = lang === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLang(o.code)}
            aria-pressed={active}
            className={cn(
              "min-w-[36px] rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
