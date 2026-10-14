"use client";

import { useEffect, useRef, useState } from "react";
import { Server, Database, HardDrive, Network, Cpu, Globe, Lock, Cloud, Container, Layers, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { LandingSection } from "./shared/landing-section";

const SERVICES_3D = [
  {
    icon: Server,
    name: "EC2",
    desc: "Virtual Servers",
    color: "#FF9900",
    gradient: "from-orange-500 to-amber-500",
    features: ["Auto Scaling", "Load Balancing", "Spot Instances"],
  },
  {
    icon: Database,
    name: "RDS",
    desc: "Managed Databases",
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
    features: ["PostgreSQL", "MySQL", "Multi-AZ"],
  },
  {
    icon: HardDrive,
    name: "S3",
    desc: "Object Storage",
    color: "#22C55E",
    gradient: "from-green-500 to-emerald-500",
    features: ["Unlimited Scale", "Versioning", "Static Hosting"],
  },
  {
    icon: Cpu,
    name: "Lambda",
    desc: "Serverless Compute",
    color: "#EC4899",
    gradient: "from-pink-500 to-rose-500",
    features: ["Pay per Request", "Auto Scale", "Event Driven"],
  },
  {
    icon: Container,
    name: "ECS",
    desc: "Container Service",
    color: "#8B5CF6",
    gradient: "from-violet-500 to-purple-500",
    features: ["Fargate", "Auto Scaling", "Service Discovery"],
  },
  {
    icon: Network,
    name: "VPC",
    desc: "Virtual Network",
    color: "#06B6D4",
    gradient: "from-cyan-500 to-teal-500",
    features: ["Private Subnets", "NAT Gateway", "VPN"],
  },
  {
    icon: Globe,
    name: "CloudFront",
    desc: "CDN",
    color: "#F59E0B",
    gradient: "from-amber-500 to-yellow-500",
    features: ["Edge Locations", "Lambda@Edge", "SSL/TLS"],
  },
  {
    icon: Lock,
    name: "IAM",
    desc: "Access Control",
    color: "#EF4444",
    gradient: "from-red-500 to-rose-500",
    features: ["Roles", "Policies", "MFA"],
  },
];

export function Services3DSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setIsVisible(true),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <LandingSection
      id="services-3d"
      eyebrow="Services"
      title="32+ AWS Services at Your Fingertips"
      description="Click any service to see features. Hover for 3D effect."
    >
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {SERVICES_3D.map((service, index) => (
          <div
            key={service.name}
            className={cn(
              "relative group cursor-pointer transition-all duration-700",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
            style={{ 
              transitionDelay: `${index * 100}ms`,
              transform: activeIndex === index 
                ? 'scale(1.1) translateZ(50px)' 
                : activeIndex !== null 
                  ? 'scale(0.95) opacity-50' 
                  : `perspective(1000px) rotateY(${mousePos.x * 5}deg) rotateX(${-mousePos.y * 5}deg)`,
            }}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
              style={{ backgroundColor: service.color }}
            />
            
            {/* Card */}
            <div className="relative h-full p-5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Background gradient on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
                service.gradient
              )} />
              
              {/* Icon */}
              <div 
                className="relative flex h-12 w-12 items-center justify-center rounded-xl shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300"
                style={{ 
                  backgroundColor: `${service.color}20`,
                  boxShadow: `0 4px 20px ${service.color}30`,
                }}
              >
                <service.icon 
                  className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" 
                  style={{ color: service.color }}
                />
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{service.desc}</p>
              
              {/* Features - shown on active */}
              <div className={cn(
                "mt-3 space-y-1 overflow-hidden transition-all duration-300",
                activeIndex === index ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
              )}>
                {service.features.map((f) => (
                  <div key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-red-500" />
                    {f}
                  </div>
                ))}
              </div>
              
              {/* Hover indicator */}
              <div className={cn(
                "absolute bottom-0 left-0 h-1 bg-gradient-to-r transition-all duration-300",
                service.gradient,
                activeIndex === index ? "w-full" : "w-0"
              )} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 opacity-10 animate-float pointer-events-none">
        <Cloud className="h-20 w-20 text-red-500" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 animate-float pointer-events-none" style={{ animationDelay: "1s" }}>
        <Cloud className="h-16 w-16 text-red-500" />
      </div>
    </LandingSection>
  );
}