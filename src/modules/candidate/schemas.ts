import { z } from "zod";
import {
  avgTicketSizeOptions,
  b2bCustomerSegmentOptions,
  b2bPersonaOptions,
  b2cCustomerProfileOptions,
  b2cProductServiceOptions,
  b2cSalesChannelOptions,
  channelTypeOptions,
  binaryChoiceOptions,
  crmSalesPlatformOptions,
  dealSizeRangeOptions,
  employmentStatusOptions,
  esopPreferenceOptions,
  experienceRangeOptions,
  gemPortalOptions,
  govtSegmentOptions,
  jobSalesTypeOptions,
  largestTeamManagedOptions,
  marketFocusOptions,
  noticePeriodOptions,
  offeringTypeOptions,
  partnersManagedRangeOptions,
  primarySalesCategoryOptions,
  rfpExperienceOptions,
  salesMethodologyOptions,
  seniorSellingExperienceOptions,
  quotaAttainmentOptions,
  quotaBasisOptions,
  quotaCurrencyOptions,
  reasonForLeavingOptions,
  relocationPreferenceOptions,
  roleLevelOptions,
  salaryFlexibilityOptions,
  salesCycleOptions,
  startupPreferenceOptions,
  teamSizeOptions,
  travelPreferenceOptions,
  workModeOptions,
  tenderExperienceOptions,
} from "@/modules/shared/options";

export const profileSchema = z.object({
  dob: z.string().date(),
  currentCity: z.string().min(2).max(100),
  preferredCities: z.array(z.string().min(2).max(100)).max(5),
  relocationPreference: z.enum(relocationPreferenceOptions),
  travelPreference: z.enum(travelPreferenceOptions),
  workMode: z.enum(workModeOptions),
  primarySalesCategory: z.enum(primarySalesCategoryOptions),
  profileVisibility: z.boolean(),
});

const experienceOrder = ["FRESHER", "LT_1", "Y1_2", "Y2_3", "Y3_5", "Y5_7", "Y7_10", "Y10_12", "Y12_15", "Y15_20", "GT_20"] as const;

export const careerSchema = z
  .object({
    totalWorkExperience: z.enum(experienceRangeOptions),
    totalSalesExperience: z.enum(experienceRangeOptions),
    employmentStatus: z.enum(employmentStatusOptions),
    currentRoleLevel: z.enum(roleLevelOptions),
    highestRoleLevel: z.enum(roleLevelOptions),
    salesSubtypes: z.array(z.string().min(1)).min(1),
    industriesWorkedIn: z.array(z.string().min(1)).min(1),
    industriesSoldInto: z.array(z.string().min(1)).min(1),
    customerSegments: z.array(z.string().min(1)).min(1),
    geographyCovered: z.array(z.string().min(1)).min(1),
    markets: z.array(z.string().min(1)).min(1),
    highestQuotaValue: z.number().positive(),
    quotaCurrency: z.enum(quotaCurrencyOptions),
    teamManagement: z.boolean(),
    largestTeamManaged: z.enum(largestTeamManagedOptions),
    openToStartup: z.enum(startupPreferenceOptions),
  })
  .superRefine((value, ctx) => {
    if (experienceOrder.indexOf(value.totalSalesExperience) > experienceOrder.indexOf(value.totalWorkExperience)) {
      ctx.addIssue({
        code: "custom",
        path: ["totalSalesExperience"],
        message: "Sales experience cannot exceed work experience",
      });
    }
  });

export const b2bContextSchema = z.object({
  customerSegment: z.enum(b2bCustomerSegmentOptions),
  offeringType: z.enum(offeringTypeOptions),
  salesMethodologies: z.array(z.enum(salesMethodologyOptions)),
  cSuiteSelling: z.enum(seniorSellingExperienceOptions),
  rfpExperience: z.enum(rfpExperienceOptions),
  personas: z.array(z.enum(b2bPersonaOptions)),
  channelType: z.array(z.enum(channelTypeOptions)),
  partnersManaged: z.enum(partnersManagedRangeOptions),
  govtSegment: z.array(z.enum(govtSegmentOptions)),
  gemExperience: z.enum(gemPortalOptions),
  tenderExperience: z.enum(tenderExperienceOptions),
  marketFocus: z.array(z.enum(marketFocusOptions)),
});

export const b2cContextSchema = z.object({
  salesChannels: z.array(z.enum(b2cSalesChannelOptions)),
  productsSold: z.array(z.enum(b2cProductServiceOptions)),
  avgTicketSize: z.enum(avgTicketSizeOptions),
  customerProfile: z.array(z.enum(b2cCustomerProfileOptions)),
  teamSize: z.enum(teamSizeOptions),
  distributorManaged: z.enum(binaryChoiceOptions),
  beatPlanning: z.enum(binaryChoiceOptions),
});

export const jobSchema = z
  .object({
    id: z.string().uuid().optional(),
    companyName: z.string().min(2).max(140),
    designation: z.string().min(2).max(140),
    startDate: z.string().date(),
    endDate: z.string().date().optional().or(z.literal("")),
    isCurrent: z.boolean(),
    jobSalesType: z.enum(jobSalesTypeOptions),
    salesSubtype: z.array(z.string().min(1)).min(1),
    roleLevel: z.enum(roleLevelOptions),
    industry: z.string().min(1),
    industriesSoldInto: z.array(z.string().min(1)),
    geography: z.array(z.string().min(1)),
    directReports: z.number().int().min(0).max(5000),
    reasonForLeaving: z.enum(reasonForLeavingOptions),
    quotaValue: z.number().nonnegative(),
    quotaCurrency: z.enum(quotaCurrencyOptions),
    quotaAttainment: z.enum(quotaAttainmentOptions),
    quotaBasis: z.enum(quotaBasisOptions),
    dealSizeRange: z.enum(dealSizeRangeOptions),
    salesCycle: z.enum(salesCycleOptions),
    hunterPercentage: z.number().int().min(0).max(100),
    b2bContext: b2bContextSchema.optional(),
    b2cContext: b2cContextSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isCurrent && value.endDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be empty for current job" });
    }

    if (!value.isCurrent && !value.endDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date is required" });
    }

    if ((value.jobSalesType === "B2B" || value.jobSalesType === "BOTH") && !value.b2bContext) {
      ctx.addIssue({ code: "custom", path: ["b2bContext"], message: "B2B context is required" });
    }

    if ((value.jobSalesType === "B2C" || value.jobSalesType === "BOTH") && !value.b2cContext) {
      ctx.addIssue({ code: "custom", path: ["b2cContext"], message: "B2C context is required" });
    }
  });

export const skillsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().min(2).max(200),
      category: z.string().min(2).max(120),
      isCore: z.boolean(),
    })
  ),
  toolsCrm: z.array(z.enum(crmSalesPlatformOptions)),
  certifications: z.array(z.string().min(2, "Certification must be at least 2 characters").max(140)),
  achievements: z.array(
    z.object({
      description: z.string().min(100, "Min 100 characters").max(500, "Max 500 characters"),
    })
  ),
});

export const compensationSchema = z
  .object({
    currentFixed: z.number().nonnegative(),
    currentVariable: z.number().nonnegative(),
    expectedMin: z.number().nonnegative(),
    expectedIdeal: z.number().nonnegative(),
    esopPreference: z.enum(esopPreferenceOptions),
    noticePeriod: z.enum(noticePeriodOptions),
    salaryFlexibility: z.enum(salaryFlexibilityOptions),
  })
  .superRefine((value, ctx) => {
    if (value.expectedMin > value.expectedIdeal) {
      ctx.addIssue({ code: "custom", path: ["expectedIdeal"], message: "Ideal must be >= minimum" });
    }
  });

export const documentsSchema = z.object({
  resume: z.instanceof(File).optional(),
  salaryProof: z.instanceof(File).optional(),
  linkedinUrl: z.union([z.literal(""), z.string().url()]).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type CareerFormValues = z.infer<typeof careerSchema>;
export type JobFormValues = z.infer<typeof jobSchema>;
export type SkillsFormValues = z.infer<typeof skillsSchema>;
export type CompensationFormValues = z.infer<typeof compensationSchema>;
export type DocumentsFormValues = z.infer<typeof documentsSchema>;
