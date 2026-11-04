"use client";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20">
      <div className="absolute inset-0 -z-10 container mx-auto">
        <div className="bg-primary/20 absolute top-20 left-20 h-72 w-72 rounded-full opacity-50 blur-3xl"></div>
        <div className="bg-accent/20 absolute right-20 bottom-20 h-72 w-72 rounded-full opacity-50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 backdrop-blur-md hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <Sparkles size={16} className="text-primary" />
          <span className="text-primary text-sm font-medium">
            Welcome to the future of learning
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-bold tracking-tight md:text-7xl"
        >
          Learn Skills That{" "}
          <span className="from-primary to-accent bg-gradient-to-r bg-clip-text text-transparent">
            Shape Your Future
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl leading-relaxed"
        >
          Unlock your potential with world-class courses taught by industry
          experts. Learn at your own pace, achieve your goals.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/sign-in">
            <Button size="lg" className="gap-2">
              Start Learning <ArrowRight size={20} />
            </Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline">
              Browse Courses
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-4 mt-16 grid grid-cols-1 gap-4 sm:mx-0 sm:grid-cols-3 md:gap-8"
        >
          {[
            { label: "50K+", value: "Active Students" },
            { label: "1000+", value: "Expert Courses" },
            { label: "98%", value: "Success Rate" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05 }}
              className="rounded-lg border border-slate-300 bg-slate-100 p-6 text-center backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/20"
            >
              <div className="text-primary mb-2 text-3xl font-bold md:text-4xl">
                {stat.label}
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
