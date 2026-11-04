import { TFeaturesList, TNavItems } from "@/types";

export const featuresList: TFeaturesList[] = [
  {
    title: "Comprehensive Courses",
    description:
      "Access a wide range of courses across various subjects, designed by industry experts.",
    icon: "📚",
  },
  {
    title: "Interactive Learning",
    description:
      "Engage with interactive content, quizzes, and real-world projects to enhance your learning experience.",

    icon: "🎮",
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor your learning journey with detailed progress reports and analytics.",
    icon: "📈",
  },
  {
    title: "Community Support",
    description:
      "Join a vibrant community of learners and instructors to share knowledge and support each other.",
    icon: "🤝",
  },
];

export const navItems: TNavItems[] = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Courses",
    href: "/courses",
  },
  {
    name: "Dashboard",
    href: "/admin",
  },
];
