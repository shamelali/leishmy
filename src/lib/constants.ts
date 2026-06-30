export const malaysianStates = [
  "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka",
  "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Putrajaya",
  "Sabah", "Sarawak", "Selangor", "Terengganu",
];

export const malaysiaDistricts: Record<string, string[]> = {
  Johor: ["Batu Pahat", "Johor Bahru", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Tangkak"],
  Kedah: ["Baling", "Bandar Baharu", "Kota Setar", "Kuala Muda", "Kubang Pasu", "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena", "Sik", "Yan"],
  Kelantan: ["Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"],
  "Kuala Lumpur": ["Bukit Bintang", "Cheras", "Kepong", "KLCC", "Segambut", "Setapak", "Sentul", "Titiwangsa", "Wangsa Maju", "Bandar Tun Razak"],
  Labuan: ["Labuan", "Victoria"],
  Melaka: ["Alor Gajah", "Jasin", "Melaka Tengah"],
  "Negeri Sembilan": ["Jelebu", "Jempol", "Kuala Pilah", "Port Dickson", "Rembau", "Seremban", "Tampin"],
  Pahang: ["Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Rompin", "Temerloh"],
  Penang: ["Barat Daya", "Timur Laut", "Seberang Perai Utara", "Seberang Perai Tengah", "Seberang Perai Selatan", "George Town"],
  Perak: ["Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak", "Kerian", "Kinta", "Kuala Kangsar", "Larut Matang dan Selama", "Manjung", "Muallim", "Perak Tengah", "Taiping", "Teluk Intan", "Ipoh"],
  Perlis: ["Kangar", "Arau", "Padang Besar"],
  Putrajaya: ["Putrajaya"],
  Sabah: ["Beaufort", "Beluran", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunak", "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas", "Putatan", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Tuaran"],
  Sarawak: ["Bau", "Betong", "Bintulu", "Dalat", "Julau", "Kanowit", "Kapit", "Kuching", "Lawas", "Limbang", "Miri", "Mukah", "Samarahan", "Sarikei", "Serian", "Sibu", "Sri Aman"],
  Selangor: ["Ampang", "Bangi", "Cheras", "Cyberjaya", "Gombak", "Hulu Langat", "Kajang", "Klang", "Kuala Selangor", "Petaling Jaya", "Puchong", "Rawang", "Sabak Bernam", "Semenyih", "Sepang", "Serdang", "Seri Kembangan", "Shah Alam", "Subang Jaya", "Sungai Buloh"],
  Terengganu: ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
};

export const malaysiaLanguages = [
  "English", "Malay (Bahasa Melayu)", "Mandarin Chinese", "Tamil",
];

export const southeastAsianLanguages = [
  ...malaysiaLanguages,
  "Cantonese", "Hokkien", "Teochew", "Hakka",
  "Indonesian (Bahasa Indonesia)", "Thai", "Vietnamese",
  "Tagalog (Filipino)", "Burmese (Myanmar)", "Khmer (Cambodian)",
  "Lao", "Japanese", "Korean", "Arabic", "Punjabi", "Sinhala",
  "Bisaya (Cebuano)", "Ilocano", "Minangkabau", "Buginese",
  "Batak", "Dayak", "Kadazan-Dusun", "Iban", "Javanese",
  "Sundanese", "Bajau", "Murut",
];

export const specialties = [
  "Bridal Makeup", "Event Glam", "Hijab Makeup", "Editorial Makeup",
  "Airbrush Makeup", "SFX Makeup", "Hairstyling", "Lash Extensions & Lift",
  "Natural Glam", "Touch-up Session", "Custom Makeup", "Body Painting",
  "Airbrushing", "Fashion Show", "Film & TV", "Others",
];

export const roleLabels: Record<string, string> = {
  client: "Client / Customer",
  artist: "Artist (MUA)",
  studio: "Beauty Studio",
};

export const roleDescriptions: Record<string, string> = {
  client: "Book makeup services from artists",
  artist: "Offer your makeup services on Leish!",
  studio: "List your studio and team of artists",
};

export const EMAIL_ALIASES = {
  support: "SUPPORT_EMAIL",
  billing: "BILLING_EMAIL",
  marketing: "MARKETING_EMAIL",
  admin: "ADMIN_EMAIL",
  notifications: "NOTIFICATIONS_EMAIL",
  info: "INFO_EMAIL",
  studio: "STUDIO_EMAIL",
  artist: "ARTIST_EMAIL",
} as const;

export function getEmailAlias(key: keyof typeof EMAIL_ALIASES): string {
  return process.env[EMAIL_ALIASES[key]] || `${key}@leish.my`;
}
