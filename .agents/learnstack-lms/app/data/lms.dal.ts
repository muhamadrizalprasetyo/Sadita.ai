import { prisma } from "@/lib/db";
import { submission_status_enum, lesson_type_enum, material_type_enum } from "@/lib/generated/prisma/enums";

/**
 * Data Access Layer untuk LMS SADITA.ai
 */

export async function getLessonsByClass(classId: number) {
  return await prisma.course_lessons.findMany({
    where: { class_id: classId },
    orderBy: { lesson_number: "asc" },
    include: {
      course_chapters: true,
      course_materials: true,
      assignments: {
        include: {
          assignment_submissions: true,
        },
      },
      quizzes: true,
      attendance_sessions: {
        include: {
          attendance_records: true,
          sadita_devices: true,
        },
      },
    },
  });
}

export async function getLessonDetail(lessonId: number) {
  return await prisma.course_lessons.findUnique({
    where: { id: lessonId },
    include: {
      course_classes: {
        include: {
          courses: true,
          lecturer_profiles: {
            include: { users: true },
          },
          class_enrollments: {
            include: {
              student_profiles: {
                include: { users: true },
              },
            },
          },
        },
      },
      course_chapters: true,
      course_materials: true,
      assignments: {
        include: {
          assignment_submissions: {
            include: {
              student_profiles: {
                include: { users: true },
              },
            },
          },
        },
      },
      quizzes: {
        include: {
          quiz_questions: {
            orderBy: { question_number: "asc" },
            include: {
              quiz_options: {
                orderBy: { option_number: "asc" },
              },
            },
          },
          quiz_submissions: true,
        },
      },
      attendance_sessions: {
        include: {
          attendance_records: {
            include: {
              student_profiles: {
                include: { users: true },
              },
            },
          },
          sadita_devices: true,
        },
      },
    },
  });
}

export async function createCourseLesson(data: {
  classId: number;
  chapterId?: number;
  title: string;
  description?: string;
  lessonNumber: number;
  lessonType?: lesson_type_enum;
  content?: string;
  videoUrl?: string;
}) {
  return await prisma.course_lessons.create({
    data: {
      class_id: data.classId,
      chapter_id: data.chapterId,
      title: data.title,
      description: data.description,
      lesson_number: data.lessonNumber,
      lesson_type: data.lessonType || "DOCUMENT",
      content: data.content,
      video_url: data.videoUrl,
      is_published: true,
    },
  });
}

export async function createCourseMaterial(data: {
  classId: number;
  lessonId: number;
  title: string;
  description?: string;
  materialType: material_type_enum;
  fileUrl?: string;
  externalUrl?: string;
  contentText?: string;
  fileSize?: number;
}) {
  return await prisma.course_materials.create({
    data: {
      class_id: data.classId,
      lesson_id: data.lessonId,
      title: data.title,
      description: data.description,
      material_type: data.materialType,
      file_url: data.fileUrl,
      external_url: data.externalUrl,
      content_text: data.contentText,
      file_size: data.fileSize,
      is_active: true,
    },
  });
}

export async function createAssignment(data: {
  classId: number;
  lessonId: number;
  title: string;
  description?: string;
  dueDate: Date;
  maxScore?: number;
  allowLate?: boolean;
}) {
  return await prisma.assignments.create({
    data: {
      class_id: data.classId,
      lesson_id: data.lessonId,
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
      max_score: data.maxScore || 100,
      allow_late: data.allowLate ?? true,
      assignment_type: "DOCUMENT",
      show_answer: false,
      is_published: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
}

export async function submitAssignment(data: {
  assignmentId: number;
  studentId: number;
  fileUrl?: string;
  content?: string;
}) {
  const assignment = await prisma.assignments.findUnique({
    where: { id: data.assignmentId },
  });

  if (!assignment) throw new Error("Tugas tidak ditemukan");

  const now = new Date();
  const isLate = now > assignment.due_date;
  const status: submission_status_enum = isLate ? "LATE" : "SUBMITTED";

  return await prisma.assignment_submissions.upsert({
    where: {
      assignment_id_student_id: {
        assignment_id: data.assignmentId,
        student_id: data.studentId,
      },
    },
    create: {
      assignment_id: data.assignmentId,
      student_id: data.studentId,
      file_url: data.fileUrl,
      content: data.content,
      submitted_at: now,
      status,
    },
    update: {
      file_url: data.fileUrl,
      content: data.content,
      submitted_at: now,
      status,
    },
  });
}

export async function gradeAssignmentSubmission(data: {
  submissionId: number;
  score: number;
  feedback?: string;
  gradedByLecturerId: number;
}) {
  return await prisma.assignment_submissions.update({
    where: { id: data.submissionId },
    data: {
      score: data.score,
      feedback: data.feedback,
      graded_by: data.gradedByLecturerId,
      graded_at: new Date(),
      status: "GRADED",
    },
  });
}

export async function createQuiz(data: {
  classId: number;
  lessonId: number;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimitMinutes?: number;
  questions: Array<{
    questionText: string;
    points: number;
    options: Array<{
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}) {
  return await prisma.$transaction(async (tx) => {
    const quiz = await tx.quizzes.create({
      data: {
        class_id: data.classId,
        lesson_id: data.lessonId,
        title: data.title,
        description: data.description,
        passing_score: data.passingScore || 70,
        max_attempts: 1,
        time_limit_minutes: data.timeLimitMinutes || 30,
        shuffle_questions: false,
        is_published: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const createdQ = await tx.quiz_questions.create({
        data: {
          quiz_id: quiz.id,
          question_text: q.questionText,
          question_type: "SINGLE_CHOICE",
          points: q.points,
          question_number: i + 1,
          created_at: new Date(),
        },
      });

      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        await tx.quiz_options.create({
          data: {
            question_id: createdQ.id,
            option_text: opt.optionText,
            is_correct: opt.isCorrect,
            option_number: j + 1,
          },
        });
      }
    }

    return quiz;
  });
}
