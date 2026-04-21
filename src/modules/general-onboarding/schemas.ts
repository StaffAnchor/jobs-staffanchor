import { z } from "zod";

export const generalAddressSchema = z.object({
  openToRelocation: z.enum(["OPEN_TO_RELOCATION", "NOT_OPEN_TO_RELOCATION"]),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  postalCode: z.string().min(3).max(20),
});

export const generalProfessionalSchema = z.object({
  functionDepartment: z.string().min(1).max(160),
  currentJobTitle: z.string().min(1).max(160),
  currentEmployer: z.string().min(1).max(160),
  totalExperienceYears: z.number().min(0).max(60),
  highestQualification: z.string().min(1).max(160),
  currentFixedSalaryLpa: z.number().min(0).max(1000000),
  domains: z.array(z.string().min(1)).min(1),
  skills: z.array(z.string().min(1)).min(1),
});

export const generalOnboardingSubmitSchema = z.object({
  address: generalAddressSchema,
  professional: generalProfessionalSchema,
  resumeUrl: z.string().url(),
});

export type GeneralAddressFormValues = z.infer<typeof generalAddressSchema>;
export type GeneralProfessionalFormValues = z.infer<typeof generalProfessionalSchema>;
export type GeneralOnboardingSubmitValues = z.infer<typeof generalOnboardingSubmitSchema>;
