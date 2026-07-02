export interface Artist {
  id: string;
  name: string;
  slug: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  price: number;
  verified: boolean;
  responseTime: string;
  categories: string[];
  specialties: string[];
  languages: string[];
  bio: string;
  portfolio: string[];
  featured: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  image: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  rating: number;
}

export const featuredArtists: Artist[] = [
  {
    id: "aiko-nakamura",
    name: "Aiko Nakamura",
    slug: "aiko-nakamura",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop",
    location: "Kuala Lumpur",
    rating: 4.9,
    reviewCount: 128,
    price: 350,
    verified: true,
    responseTime: "< 1hr",
    categories: ["bridal", "event", "editorial"],
    specialties: ["Bridal Makeup", "Soft Glam", "Korean Style"],
    languages: ["English", "Malay", "Japanese"],
    bio: "Award-winning makeup artist with 10+ years of experience specializing in bridal and soft glam looks.",
    portfolio: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop",
    ],
    featured: true,
  },
  {
    id: "sarah-ahmad",
    name: "Sarah Ahmad",
    slug: "sarah-ahmad",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop",
    location: "Petaling Jaya",
    rating: 4.8,
    reviewCount: 96,
    price: 280,
    verified: true,
    responseTime: "< 2hr",
    categories: ["hijab", "bridal", "event"],
    specialties: ["Hijab Styling", "Bridal", "Evening Glam"],
    languages: ["Malay", "English"],
    bio: "Specializing in hijab-friendly makeup and styling for all occasions.",
    portfolio: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=400&h=400&fit=crop",
    ],
    featured: true,
  },
  {
    id: "mei-ling-tan",
    name: "Mei Ling Tan",
    slug: "mei-ling-tan",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=750&fit=crop",
    location: "Bangsar",
    rating: 4.9,
    reviewCount: 214,
    price: 420,
    verified: true,
    responseTime: "< 30min",
    categories: ["editorial", "airbrush", "event"],
    specialties: ["Airbrush Makeup", "Editorial", "Celebrity"],
    languages: ["English", "Mandarin", "Malay"],
    bio: "Celebrity makeup artist known for editorial and airbrush techniques. Featured in Vogue Malaysia.",
    portfolio: [
      "https://images.unsplash.com/photo-1560577091-d04e73c5b65d?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
    ],
    featured: true,
  },
  {
    id: "priya-krishnan",
    name: "Priya Krishnan",
    slug: "priya-krishnan",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop",
    location: "Shah Alam",
    rating: 4.7,
    reviewCount: 75,
    price: 200,
    verified: false,
    responseTime: "< 3hr",
    categories: ["bridal", "hair", "lash"],
    specialties: ["Indian Bridal", "Hairstyling", "Lash Extensions"],
    languages: ["English", "Tamil", "Malay"],
    bio: "Expert in Indian bridal makeup with a modern twist. Combining traditional and contemporary styles.",
    portfolio: [
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop",
    ],
    featured: true,
  },
  {
    id: "lisa-wong",
    name: "Lisa Wong",
    slug: "lisa-wong",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=750&fit=crop",
    location: "Mont Kiara",
    rating: 4.8,
    reviewCount: 156,
    price: 320,
    verified: true,
    responseTime: "< 1hr",
    categories: ["event", "editorial", "sfx"],
    specialties: ["Event Makeup", "SFX", "Creative"],
    languages: ["English", "Mandarin"],
    bio: "Versatile artist excelling in everything from elegant events to creative SFX looks.",
    portfolio: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop",
    ],
    featured: true,
  },
  {
    id: "nur-aisyah",
    name: "Nur Aisyah",
    slug: "nur-aisyah",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop",
    location: "Subang Jaya",
    rating: 4.6,
    reviewCount: 43,
    price: 180,
    verified: false,
    responseTime: "< 2hr",
    categories: ["hijab", "event", "bridal"],
    specialties: ["Natural Makeup", "Hijab Styling", "Party Glam"],
    languages: ["Malay", "English"],
    bio: "Passionate about enhancing natural beauty with a focus on hijab-friendly styles.",
    portfolio: [],
    featured: true,
  },
];



export const categories: Category[] = [
  {
    id: "bridal",
    name: "Bridal",
    icon: "💍",
    count: 24,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop",
  },
  {
    id: "event",
    name: "Event",
    icon: "✨",
    count: 32,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop",
  },
  {
    id: "hijab",
    name: "Hijab",
    icon: "🧕",
    count: 18,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop",
  },
  {
    id: "editorial",
    name: "Editorial",
    icon: "📸",
    count: 15,
    image: "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=400&h=300&fit=crop",
  },
  {
    id: "airbrush",
    name: "Airbrush",
    icon: "💨",
    count: 12,
    image: "https://images.unsplash.com/photo-1560577091-d04e73c5b65d?w=400&h=300&fit=crop",
  },
  {
    id: "sfx",
    name: "SFX",
    icon: "🎭",
    count: 8,
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
  },
  {
    id: "hair",
    name: "Hair",
    icon: "💇",
    count: 20,
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=300&fit=crop",
  },
  {
    id: "lash",
    name: "Lash",
    icon: "👁️",
    count: 14,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop",
  },
];

export const testimonials: Testimonial[] = [
  {
    quote: "Aiko made me look absolutely stunning on my wedding day. Every detail was perfect, and the makeup lasted all day and night!",
    author: "Nurul Huda",
    role: "Bride, KL",
    rating: 5,
  },
  {
    quote: "Sarah understood exactly what I wanted for my hijab styling. She's incredibly talented and professional. Highly recommend!",
    author: "Farah Aminah",
    role: "Event Client",
    rating: 5,
  },
  {
    quote: "The booking process was so easy! Found the perfect artist in minutes and the results were beyond my expectations.",
    author: "Michelle Tan",
    role: "Regular Client",
    rating: 5,
  },
  {
    quote: "Mei Ling's airbrush technique is unmatched. My photoshoot looks turned out absolutely magazine-worthy!",
    author: "Amanda Lee",
    role: "Model, PJ",
    rating: 5,
  },
];

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export const faqs: FAQ[] = [
  {
    question: "How do I book a makeup artist on Leish!?",
    answer: "Booking is simple! Browse our directory of verified artists, filter by location, specialty, or availability, and select a time slot that works for you. Your booking is confirmed instantly.",
    category: "Booking",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, debit cards, and digital wallets including GrabPay, Touch 'n Go, and Boost. Payment is processed securely through our platform.",
    category: "Payment",
  },
  {
    question: "Is my deposit refundable?",
    answer: "Our cancellation policy varies by artist. Generally, deposits are refundable if you cancel at least 48 hours before your appointment. Check the specific artist's policy before booking.",
    category: "Payment",
  },
  {
    question: "How do I become a verified artist on Leish!?",
    answer: "Apply through our artist onboarding page. We review portfolios, verify credentials, and conduct an interview before approving artists. Once approved, you'll gain access to our full client base.",
    category: "Artists",
  },
  {
    question: "What happens if I'm not satisfied with my makeup?",
    answer: "We have a satisfaction guarantee policy. If you're not happy with your result, contact us within 24 hours and we'll work with the artist to make it right or provide a credit for your next booking.",
    category: "Booking",
  },
  {
    question: "Do you offer group bookings for bridal parties?",
    answer: "Yes! Many of our artists offer bridal party packages. You can book multiple artists or request a single artist who can accommodate group bookings. Contact artists directly through their profiles.",
    category: "Booking",
  },
  {
    question: "Are your artists experienced with diverse skin tones and types?",
    answer: "Absolutely. All our artists are trained in working with diverse skin tones, textures, and types. We celebrate diversity and ensure every client receives personalized, inclusive service.",
    category: "Artists",
  },
  {
    question: "How far in advance should I book?",
    answer: "For major events like weddings, we recommend booking 2-4 weeks in advance. For event makeup, 3-7 days is usually sufficient. Last-minute bookings depend on artist availability.",
    category: "Booking",
  },
  {
    question: "Do artists provide touch-up services?",
    answer: "Many artists offer touch-up services for an additional fee. Check individual artist profiles for their service offerings and pricing for touch-up sessions.",
    category: "Artists",
  },
  {
    question: "What is your privacy policy?",
    answer: "We take your privacy seriously. Your personal information is encrypted and never shared without consent. Booking details are kept confidential between you and your chosen artist.",
    category: "Privacy",
  },
];

export const stats = [
  { value: "500+", label: "Happy Brides" },
  { value: "4.9", label: "Avg Rating" },
  { value: "50+", label: "Pro Artists" },
  { value: "24/7", label: "Booking" },
];
