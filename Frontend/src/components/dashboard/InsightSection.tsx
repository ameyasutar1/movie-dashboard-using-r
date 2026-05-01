import { useReveal } from "@/hooks/useReveal";
import { ReactNode } from "react";

interface Props {
  index: string;
  total: string;
  eyebrow: string;
  headline: string;
  lede: string;
  takeaway: string;
  chart: ReactNode;
  reverse?: boolean;
}

export function InsightSection({
  index,
  total,
  eyebrow,
  headline,
  lede,
  takeaway,
  chart,
  reverse,
}: Props) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="border-b border-border">
      <div ref={ref} className="container-brief py-20 md:py-28 reveal">
        <div className="grid grid-cols-12 gap-6 md:gap-10 items-start">
          {/* Top-left: index */}
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-baseline gap-3">
              <span className="mono text-accent font-medium text-sm">Insight {index}</span>
              <span className="mono text-muted-foreground text-xs">/ {total}</span>
            </div>
            <span className="eyebrow mt-3 block">{eyebrow}</span>
          </div>
          {/* Top-right: headline */}
          <div className="col-span-12 md:col-span-7">
            <h2 className="serif text-3xl md:text-5xl text-primary font-semibold leading-[1.1]">
              {headline}
            </h2>
            <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {lede}
            </p>
          </div>

          {/* Bottom row: chart + takeaway, swap order on `reverse` */}
          <div
            className={`col-span-12 md:col-span-7 ${reverse ? "md:order-2" : ""}`}
          >
            <div className="bg-card border border-border p-5 md:p-7">{chart}</div>
          </div>
          <div
            className={`col-span-12 md:col-span-5 ${reverse ? "md:order-1" : ""}`}
          >
            <div className="takeaway">
              <span className="eyebrow">So what</span>
              <p className="serif text-xl md:text-2xl text-primary leading-snug mt-2">
                {takeaway}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
