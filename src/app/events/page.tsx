import { getTranslations } from "next-intl/server";
import EventsContent from "./events-content";

export async function generateMetadata() {
  const m = await getTranslations("metadata");
  return {
    title: m("eventsTitle"),
    description: m("eventsDescription"),
  };
}

export default function EventsPage() {
  return <EventsContent />;
}
