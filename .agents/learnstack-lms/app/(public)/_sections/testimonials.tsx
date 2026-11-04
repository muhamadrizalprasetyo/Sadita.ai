"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Jessica Thompson",
      role: "Product Manager at TechCorp",
      content:
        "LearnStack completely transformed my career. The courses are incredibly well-structured and the community support is amazing.",
      rating: 5,
      avatar: "/images/jessica-woman-avatar.jpg",
    },
    {
      id: 2,
      name: "Marcus Johnson",
      role: "Freelance Designer",
      content:
        "I went from complete beginner to landing design clients within 3 months. The quality of instruction here is unmatched.",
      rating: 5,
      avatar: "/images/marcus-man-avatar.jpg",
    },
    {
      id: 3,
      name: "Sarah Mitchell",
      role: "Data Analyst at Fortune 500",
      content:
        "The curriculum is constantly updated with the latest industry standards. I use the skills I learned daily in my job.",
      rating: 5,
      avatar: "/images/sarah-woman-avatar.jpg",
    },
    {
      id: 4,
      name: "David Chen",
      role: "Startup Founder",
      content:
        "Not just learned technical skills but also business acumen. Highly recommend for anyone serious about growth.",
      rating: 5,
      avatar: "/images/david-man-avatar.jpg",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <section className="bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Student Testimonials
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            See what our learners are saying about their LearnStack experience
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <div className="h-full rounded-lg border border-slate-300 bg-slate-100 p-6 backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
                <div className="mb-4 flex gap-1">
                  {Array(testimonial.rating)
                    .fill(null)
                    .map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className="fill-primary text-primary"
                      />
                    ))}
                </div>

                <p className="text-muted-foreground mb-6 line-clamp-3">
                  &quot;{testimonial.content}&quot;
                </p>

                <div className="flex items-center gap-3">
                  <Image
                    width={400}
                    height={500}
                    src={testimonial.avatar || "/images/placeholder.svg"}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
