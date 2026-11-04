"use client";
import * as Card from "@/components/ui/card";
import * as Field from "@/components/ui/field";
import * as Select from "@/components/ui/select";
import {
  courseLevels,
  courseSchema,
  courseStatuses,
  CourseType,
} from "@/schemas/courseSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, PlusIcon, SparkleIcon } from "lucide-react";
import slugify from "slugify";
import { Textarea } from "@/components/ui/textarea";
import { dummyCategories } from "@/schemas/categorySchema";
import RichTextEditor from "@/components/text-editor/rich-text-editor";
import UploaderDropzone from "@/components/uploader/uploader-dropzone";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { createCourse } from "../courses/create/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/use-confetti";

function CreateCourseForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  const form = useForm<CourseType>({
    // resolver: zodResolver(courseSchema) as Resolver<CourseType>,
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      fileKey: "",
      price: 0,
      duration: 0,
      levels: "Beginner",
      category: "Health & Fitness",
      status: "Draft",
      slug: "",
      smallDescription: "",
    },
  });

  const onSubmit: SubmitHandler<CourseType> = (values: CourseType) => {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createCourse(values));
      if (error) {
        toast.error("An unexpected error occured. Please try again");
        return;
      }
      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
        form.reset();
        router.push("/admin/courses");
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  };
  return (
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Basic Information</Card.CardTitle>
        <Card.CardDescription>
          Provide basic information about the course
        </Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Field.FieldGroup>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Field data-invalid={fieldState.invalid}>
                  <Field.FieldLabel htmlFor="title">Title*</Field.FieldLabel>
                  <Input
                    {...field}
                    placeholder="Title"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <Field.FieldError errors={[fieldState.error]} />
                  )}
                </Field.Field>
              )}
            />
            <div className="flex items-end gap-4">
              <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field.Field data-invalid={fieldState.invalid}>
                    <Field.FieldLabel htmlFor="slug">Slug*</Field.FieldLabel>
                    <Input
                      {...field}
                      placeholder="Slug"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <Field.FieldError errors={[fieldState.error]} />
                    )}
                  </Field.Field>
                )}
              />
              <Button
                type="button"
                className="w-fit"
                onClick={() => {
                  const titleValue = form.getValues("title");
                  const slug = slugify(titleValue);
                  form.setValue("slug", slug, { shouldValidate: true });
                }}
              >
                Generate Slug <SparkleIcon size={16} className="ml-1" />
              </Button>
            </div>

            <Controller
              name="smallDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Field data-invalid={fieldState.invalid}>
                  <Field.FieldLabel htmlFor="smallDescription">
                    Small Description*
                  </Field.FieldLabel>
                  <Textarea
                    {...field}
                    placeholder="Small Description"
                    aria-invalid={fieldState.invalid}
                    className="min-h-[120px]"
                  />
                  {fieldState.invalid && (
                    <Field.FieldError errors={[fieldState.error]} />
                  )}
                </Field.Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Field data-invalid={fieldState.invalid}>
                  <Field.FieldLabel htmlFor="description">
                    Description*
                  </Field.FieldLabel>
                  {/* <Textarea
                    {...field}
                    placeholder="Description"
                    aria-invalid={fieldState.invalid}
                    className="min-h-[120px]"
                  /> */}
                  <RichTextEditor field={field} />
                  {fieldState.invalid && (
                    <Field.FieldError errors={[fieldState.error]} />
                  )}
                </Field.Field>
              )}
            />
            <Controller
              name="fileKey"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Field data-invalid={fieldState.invalid}>
                  <Field.FieldLabel htmlFor="fileKey">
                    Thumbnail Image*
                  </Field.FieldLabel>
                  <UploaderDropzone
                    value={field.value}
                    onChange={field.onChange}
                    fileTypeAccepted="image"
                  />

                  {fieldState.invalid && (
                    <Field.FieldError errors={[fieldState.error]} />
                  )}
                </Field.Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field.Field data-invalid={fieldState.invalid}>
                    <Field.FieldLabel htmlFor="category">
                      Category*
                    </Field.FieldLabel>
                    <Select.Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <Select.SelectTrigger className="w-full">
                        <Select.SelectValue placeholder="select category" />
                      </Select.SelectTrigger>
                      <Select.SelectContent>
                        {dummyCategories.map((category) => (
                          <Select.SelectItem key={category} value={category}>
                            {category}
                          </Select.SelectItem>
                        ))}
                      </Select.SelectContent>
                    </Select.Select>
                    {fieldState.invalid && (
                      <Field.FieldError errors={[fieldState.error]} />
                    )}
                  </Field.Field>
                )}
              />
              <Controller
                name="levels"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field.Field data-invalid={fieldState.invalid}>
                    <Field.FieldLabel htmlFor="level">Level*</Field.FieldLabel>
                    <Select.Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <Select.SelectTrigger className="w-full">
                        <Select.SelectValue placeholder="select level" />
                      </Select.SelectTrigger>
                      <Select.SelectContent>
                        {courseLevels.map((level) => (
                          <Select.SelectItem key={level} value={level}>
                            {level}
                          </Select.SelectItem>
                        ))}
                      </Select.SelectContent>
                    </Select.Select>
                    {fieldState.invalid && (
                      <Field.FieldError errors={[fieldState.error]} />
                    )}
                  </Field.Field>
                )}
              />
              <Controller
                name="duration"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field.Field data-invalid={fieldState.invalid}>
                    <Field.FieldLabel htmlFor="duration">
                      Duration (hours)*
                    </Field.FieldLabel>
                    <Input
                      {...field}
                      placeholder="Duration"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <Field.FieldError errors={[fieldState.error]} />
                    )}
                  </Field.Field>
                )}
              />
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field.Field data-invalid={fieldState.invalid}>
                    <Field.FieldLabel htmlFor="price">
                      Price ($)*
                    </Field.FieldLabel>
                    <Input
                      {...field}
                      placeholder="price"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <Field.FieldError errors={[fieldState.error]} />
                    )}
                  </Field.Field>
                )}
              />
            </div>
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field.Field data-invalid={fieldState.invalid}>
                  <Field.FieldLabel htmlFor="status">Status*</Field.FieldLabel>
                  <Select.Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <Select.SelectTrigger className="w-full">
                      <Select.SelectValue placeholder="select status" />
                    </Select.SelectTrigger>
                    <Select.SelectContent>
                      {courseStatuses.map((status) => (
                        <Select.SelectItem key={status} value={status}>
                          {status}
                        </Select.SelectItem>
                      ))}
                    </Select.SelectContent>
                  </Select.Select>
                  {fieldState.invalid && (
                    <Field.FieldError errors={[fieldState.error]} />
                  )}
                </Field.Field>
              )}
            />
          </Field.FieldGroup>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                Creating... <Loader2 className="ml-1 animate-spin" />
              </>
            ) : (
              <>
                Create Course
                <PlusIcon className="ml-1" size="16" />
              </>
            )}
          </Button>
        </form>
      </Card.CardContent>
    </Card.Card>
  );
}

export default CreateCourseForm;
