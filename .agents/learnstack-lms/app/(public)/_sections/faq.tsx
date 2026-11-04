"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How do I get started with LearnStack?",
      answer:
        "Getting started is easy! Simply sign up with your email, explore our course catalog, and enroll in any course that interests you. You can start learning immediately.",
    },
    {
      question: "Can I access courses on mobile?",
      answer:
        "LearnStack is fully optimized for mobile devices. Download our app or access through your browser to learn on the go.",
    },
    {
      question: "Is there a refund policy?",
      answer:
        "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with a course, simply request a refund within 30 days of purchase.",
    },
    {
      question: "Are certificates recognized by employers?",
      answer:
        "Yes, our certificates are industry-recognized and highly valued by employers. You can add them to your LinkedIn profile and resume.",
    },
    {
      question: "How long do I have access to courses?",
      answer:
        "Once you enroll in a course, you have lifetime access. You can learn at your own pace, revisit materials anytime, and stay updated with new content.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, PayPal, and various other payment methods depending on your location.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-xl">
            Find answers to common questions about LearnStack
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div key={index} variants={itemVariants}>
              <div
                className="cursor-pointer overflow-hidden rounded-lg border border-slate-300 bg-slate-100 backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              >
                <div className="flex items-center justify-between p-6">
                  <h3 className="pr-4 text-lg font-semibold">{faq.question}</h3>
                  <ChevronDown
                    size={24}
                    className={`text-primary flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>

                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="text-muted-foreground border-border border-t px-6 pt-4 pb-6">
                    {faq.answer}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
