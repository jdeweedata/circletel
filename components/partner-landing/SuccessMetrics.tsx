'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, TrendingUp, Award, Banknote } from 'lucide-react';

const metrics = [
  {
    icon: Users,
    value: 200,
    suffix: '+',
    prefix: '',
    label: 'Active Partners',
    description: 'Across South Africa',
  },
  {
    icon: Banknote,
    value: 2.5,
    suffix: 'M+',
    prefix: 'R',
    label: 'Paid in 2024',
    description: 'Total commissions',
    decimals: 1,
  },
  {
    icon: TrendingUp,
    value: 18500,
    suffix: '',
    prefix: 'R',
    label: 'Average Monthly',
    description: 'Per active partner',
    format: true,
  },
  {
    icon: Award,
    value: 98,
    suffix: '%',
    prefix: '',
    label: 'Satisfaction',
    description: 'Partner rating',
  },
];

function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  format = false,
  duration = 2000 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  decimals?: number;
  format?: boolean;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(value * easeOut);
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  const displayValue = decimals > 0 
    ? count.toFixed(decimals) 
    : format 
      ? Math.round(count).toLocaleString() 
      : Math.round(count);

  return (
    <div ref={ref} className="text-3xl lg:text-4xl font-extrabold mb-2 text-circleTel-orange">
      {prefix}{displayValue}{suffix}
    </div>
  );
}

export function SuccessMetrics() {
  return (
    <section className="py-16 bg-gradient-to-br from-circleTel-darkNeutral to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            Partner Success in Numbers
          </h2>
          <p className="text-gray-400">
            Real results from partners building with CircleTel
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-circleTel-orange/20 mb-4 group-hover:bg-circleTel-orange/30 group-hover:scale-110 transition-all duration-300">
                  <Icon className="h-7 w-7 text-circleTel-orange" />
                </div>
                <AnimatedCounter 
                  value={metric.value} 
                  prefix={metric.prefix} 
                  suffix={metric.suffix}
                  decimals={metric.decimals}
                  format={metric.format}
                />
                <div className="text-lg font-semibold mb-1">{metric.label}</div>
                <div className="text-sm text-gray-400">{metric.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
