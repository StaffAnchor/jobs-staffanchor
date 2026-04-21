import { z } from "zod";
import { experienceRangeOptions } from "@/modules/shared/options";

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}, z.number().optional());

export const adminCandidateFilterSchema = z.object({
  search: z.string().trim().optional(),
  skills: z.array(z.string().trim().min(1)).default([]),
  totalWorkExperience: z.enum(experienceRangeOptions).optional(),
  totalSalesExperience: z.enum(experienceRangeOptions).optional(),
  currentFixedSalaryLpaMin: optionalNumber,
  currentFixedSalaryLpaMax: optionalNumber,
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
});

export type AdminCandidateFilterFormInput = z.input<typeof adminCandidateFilterSchema>;
export type AdminCandidateFilterFormValues = z.output<typeof adminCandidateFilterSchema>;
