"use client";

import { motion } from "framer-motion";
import { BookOpen, Users, Zap, Award, Globe, Lock } from "lucide-react";
import * as Card from "@/components/ui/card";

export default function Features() {
  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Courses",
      description:
        "Access to hundreds of expertly curated courses across multiple disciplines and skill levels.",
    },
    {
      icon: Users,
      title: "Expert Instructors",
      description:
        "Learn from industry professionals with years of real-world experience and proven teaching skills.",
    },
    {
      icon: Zap,
      title: "Learn at Your Pace",
      description:
        "Study whenever you want, wherever you want. No rigid schedules, complete flexibility.",
    },
    {
      icon: Award,
      title: "Certifications",
      description:
        "Earn recognized certificates upon completion to showcase your skills to employers.",
    },
    {
      icon: Globe,
      title: "Global Community",
      description:
        "Connect with learners from around the world, share knowledge, and grow together.",
    },
    {
      icon: Lock,
      title: "Lifetime Access",
      description:
        "Once enrolled, access course materials forever. No expiration dates or restrictions.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Why Choose LearnStack?
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Everything you need to succeed in your learning journey
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={itemVariants}>
                <div className="h-full rounded-lg border border-slate-300 bg-slate-100 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

//
