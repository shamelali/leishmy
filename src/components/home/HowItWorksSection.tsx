import { Search, CalendarCheck, Sparkles } from "lucide-react";

const steps = [
  {
    num: "01",
    Icon: Search,
    title: "Browse Artists",
    description:
      "Explore Malaysia's top makeup artists and studios. Filter by style, location, or budget.",
    color: "#e11d48",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
  },
  {
    num: "02",
    Icon: CalendarCheck,
    title: "Book Instantly",
    description:
      "Select your date and time, choose your services, and secure your booking with instant confirmation.",
    color: "#db2777",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    num: "03",
    Icon: Sparkles,
    title: "Get Glam",
    description:
      "Relax and let our expert artists work their magic. You'll leave looking and feeling amazing.",
    color: "#8b5cf6",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
];

export function HowItWorksSection() {
  return (
    <section
      className="py-24 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-neutral-900"
      id="how-it-works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
            The Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            How It Works
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">
            Get your perfect look in three simple steps
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
