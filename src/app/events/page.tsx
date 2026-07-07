import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("eventsTitle"),
    description: t("eventsDescription"),
  };
}

const sampleEvents = [
  {
    id: "1",
    title: "Masterclass with Celebrity MUA",
    date: "Coming Soon",
    time: "10:00 AM - 4:00 PM",
    location: "Kuala Lumpur",
    category: "Workshop",
    image: "/placeholder.svg",
  },
  {
    id: "2",
    title: "Beauty Expo 2026",
    date: "Coming Soon",
    time: "9:00 AM - 7:00 PM",
    location: "Kuala Lumpur Convention Centre",
    category: "Expo",
    image: "/placeholder.svg",
  },
  {
    id: "3",
    title: "Bridal Makeup Workshop",
    date: "Coming Soon",
    time: "11:00 AM - 3:00 PM",
    location: "Penang",
    category: "Workshop",
    image: "/placeholder.svg",
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Discover beauty events, workshops, and masterclasses.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[2/1] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600/80 backdrop-blur-sm rounded-full">
                      {event.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    {event.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-rose-500" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {event.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 py-12">
            <p className="text-gray-400 dark:text-gray-500">
              More events coming soon. Stay tuned!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
