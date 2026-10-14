import { LANDING_FEATURES } from "./landing-data";
import { LandingSection } from "./shared/landing-section";
import { landingStyles } from "./shared/landing-styles";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <LandingSection
      id="features"
      eyebrow="Capabilities"
      title="Next-Gen AWS Cloud Infrastructure Studio"
      description="From architecture blueprints and live compliance audits to CI/CD generation and FinOps right-sizing."
    >
      <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {LANDING_FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className={cn(
              "group rounded-3xl border border-border/80 bg-card/85 p-5 shadow-xs transition-all duration-500 hover:border-red-500/40 hover:bg-card hover:shadow-lg card-interactive",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-300">
              <feature.icon className="h-5 w-5 group-hover:animate-bounce-subtle" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground tracking-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
              {feature.title}
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              {feature.desc}
            </p>
            
            {/* Hover indicator line */}
            <div className="mt-4 h-1 w-0 bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-300 group-hover:w-full" />
          </div>
        ))}
      </div>
    </LandingSection>
  );
}