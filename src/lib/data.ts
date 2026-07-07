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
  demo: boolean;
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

;

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


