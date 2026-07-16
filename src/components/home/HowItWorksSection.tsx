import { Search, CalendarCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function HowItWorksSection() {
  const t = await getTranslations("howItWorks");

  const steps = [
    {
      num: "01",
      Icon: Search,
      title: t('step1Title'),
      description: t('step1Desc'),
      color: "#e11d48",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      num: "02",
      Icon: CalendarCheck,
      title: t('step2Title'),
      description: t('step2Desc'),
      color: "#db2777",
      bgColor: "bg-pink-50 dark:bg-pink-950/30",
    },
    {
      num: "03",
      Icon: Sparkles,
      title: t('step3Title'),
      description: t('step3Desc'),
      color: "#8b5cf6",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <section
      className="py-24 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-neutral-900"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
            {t('label')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            {t('heading')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
            {t('subheading')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800 dark:to-pink-800" />
              )}

              <div className="relative z-10">
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${step.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.Icon className="w-8 h-8" style={{ color: step.color }} />
                </div>

                <span className="text-xs font-bold text-rose-400 dark:text-rose-500 tracking-widest mb-2 block">
                  STEP {step.num}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
