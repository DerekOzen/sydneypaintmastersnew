import settings from "@/content/settings.json";
import servicesData from "@/content/services.json";

// Editable in the CMS via content/settings.json
export const site = {
  ...settings,
  phoneHref: "tel:" + settings.phone.replace(/[^0-9+]/g, ""),
  addressSyd: "Level 2, 1A The Crescent, Homebush NSW 2140",
  addressMel: "Melbourne, Victoria",
  ndisReg: "Registered NDIS Provider",
};

export const nav = [
  { label: "Home", href: "/" },
  {
    label: "About Us",
    href: "/about",
  },
  {
    label: "Our Services",
    href: "/our-services",
    children: [
      { label: "Personal Activities", href: "/our-services/personal-activities" },
      { label: "Personal Care", href: "/our-services/personal-activities" },
      { label: "Household Tasks", href: "/our-services/personal-activities" },
      { label: "Community Participation", href: "/our-services/personal-activities" },
      { label: "Transport & Shopping", href: "/our-services/personal-activities" },
      { label: "Supported Independent Living", href: "/our-services/personal-activities" },
      { label: "Respite Support", href: "/our-services/personal-activities" },
    ],
  },
  { label: "NDIS Support", href: "/#services" },
  { label: "For Participants", href: "/#onboarding" },
  { label: "Careers", href: "/contact" },
  { label: "Contact Us", href: "/contact" },
];

// Editable in the CMS via content/services.json
export const services = servicesData;

export const heroBadges = [
  { title: "Person-centred care", body: "Your goals, your choices", icon: "user" },
  { title: "Culturally inclusive", body: "Respecting diversity and beliefs", icon: "globe" },
  { title: "Flexible scheduling", body: "Support when and where you need it", icon: "clock" },
  { title: "Experienced team", body: "Compassionate and highly trained", icon: "shield" },
];

export const onboarding = [
  { n: 1, title: "Initial Enquiry", body: "Get in touch by phone, email or our website. Tell us a little about your needs." },
  { n: 2, title: "Discussion", body: "We'll chat about your goals, preferences and the type of support that would help." },
  { n: 3, title: "Meet & Greet", body: "Meet our team and we'll review your needs and support plan together." },
  { n: 4, title: "Service Agreement", body: "We'll confirm the details, complete paperwork and start your support." },
  { n: 5, title: "Welcome", body: "You're all set! We'll coordinate your support and work with you towards your goals." },
];

export const values = [
  { title: "Dignity", body: "We treat every person with kindness, integrity and respect.", icon: "heart" },
  { title: "Respect", body: "We celebrate differences and value each individual.", icon: "users" },
  { title: "Choice & Control", body: "You are empowered to make decisions about your life.", icon: "user" },
  { title: "Cultural Understanding", body: "We provide culturally safe and inclusive support.", icon: "globe" },
  { title: "Clear Communication", body: "We listen, explain and keep you informed every step of the way.", icon: "chat" },
];

export const whyChoose = [
  { title: "Trusted & NDIS Registered", body: "Registered NDIS provider committed to quality, safety and compliance.", icon: "shield" },
  { title: "Compassionate Local Team", body: "Friendly, experienced support workers who genuinely care.", icon: "heart" },
  { title: "Tailored Support", body: "We design support that fits your goals and lifestyle.", icon: "clipboard" },
  { title: "Across Melbourne & Sydney", body: "Delivering reliable support in the communities where you live.", icon: "pin" },
];

export const videos = [
  { title: "Empowering independence", body: "Hear how we support everyday goals and build confidence.", len: "2:10" },
  { title: "Connection & community", body: "Building meaningful relationships and social connections.", len: "2:10" },
  { title: "Culturally inclusive care", body: "Respecting culture, values and individual journeys.", len: "1:58" },
];

export const providerBadges = [
  { title: "NDIS Registered", icon: "shield" },
  { title: "Quality & Compliance", icon: "check" },
  { title: "Fully Insured & Accredited", icon: "lock" },
  { title: "Privacy Protected", icon: "lock" },
];

export const supportFits = [
  { title: "Daily living support", icon: "user" },
  { title: "Household tasks", icon: "home" },
  { title: "Community access", icon: "users" },
  { title: "Social & community connection", icon: "chat" },
];

export const cabaritaSuburbs = [
  "Cabarita", "Canada Bay", "Drummoyne", "Concord",
  "Rhodes", "Mortlake", "Five Dock", "Wareemba", "Abbotsford",
];

export const contactSteps = [
  { n: 1, title: "Enquiry", body: "You get in touch with us via phone, email or the quick enquiry form." },
  { n: 2, title: "Discussion", body: "We'll discuss your needs, goals and preferences to understand how we can help." },
  { n: 3, title: "Meet & Greet", body: "We'll arrange a meet & greet to ensure it feels like the right support for you." },
  { n: 4, title: "Support Plan", body: "We create a personalised support plan tailored to your goals and requirements." },
  { n: 5, title: "Get Started", body: "We begin delivering support and walk alongside you on your journey." },
];

export const contactFaqs = [
  { q: "How quickly will you respond?", a: "We aim to respond within 1 business day. For urgent enquiries, please call us." },
  { q: "How does onboarding work?", a: "Our onboarding process is simple and participant-focused. See the steps above." },
  { q: "How do you match support workers?", a: "We carefully match based on your needs, preferences and personality." },
];

export const serviceAreas = {
  melbourne: ["Melbourne CBD", "Inner suburbs", "Eastern suburbs", "Western suburbs", "Northern suburbs"],
  sydney: ["Sydney CBD", "Inner West", "Parramatta", "North West Sydney", "Greater Sydney"],
};
