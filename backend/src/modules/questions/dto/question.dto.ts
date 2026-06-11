import { z } from "zod";

// Question content block (text, LaTeX, image)
const ContentBlockSchema = z.object({
  type: z.enum(["TEXT", "LATEX", "IMAGE"]),
  content: z.string().optional(),
  asset_id: z.string().optional(),
});

// Base schema for all question types
const BaseQuestionSchema = z.object({
  topic_id: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  marks: z.number().default(1),
  negative_marks: z.number().default(0),
  solution_json: z.array(ContentBlockSchema).optional(),
});

// Single correct MCQ (supports 4 or 5 option variants)
export const SingleCorrectMCQSchema = BaseQuestionSchema.extend({
  type: z.literal("SINGLE_CORRECT"),
  content_json: z.array(ContentBlockSchema).min(1),
  option_count: z.enum(["4", "5"]).optional(), // UI hint: 4-option or 5-option MCQ
  options_json: z.object({
    options: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      )
      .min(2)
      .max(6),
  }),
  answer_key: z.object({
    correct_option: z.string(),
  }),
});

// Multiple correct MCQ (supports 4 or 5 option variants)
export const MultipleCorrectMCQSchema = BaseQuestionSchema.extend({
  type: z.literal("MULTIPLE_CORRECT"),
  content_json: z.array(ContentBlockSchema).min(1),
  option_count: z.enum(["4", "5"]).optional(), // UI hint: 4-option or 5-option MCQ
  options_json: z.object({
    options: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      )
      .min(2)
      .max(6),
  }),
  answer_key: z.object({
    correct_options: z.array(z.string()).min(1),
  }),
});

// Assertion-Reasoning (behaves like single correct MCQ with fixed options)
export const AssertionReasonSchema = BaseQuestionSchema.extend({
  type: z.literal("ASSERTION_REASON"),
  content_json: z.array(ContentBlockSchema).min(1),
  options_json: z.object({
    options: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      )
      .min(4)
      .max(4),
  }),
  answer_key: z.object({
    correct_option: z.string(),
  }),
});

// Essay
export const EssaySchema = BaseQuestionSchema.extend({
  type: z.literal("ESSAY"),
  content_json: z.array(ContentBlockSchema).min(1),
  options_json: z.any().optional(),
  answer_key: z.any().optional(),
});

// Image Based
export const ImageBasedSchema = BaseQuestionSchema.extend({
  type: z.literal("IMAGE_BASED"),
  content_json: z.array(ContentBlockSchema).min(1),
  options_json: z.any().optional(),
  answer_key: z.any().optional(),
});

// Numerical
export const NumericalSchema = BaseQuestionSchema.extend({
  type: z.literal("NUMERICAL"),
  content_json: z.array(ContentBlockSchema).min(1),
  options_json: z.any().optional(),
  answer_key: z.any().optional(),
});

// True/False
export const TrueFalseSchema = BaseQuestionSchema.extend({
  type: z.literal("TRUE_FALSE"),
  content_json: z.array(ContentBlockSchema).min(1),
  answer_key: z.object({
    answer: z.boolean(),
  }),
});

// Fill in the blank
export const FillBlankSchema = BaseQuestionSchema.extend({
  type: z.literal("FILL_BLANK"),
  content_json: z.array(ContentBlockSchema).min(1),
  answer_key: z.object({
    blanks: z
      .array(
        z.object({
          position: z.number(),
          answer: z.string(),
          case_sensitive: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
});

// Matching
export const MatchingSchema = BaseQuestionSchema.extend({
  type: z.literal("MATCHING"),
  content_json: z.array(ContentBlockSchema).min(1),
  options_json: z.object({
    left_column: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      )
      .min(1),
    right_column: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
        }),
      )
      .min(1),
  }),
  answer_key: z.object({
    pairs: z
      .array(
        z.object({
          left_id: z.string(),
          right_id: z.string(),
        }),
      )
      .min(1),
  }),
});

// Passage with sub-questions
export const PassageSchema = BaseQuestionSchema.extend({
  type: z.literal("PASSAGE"),
  content_json: z.array(ContentBlockSchema).min(1), // Passage text
  options_json: z.object({
    sub_questions: z
      .array(
        z.object({
          id: z.string(),
          question_text: z.string(),
          question_type: z.enum([
            "SINGLE_CORRECT",
            "MULTIPLE_CORRECT",
            "TRUE_FALSE",
          ]),
          options: z
            .array(
              z.object({
                id: z.string(),
                text: z.string(),
              }),
            )
            .min(2),
        }),
      )
      .min(1),
  }),
  answer_key: z.object({
    answers: z.any(), // Flexible record of answers for each sub-question
  }),
});

// Union of all question types
export const CreateQuestionSchema = z.discriminatedUnion("type", [
  SingleCorrectMCQSchema,
  MultipleCorrectMCQSchema,
  AssertionReasonSchema,
  TrueFalseSchema,
  FillBlankSchema,
  MatchingSchema,
  PassageSchema,
  NumericalSchema,
  EssaySchema,
  ImageBasedSchema,
]);

export type CreateQuestionType = z.infer<typeof CreateQuestionSchema>;

// Create question request schema (exported for controller use)
export const CreateQuestionRequestSchema = CreateQuestionSchema;
export type CreateQuestionRequestType = CreateQuestionType;

// Update question schema (all fields optional)
export const UpdateQuestionSchema = z.object({
  topic_id: z.string().optional(),
  type: z.string().optional(),
  content_json: z.array(ContentBlockSchema).optional(),
  options_json: z.any().optional(),
  answer_key: z.any().optional(),
  solution_json: z.array(ContentBlockSchema).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
  marks: z.number().optional(),
  negative_marks: z.number().optional(),
});

export type UpdateQuestionType = z.infer<typeof UpdateQuestionSchema>;
