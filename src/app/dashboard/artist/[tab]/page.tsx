import { redirect } from "next/navigation";

const ARTIST_TABS = [
  "bookings",
  "quotes",
  "prices",
  "packages",
  "pricing",
  "payouts",
  "availability",
  "analytics",
  "account",
  "profile",
  "portfolio",
];

export default async function ArtistTabRedirectPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  const target = ARTIST_TABS.includes(tab)
    ? `/dashboard/artist#/${tab}`
    : "/dashboard/artist";
  redirect(target);
}