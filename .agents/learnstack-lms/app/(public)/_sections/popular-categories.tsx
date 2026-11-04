"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Palette,
  TrendingUp,
  Users2,
  Lightbulb,
  Briefcase,
} from "lucide-react";

export default function PopularCategories() {
  const categories = [
    {
      icon: Code2,
      title: "Technology",
      courses: "245 Courses",
      color: "from-blue-500/10 to-blue-500/5",
    },
    {
      icon: Palette,
      title: "Design",
      courses: "156 Courses",
      color: "from-purple-500/10 to-purple-500/5",
    },
    {
      icon: TrendingUp,
      title: "Business",
      courses: "189 Courses",
      color: "from-green-500/10 to-green-500/5",
    },
    {
      icon: Users2,
      title: "Personal Development",
      courses: "203 Courses",
      color: "from-pink-500/10 to-pink-500/5",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      courses: "124 Courses",
      color: "from-yellow-500/10 to-yellow-500/5",
    },
    {
      icon: Briefcase,
      title: "Entrepreneurship",
      courses: "98 Courses",
      color: "from-orange-500/10 to-orange-500/5",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
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
            Popular Categories
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Explore diverse learning paths across multiple fields
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div key={category.title} variants={itemVariants}>
                <div className="group h-full cursor-pointer rounded-lg border border-slate-300 bg-slate-100 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br ${category.color} mb-4 flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="group-hover:text-primary mb-2 text-xl font-semibold transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {category.courses}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
