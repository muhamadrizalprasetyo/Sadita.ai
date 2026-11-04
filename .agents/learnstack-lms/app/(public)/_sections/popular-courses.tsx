"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Users, Clock } from "lucide-react";
import Image from "next/image";

export default function PopularCourses() {
  const courses = [
    {
      id: 1,
      title: "Advanced Web Development",
      category: "Technology",
      instructor: "Sarah Anderson",
      students: 12500,
      rating: 4.9,
      duration: "24 hours",
      price: "$99",
      image: "/images/web-development-course.png",
    },
    {
      id: 2,
      title: "UI/UX Design Masterclass",
      category: "Design",
      instructor: "Michael Chen",
      students: 8200,
      rating: 4.8,
      duration: "18 hours",
      price: "$89",
      image: "/images/ui-ux-design-masterclass.jpg",
    },
    {
      id: 3,
      title: "Data Science Fundamentals",
      category: "Technology",
      instructor: "Dr. Emily Watson",
      students: 9800,
      rating: 4.9,
      duration: "32 hours",
      price: "$129",
      image: "/images/data-science-fundamentals.jpg",
    },
    {
      id: 4,
      title: "Business Strategy & Leadership",
      category: "Business",
      instructor: "Robert Martinez",
      students: 5600,
      rating: 4.7,
      duration: "16 hours",
      price: "$79",
      image: "/images/business-strategy-leadership.jpg",
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
            Popular Courses
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Explore our most sought-after courses trusted by thousands of
            learners
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {courses.map((course) => (
            <motion.div
              key={course.id}
              variants={itemVariants}
              className="group my-4 sm:my-0"
            >
              <div className="h-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100 backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
                <div className="bg-muted relative h-40 overflow-hidden">
                  <Image
                    width={400}
                    height={500}
                    src={course.image || "/images/placeholder.svg"}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="bg-primary text-primary-foreground absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold">
                    {course.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="group-hover:text-primary mb-2 line-clamp-2 text-lg font-semibold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground mb-3 text-sm">
                    {course.instructor}
                  </p>

                  <div className="mb-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-primary text-primary" />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Users size={16} />
                      <span>{(course.students / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock size={16} />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-primary text-lg font-bold">
                      {course.price}
                    </span>
                    <Button size="sm" variant="outline">
                      Enroll
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button size="lg">Browse All Courses</Button>
        </motion.div>
      </div>
    </section>
  );
}
