import { CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "./landing-data";
import { LandingSection } from "./shared/landing-section";
import { landingStyles } from "./shared/landing-styles";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function HowItWorksSection() {
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
      eyebrow="Process"
      title="How it works"
      description="Generate production-ready AWS infrastructure in three guided steps."
    >
      <div ref={sectionRef} className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-8 left-[calc(33%+1.5rem)] right-[calc(33%+1.5rem)] h-0.5 bg-gradient-to-r from-red-500/50 via-red-500/30 to-red-500/50" />
          
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <div 
              key={item.step} 
              className={cn(
                "relative transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={cn(landingStyles.cardAccent, "card-interactive group")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-sm font-bold text-white shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </span>
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 group-hover:animate-bounce-subtle transition-all" />
                </div>

                <h3 className="mt-3 text-sm sm:text-base font-semibold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{item.title}</h3>
                <p className="mt-1 text-[11px] sm:text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {item.features.map((feature, fIndex) => (
                    <li 
                      key={feature} 
                      className="flex items-center gap-2 text-[11px] sm:text-xs"
                      style={{ transitionDelay: `${(index * 150) + (fIndex * 50)}ms` }}
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-red-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className={cn(
          "text-center transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )} style={{ transitionDelay: "500ms" }}>
          <div className={cn(landingStyles.pill, "mx-auto w-fit px-4 py-2 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-300")}>
            <Zap className="h-4 w-4 text-red-500 animate-pulse" />
            <span className="font-semibold">Ready in minutes, not hours</span>
          </div>
          <p className="mt-2 text-[11px] sm:text-sm text-muted-foreground max-w-2xl mx-auto">
            Skip manual IaC writing and avoid common misconfigurations. Templates follow AWS best practices with security defaults.
          </p>
        </div>
      </div>
    </LandingSection>
  );
}