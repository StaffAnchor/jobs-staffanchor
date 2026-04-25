"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/forms/tag-input";
import { SearchableSkillPicker } from "@/components/forms/searchable-skill-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { StepProgress } from "@/components/forms/step-progress";
import { candidateApi } from "@/modules/candidate/api";
import {
  careerSchema,
  compensationSchema,
  documentsSchema,
  jobSchema,
  profileSchema,
  skillsSchema,
  type CareerFormValues,
  type CompensationFormValues,
  type DocumentsFormValues,
  type JobFormValues,
  type ProfileFormValues,
  type SkillsFormValues,
} from "@/modules/candidate/schemas";
import { useOnboardingStore } from "@/modules/candidate/store";
import {
  avgTicketSizeOptions,
  avgTicketSizeOptionLabels,
  b2bCustomerSegmentOptions,
  b2bCustomerSegmentOptionLabels,
  b2bPersonaOptions,
  b2bPersonaOptionLabels,
  b2cCustomerProfileOptionLabels,
  b2cCustomerProfileOptions,
  b2cProductServiceOptionLabels,
  b2cProductServiceOptions,
  b2cSalesChannelOptionLabels,
  b2cSalesChannelOptions,
  channelTypeOptions,
  channelTypeOptionLabels,
  crmSalesPlatformOptions,
  crmSalesPlatformOptionLabels,
  b2bSalesSubtypeOptionLabels,
  b2bSalesSubtypeOptions,
  binaryChoiceOptions,
  customerSegmentOptionLabels,
  customerSegmentOptions,
  dealSizeRangeOptions,
  employmentStatusOptions,
  employmentStatusOptionLabels,
  esopPreferenceOptions,
  esopPreferenceOptionLabels,
  experienceRangeOptions,
  experienceRangeOptionLabels,
  gemPortalOptions,
  gemPortalOptionLabels,
  geographyCoveredOptionLabels,
  geographyCoveredOptions,
  govtSegmentOptions,
  govtSegmentOptionLabels,
  industryOptionGroups,
  industryOptionLabels,
  industryOptions,
  jobSalesTypeOptions,
  largestTeamManagedOptions,
  largestTeamManagedOptionLabels,
  marketSoldToOptionLabels,
  marketSoldToOptions,
  marketFocusOptions,
  marketFocusOptionLabels,
  noticePeriodOptions,
  noticePeriodOptionLabels,
  offeringTypeOptions,
  offeringTypeOptionLabels,
  partnersManagedRangeOptions,
  partnersManagedRangeOptionLabels,
  primarySalesCategoryOptions,
  quotaAttainmentOptions,
  quotaAttainmentOptionLabels,
  quotaBasisOptions,
  quotaBasisOptionLabels,
  quotaCurrencyOptions,
  reasonForLeavingOptionLabels,
  reasonForLeavingOptions,
  relocationPreferenceOptions,
  rfpExperienceOptions,
  rfpExperienceOptionLabels,
  roleLevelOptions,
  roleLevelOptionLabels,
  roleBandLabels,
  salaryFlexibilityOptions,
  salaryFlexibilityOptionLabels,
  salesCycleOptions,
  salesCycleOptionLabels,
  salesMethodologyOptions,
  salesMethodologyOptionLabels,
  startupPreferenceOptionLabels,
  startupPreferenceOptions,
  seniorSellingExperienceOptions,
  seniorSellingExperienceOptionLabels,
  beatPlanningOptionLabels,
  distributorManagedOptionLabels,
  teamSizeOptions,
  teamSizeOptionLabels,
  travelPreferenceOptions,
  workModeOptions,
  b2cSalesSubtypeOptionLabels,
  b2cSalesSubtypeOptions,
  tenderExperienceOptions,
  tenderExperienceOptionLabels,
} from "@/modules/shared/options";
import { getApiErrorMessage } from "@/modules/shared/error";
import { formatCurrency } from "@/lib/utils";

const stepLabels = [
  "Profile",
  "Career Snapshot",
  "Work History",
  "Skills",
  "Compensation",
  "Documents",
  "Review",
];

const OTHER_CITY_VALUE = "__OTHER_CITY__";
const OTHER_JOB_INDUSTRY_VALUE = "__OTHER_JOB_INDUSTRY__";

function hasStatusCode(error: unknown, statusCode: number) {
  const maybeAxiosError = error as { response?: { status?: number } };
  return maybeAxiosError?.response?.status === statusCode;
}

const cityOptionGroups = [
  {
    label: "Tier 1 - Metros",
    cities: ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"],
  },
  {
    label: "Tier 2",
    cities: [
      "Jaipur",
      "Lucknow",
      "Chandigarh",
      "Indore",
      "Bhopal",
      "Nagpur",
      "Surat",
      "Vadodara",
      "Coimbatore",
      "Kochi",
      "Visakhapatnam",
      "Patna",
      "Ranchi",
      "Bhubaneswar",
      "Guwahati",
      "Dehradun",
      "Ludhiana",
      "Agra",
      "Nashik",
      "Rajkot",
      "Madurai",
      "Varanasi",
      "Mysuru",
      "Mangaluru",
      "Thiruvananthapuram",
      "Vijayawada",
    ],
  },
  {
    label: "International (for NRI/Global roles)",
    cities: [
      "Dubai",
      "Abu Dhabi",
      "Singapore",
      "USA - Any",
      "UK - Any",
      "Australia - Any",
      "Canada - Any",
      "Middle East - Any",
      "Southeast Asia - Any",
      "Germany",
      "Netherlands",
    ],
  },
] as const;

const preferredCityOptionGroups = [
  ...cityOptionGroups,
  {
    label: "Flexible Preferences",
    cities: ["Anywhere in India", "Remote Only"],
  },
] as const;

const listedCities = cityOptionGroups.flatMap((group) => group.cities);

function isListedCity(city: string) {
  return listedCities.includes(city as (typeof listedCities)[number]);
}

const jobsArraySchema = z.object({
  jobs: z.array(jobSchema).min(1),
});

const jobGeographyOptions = ["CITY", "STATE", "REGIONAL", "NATIONAL", "INTERNATIONAL"] as const;
const jobGeographyOptionLabels: Record<(typeof jobGeographyOptions)[number], string> = {
  CITY: "City",
  STATE: "State",
  REGIONAL: "Regional",
  NATIONAL: "National",
  INTERNATIONAL: "International",
};

const annualQuotaBandOptionsByCurrency = {
  INR: [
    { value: 0, label: "Not Quota-bearing" },
    { value: 1000000, label: "Up to Rs10 Lakh" },
    { value: 2500000, label: "Rs10L - Rs25L" },
    { value: 5000000, label: "Rs25L - Rs50L" },
    { value: 10000000, label: "Rs50L - Rs1 Crore" },
    { value: 20000000, label: "Rs1 Cr - Rs2 Cr" },
    { value: 50000000, label: "Rs2 Cr - Rs5 Cr" },
    { value: 100000000, label: "Rs5 Cr - Rs10 Cr" },
    { value: 250000000, label: "Rs10 Cr - Rs25 Cr" },
    { value: 500000000, label: "Rs25 Cr - Rs50 Cr" },
    { value: 1000000000, label: "Rs50 Cr - Rs100 Cr" },
    { value: 2000000000, label: "Rs100 Cr - Rs200 Cr" },
    { value: 5000000000, label: "Rs200 Cr - Rs500 Cr" },
    { value: 10000000000, label: "Rs500 Cr - Rs1000 Cr" },
    { value: 10000000001, label: "Above Rs1000 Cr" },
  ],
  USD: [
    { value: 0, label: "Not Quota-bearing" },
    { value: 50000, label: "< $50K" },
    { value: 200000, label: "$50K - $200K" },
    { value: 500000, label: "$200K - $500K" },
    { value: 1000000, label: "$500K - $1M" },
    { value: 3000000, label: "$1M - $3M" },
    { value: 5000000, label: "$3M - $5M" },
    { value: 10000000, label: "$5M - $10M" },
    { value: 25000000, label: "$10M - $25M" },
    { value: 25000001, label: "$25M+" },
  ],
} as const;

type QuotaCurrencyCode = keyof typeof annualQuotaBandOptionsByCurrency;

function getNormalizedQuotaBandValue(currency: QuotaCurrencyCode, value: number) {
  const bands = annualQuotaBandOptionsByCurrency[currency];
  if (bands.some((band) => band.value === value)) {
    return value;
  }

  if (value <= bands[0].value) {
    return bands[0].value;
  }

  for (const band of bands) {
    if (value <= band.value) {
      return band.value;
    }
  }

  return bands[bands.length - 1].value;
}

function normalizeSalesSubtypeValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function EnumOptions({ items }: { items: readonly string[] }) {
  return (
    <>
      <option value="">Select</option>
      {items.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </>
  );
}

function EnumLabelOptions<T extends string>({
  items,
  labels,
}: {
  items: readonly T[];
  labels: Record<T, string>;
}) {
  return (
    <>
      <option value="">Select</option>
      {items.map((item) => (
        <option key={item} value={item}>
          {labels[item]}
        </option>
      ))}
    </>
  );
}

function MultiSelectDropdownChips<T extends string>({
  options,
  labels,
  selected,
  onChange,
  optionGroups,
  allowOther = false,
  otherLabel = "Other",
  otherPlaceholder = "Enter value",
}: {
  options: readonly T[];
  labels: Record<T, string>;
  selected: string[];
  onChange: (next: string[]) => void;
  optionGroups?: ReadonlyArray<{ label: string; options: readonly T[] }>;
  allowOther?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
}) {
  const OTHER_OPTION_VALUE = "__OTHER_OPTION__";
  const [draft, setDraft] = useState("");
  const [otherInputValue, setOtherInputValue] = useState("");

  const addOption = (value: string) => {
    if (!value) {
      return;
    }

    if (allowOther && value === OTHER_OPTION_VALUE) {
      setDraft(OTHER_OPTION_VALUE);
      return;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return;
    }

    const alreadySelected = selected.some((item) => item.toLowerCase() === trimmedValue.toLowerCase());

    if (alreadySelected) {
      setDraft("");
      setOtherInputValue("");
      return;
    }

    onChange([...selected, trimmedValue]);
    setDraft("");
    setOtherInputValue("");
  };

  const removeOption = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <Select
        value={draft}
        onChange={(event) => addOption(event.target.value)}
      >
        <option value="">Select</option>
        {optionGroups
          ? optionGroups.map((group) => {
              const available = group.options.filter((value) => !selected.includes(value));
              if (available.length === 0) {
                return null;
              }

              return (
                <optgroup key={group.label} label={group.label}>
                  {available.map((value) => (
                    <option key={value} value={value}>
                      {labels[value]}
                    </option>
                  ))}
                </optgroup>
              );
            })
          : options
              .filter((value) => !selected.includes(value))
              .map((value) => (
                <option key={value} value={value}>
                  {labels[value]}
                </option>
              ))}
        {allowOther ? (
          <option value={OTHER_OPTION_VALUE}>{otherLabel}</option>
        ) : null}
      </Select>
      {allowOther && draft === OTHER_OPTION_VALUE ? (
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            value={otherInputValue}
            placeholder={otherPlaceholder}
            onChange={(event) => setOtherInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addOption(otherInputValue);
              }
            }}
            className="md:flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addOption(otherInputValue)}
            disabled={!otherInputValue.trim()}
          >
            Add
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {selected.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {options.includes(value as T) ? labels[value as T] : value}
            <button
              type="button"
              className="text-slate-500 hover:text-slate-700"
              onClick={() => removeOption(value)}
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function EmploymentStatusOptions() {
  return (
    <>
      <option value="">Select</option>
      {employmentStatusOptions.map((item) => (
        <option key={item} value={item}>
          {employmentStatusOptionLabels[item]}
        </option>
      ))}
    </>
  );
}

function ExperienceOptions() {
  return (
    <>
      <option value="">Select</option>
      {experienceRangeOptions.map((item) => (
        <option key={item} value={item}>
          {experienceRangeOptionLabels[item]}
        </option>
      ))}
    </>
  );
}

function RoleLevelOptions() {
  const bands = ["INDIVIDUAL_CONTRIBUTOR", "MANAGER", "DIRECTOR_VP", "CXO_FOUNDER"] as const;
  const rolesByBand: Record<string, Array<typeof roleLevelOptions[number]>> = {
    INDIVIDUAL_CONTRIBUTOR: ["SALES_TRAINEE", "SALES_EXECUTIVE", "SENIOR_SALES_EXECUTIVE", "TEAM_LEAD_IC", "SENIOR_TEAM_LEAD_IC"],
    MANAGER: ["ASSISTANT_MANAGER", "DEPUTY_MANAGER", "MANAGER", "SENIOR_MANAGER", "AGM", "DGM"],
    DIRECTOR_VP: ["GENERAL_MANAGER", "ASSOCIATE_DIRECTOR", "DIRECTOR", "SENIOR_DIRECTOR", "VICE_PRESIDENT", "SENIOR_VP", "EXECUTIVE_VP"],
    CXO_FOUNDER: ["CRO", "CSO", "CBO", "CCO", "CEO_CO_FOUNDER", "PRESIDENT_SALES"],
  };
  return (
    <>
      <option value="">Select</option>
      {bands.map((band) => (
        <optgroup key={band} label={roleBandLabels[band]}>
          {rolesByBand[band].map((role) => (
            <option key={role} value={role}>
              {roleLevelOptionLabels[role]}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

interface WizardProps {
  initialStep?: number;
}

export function OnboardingWizard({ initialStep = 1 }: WizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const hasMountedRef = useRef(false);
  const {
    snapshot,
    completedSteps,
    setProfile,
    setCareer,
    upsertJob,
    removeJob,
    setSkills,
    setCompensation,
    setDocuments,
    setProfileScore,
    markStepCompleted,
  } = useOnboardingStore();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: snapshot.profile ?? {
      dob: "",
      currentCity: "",
      preferredCities: [],
      relocationPreference: "YES",
      travelPreference: "MEDIUM",
      workMode: "HYBRID",
      primarySalesCategory: "B2B",
      profileVisibility: true,
    },
  });

  const initialCurrentCity = snapshot.profile?.currentCity ?? "";
  const [currentCitySelectValue, setCurrentCitySelectValue] = useState(
    initialCurrentCity && !isListedCity(initialCurrentCity) ? OTHER_CITY_VALUE : initialCurrentCity
  );
  const [currentCityOther, setCurrentCityOther] = useState(
    initialCurrentCity && !isListedCity(initialCurrentCity) ? initialCurrentCity : ""
  );

  const [preferredCitySelectValue, setPreferredCitySelectValue] = useState("");
  const [preferredCityOther, setPreferredCityOther] = useState("");
  const [jobIndustryOtherMode, setJobIndustryOtherMode] = useState<Record<string, boolean>>({});

  const careerForm = useForm<CareerFormValues>({
    resolver: zodResolver(careerSchema),
    defaultValues: snapshot.career ?? {
      totalWorkExperience: "Y3_5",
      totalSalesExperience: "Y1_2",
      employmentStatus: "EMPLOYED",
      currentRoleLevel: "SALES_EXECUTIVE",
      highestRoleLevel: "SALES_EXECUTIVE",
      salesSubtypes: [],
      industriesWorkedIn: [],
      industriesSoldInto: [],
      customerSegments: [],
      geographyCovered: [],
      markets: [],
      highestQuotaValue: 0,
      quotaCurrency: "INR",
      teamManagement: false,
      largestTeamManaged: "NA",
      openToStartup: "YES_OPEN",
    },
  });

  const primarySalesType = useWatch({ control: profileForm.control, name: "primarySalesCategory" }) ?? "B2B";
  const currentRoleLevel = useWatch({ control: careerForm.control, name: "currentRoleLevel" });
  const teamManagement = useWatch({ control: careerForm.control, name: "teamManagement" });
  const selectedCareerQuotaCurrency =
    (useWatch({ control: careerForm.control, name: "quotaCurrency" }) as QuotaCurrencyCode | undefined) ?? "INR";
  const selectedCareerHighestQuotaValue = useWatch({ control: careerForm.control, name: "highestQuotaValue" }) ?? 0;
  const careerAnnualQuotaBandOptions = annualQuotaBandOptionsByCurrency[selectedCareerQuotaCurrency];

  useEffect(() => {
    if (!currentRoleLevel) {
      return;
    }

    if (!careerForm.formState.dirtyFields.highestRoleLevel) {
      careerForm.setValue("highestRoleLevel", currentRoleLevel, { shouldDirty: false });
    }
  }, [careerForm, currentRoleLevel]);

  useEffect(() => {
    const normalizedValue = getNormalizedQuotaBandValue(selectedCareerQuotaCurrency, selectedCareerHighestQuotaValue);
    if (normalizedValue !== selectedCareerHighestQuotaValue) {
      careerForm.setValue("highestQuotaValue", normalizedValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [careerForm, selectedCareerHighestQuotaValue, selectedCareerQuotaCurrency]);

  const jobsForm = useForm<{ jobs: JobFormValues[] }>({
    resolver: zodResolver(jobsArraySchema),
    mode: "onChange",
    defaultValues: {
      jobs:
        snapshot.jobs.length > 0
          ? snapshot.jobs.map((job) => ({
              ...job,
              endDate: job.endDate ?? "",
              quotaValue: getNormalizedQuotaBandValue(job.quotaCurrency, job.quotaValue),
              salesSubtype: normalizeSalesSubtypeValue(job.salesSubtype),
            }))
          : [
              {
                companyName: "",
                designation: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                jobSalesType: "B2B",
                salesSubtype: [],
                roleLevel: "SALES_EXECUTIVE",
                industry: "",
                industriesSoldInto: [],
                geography: [],
                directReports: 0,
                reasonForLeaving: "BETTER_OPPORTUNITY",
                quotaValue: 0,
                quotaCurrency: "INR",
                quotaAttainment: "FROM_100_TO_110",
                quotaBasis: "REVENUE",
                dealSizeRange: "MEDIUM",
                salesCycle: "M1_TO_3_MONTHS",
                hunterPercentage: 50,
                b2bContext: {
                  customerSegment: "SMB",
                  offeringType: "SAAS",
                  salesMethodologies: [],
                  cSuiteSelling: "NO",
                  rfpExperience: "NO",
                  personas: [],
                  channelType: [],
                  partnersManaged: "ONE_TO_FIVE",
                  govtSegment: [],
                  gemExperience: "NO",
                  tenderExperience: "NO",
                  marketFocus: [],
                },
                b2cContext: {
                  salesChannels: [],
                  productsSold: [],
                  avgTicketSize: "FROM_25K_TO_1L",
                  customerProfile: [],
                  teamSize: "SIX_TO_FIFTEEN",
                  distributorManaged: "NO",
                  beatPlanning: "NO",
                },
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: jobsForm.control, name: "jobs" });
  const watchedJobs = useWatch({ control: jobsForm.control, name: "jobs" });

  useEffect(() => {
    if (!watchedJobs?.length) {
      return;
    }

    watchedJobs.forEach((job, index) => {
      const selectedSubtypes = normalizeSalesSubtypeValue(job?.salesSubtype);
      const allowedOptions =
        job?.jobSalesType === "B2B"
          ? new Set<string>(b2bSalesSubtypeOptions)
          : job?.jobSalesType === "B2C"
            ? new Set<string>(b2cSalesSubtypeOptions)
            : new Set<string>([...b2bSalesSubtypeOptions, ...b2cSalesSubtypeOptions]);

      const filteredSubtypes = selectedSubtypes.filter((value) => allowedOptions.has(value));

      if (filteredSubtypes.length !== selectedSubtypes.length) {
        jobsForm.setValue(`jobs.${index}.salesSubtype`, filteredSubtypes, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const currency = (job?.quotaCurrency ?? "INR") as QuotaCurrencyCode;
      if (typeof job?.quotaValue === "number") {
        const normalizedQuotaValue = getNormalizedQuotaBandValue(currency, job.quotaValue);
        if (normalizedQuotaValue !== job.quotaValue) {
          jobsForm.setValue(`jobs.${index}.quotaValue`, normalizedQuotaValue, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
    });
  }, [jobsForm, watchedJobs]);

  const skillsForm = useForm<SkillsFormValues>({
    resolver: zodResolver(skillsSchema),
    mode: "onChange",
    defaultValues: {
      skills: [],
      toolsCrm: [],
      certifications: [],
      achievements: [{ description: "" }],
      ...(snapshot.skills ?? {}),
    },
  });

  const compensationForm = useForm<CompensationFormValues>({
    resolver: zodResolver(compensationSchema),
    defaultValues: snapshot.compensation ?? {
      currentFixed: 0,
      currentVariable: 0,
      expectedMin: 0,
      expectedIdeal: 0,
      esopPreference: "YES_OPEN",
      noticePeriod: "DAYS_30",
      salaryFlexibility: "OPEN_FOR_RIGHT_ROLE",
    },
  });

  const documentsForm = useForm<DocumentsFormValues>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      linkedinUrl: snapshot.documents?.linkedinUrl ?? "",
    },
  });

  const [compensationCurrency, setCompensationCurrency] = useState<"INR" | "USD">("INR");
  const watchedCurrentFixed = useWatch({ control: compensationForm.control, name: "currentFixed" }) ?? 0;
  const watchedCurrentVariable = useWatch({ control: compensationForm.control, name: "currentVariable" }) ?? 0;
  const currentTotalCtc = watchedCurrentFixed + watchedCurrentVariable;

  const profileMutation = useMutation({
    mutationFn: async (payload: ProfileFormValues) => {
      if (snapshot.profile) {
        try {
          return await candidateApi.updateProfile(payload);
        } catch (error) {
          if (hasStatusCode(error, 404)) {
            return candidateApi.createProfile(payload);
          }

          if (hasStatusCode(error, 409)) {
            return candidateApi.updateProfile(payload);
          }

          throw error;
        }
      }

      try {
        return await candidateApi.createProfile(payload);
      } catch (error) {
        if (hasStatusCode(error, 409)) {
          return candidateApi.updateProfile(payload);
        }

        throw error;
      }
    },
    onSuccess: (data, payload) => {
      setProfile(payload, data?.profileScore);
      if (typeof data?.profileScore === "number") {
        setProfileScore(data.profileScore);
      }
      markStepCompleted(1);
      toast.success("Profile saved");
      setCurrentStep(2);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save profile")),
  });

  const careerMutation = useMutation({
    mutationFn: async (payload: CareerFormValues) => {
      if (snapshot.career) {
        return candidateApi.updateCareer(payload);
      }

      try {
        return await candidateApi.createCareer(payload);
      } catch (error) {
        if (hasStatusCode(error, 409)) {
          return candidateApi.updateCareer(payload);
        }
        throw error;
      }
    },
    onSuccess: (_, payload) => {
      setCareer(payload);
      markStepCompleted(2);
      toast.success("Career snapshot saved");
      setCurrentStep(3);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save career snapshot")),
  });

  const jobsMutation = useMutation({
    mutationFn: async (payload: { jobs: JobFormValues[] }) => {
      const previousJobs = snapshot.jobs;
      const removed = previousJobs.filter((prev) => prev.id && !payload.jobs.some((job) => job.id === prev.id));

      await Promise.all(removed.map((job) => candidateApi.deleteJob(job.id as string)));

      const results = [] as unknown[];
      for (const job of payload.jobs) {
        const sanitizedJob = {
          ...job,
          endDate: job.endDate || undefined,
        };

        if (job.id) {
          results.push(await candidateApi.updateJob(job.id, sanitizedJob));
        } else {
          results.push(await candidateApi.createJob(sanitizedJob));
        }
      }

      return results;
    },
    onSuccess: (results, payload) => {
      payload.jobs.forEach((job, index) => {
        const maybeServerJob = (results[index] as { id?: string }) ?? {};
        upsertJob({ ...job, id: job.id ?? maybeServerJob.id });
      });
      const previousIds = new Set(payload.jobs.map((item) => item.id).filter(Boolean));
      snapshot.jobs.forEach((oldJob) => {
        if (oldJob.id && !previousIds.has(oldJob.id)) {
          removeJob(oldJob.id);
        }
      });
      markStepCompleted(3);
      toast.success("Work history updated");
      setCurrentStep(4);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save work history")),
  });

  const skillsMutation = useMutation({
    mutationFn: candidateApi.upsertSkills,
    onSuccess: (_, payload) => {
      setSkills(payload);
      markStepCompleted(4);
      toast.success("Skills saved");
      setCurrentStep(5);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save skills")),
  });

  const compensationMutation = useMutation({
    mutationFn: candidateApi.upsertCompensation,
    onSuccess: (_, payload) => {
      setCompensation(payload);
      markStepCompleted(5);
      toast.success("Compensation saved");
      setCurrentStep(6);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save compensation")),
  });

  const documentsMutation = useMutation({
    mutationFn: candidateApi.uploadDocuments,
    onSuccess: (data, payload) => {
      setDocuments({
        linkedinUrl: payload.linkedinUrl,
        resumeUrl: data?.resumeUrl,
        salaryProofUrl: data?.salaryProofUrl,
      });
      markStepCompleted(6);
      toast.success("Documents uploaded");
      setCurrentStep(7);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to upload documents")),
  });

  const completion = useMemo(() => Math.round((completedSteps.length / stepLabels.length) * 100), [completedSteps]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  return (
    <div className="space-y-6">
      <StepProgress current={currentStep} labels={stepLabels} completedSteps={completedSteps} />

      <Card>
        <CardHeader>
          <CardTitle>Candidate Onboarding ({completion}%)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentStep === 1 && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={profileForm.handleSubmit((value) => profileMutation.mutate(value))}>
              <FormField label="Date of Birth" required error={profileForm.formState.errors.dob?.message}>
                <Input type="date" {...profileForm.register("dob")} />
              </FormField>
              <Controller
                control={profileForm.control}
                name="currentCity"
                render={({ field }) => (
                  <FormField label="Current City" required error={profileForm.formState.errors.currentCity?.message}>
                    <div className="space-y-2">
                      <Select
                        value={currentCitySelectValue}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setCurrentCitySelectValue(nextValue);

                          if (nextValue === OTHER_CITY_VALUE) {
                            field.onChange(currentCityOther);
                            return;
                          }

                          setCurrentCityOther("");
                          field.onChange(nextValue);
                        }}
                      >
                        <option value="">Select</option>
                        {cityOptionGroups.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.cities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value={OTHER_CITY_VALUE}>Other</option>
                      </Select>
                      {currentCitySelectValue === OTHER_CITY_VALUE ? (
                        <Input
                          placeholder="Enter your city"
                          value={currentCityOther}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setCurrentCityOther(nextValue);
                            field.onChange(nextValue);
                          }}
                        />
                      ) : null}
                    </div>
                  </FormField>
                )}
              />
              <Controller
                control={profileForm.control}
                name="preferredCities"
                render={({ field }) => {
                  const selectedCities = field.value ?? [];

                  const addPreferredCity = () => {
                    const rawCity =
                      preferredCitySelectValue === OTHER_CITY_VALUE ? preferredCityOther : preferredCitySelectValue;
                    const city = rawCity.trim();

                    if (!city || selectedCities.includes(city) || selectedCities.length >= 5) {
                      return;
                    }

                    field.onChange([...selectedCities, city]);
                    setPreferredCitySelectValue("");
                    setPreferredCityOther("");
                  };

                  return (
                    <FormField
                      label="Preferred Cities"
                      required
                      error={profileForm.formState.errors.preferredCities?.message as string}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 md:flex-row">
                          <Select
                            value={preferredCitySelectValue}
                            onChange={(event) => setPreferredCitySelectValue(event.target.value)}
                            className="md:flex-1"
                          >
                            <option value="">Select</option>
                            {preferredCityOptionGroups.map((group) => (
                              <optgroup key={group.label} label={group.label}>
                                {group.cities.map((city) => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            <option value={OTHER_CITY_VALUE}>Other</option>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addPreferredCity}
                            disabled={
                              selectedCities.length >= 5 ||
                              !preferredCitySelectValue ||
                              (preferredCitySelectValue === OTHER_CITY_VALUE && !preferredCityOther.trim())
                            }
                          >
                            Add City
                          </Button>
                        </div>
                        {preferredCitySelectValue === OTHER_CITY_VALUE ? (
                          <Input
                            placeholder="Enter preferred city"
                            value={preferredCityOther}
                            onChange={(event) => setPreferredCityOther(event.target.value)}
                          />
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {selectedCities.map((city, index) => (
                            <span
                              key={`${city}-${index}`}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                            >
                              {city}
                              <button
                                type="button"
                                className="text-slate-500 hover:text-slate-700"
                                onClick={() => field.onChange(selectedCities.filter((_, idx) => idx !== index))}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">You can add up to 5 preferred cities.</p>
                      </div>
                    </FormField>
                  );
                }}
              />
              <FormField label="Relocation Preference" required>
                <Select {...profileForm.register("relocationPreference")}>
                  <EnumOptions items={relocationPreferenceOptions} />
                </Select>
              </FormField>
              <FormField label="Travel Preference" required>
                <Select {...profileForm.register("travelPreference")}>
                  <EnumOptions items={travelPreferenceOptions} />
                </Select>
              </FormField>
              <FormField label="Work Mode" required>
                <Select {...profileForm.register("workMode")}>
                  <EnumOptions items={workModeOptions} />
                </Select>
              </FormField>
              <FormField label="Primary Sales Category" required>
                <Select {...profileForm.register("primarySalesCategory")}>
                  <EnumOptions items={primarySalesCategoryOptions} />
                </Select>
              </FormField>
              <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" {...profileForm.register("profileVisibility")} />
                Profile visible to verified hiring teams
              </label>
              <div className="md:col-span-2 flex justify-end">
                <Button disabled={!profileForm.formState.isValid || profileMutation.isPending} type="submit">
                  Save & Next
                </Button>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form className="space-y-6" onSubmit={careerForm.handleSubmit((value) => careerMutation.mutate(value))}>
              <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 md:p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Experience & Status</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Total Work Experience" required>
                    <Select {...careerForm.register("totalWorkExperience")}>
                      <ExperienceOptions />
                    </Select>
                  </FormField>
                  <FormField label="Total Sales Experience" required>
                    <Select {...careerForm.register("totalSalesExperience")}>
                      <ExperienceOptions />
                    </Select>
                  </FormField>
                  <FormField label="Employment Status" required>
                    <Select {...careerForm.register("employmentStatus")}>
                      <EmploymentStatusOptions />
                    </Select>
                  </FormField>
                  <Controller
                    control={careerForm.control}
                    name="teamManagement"
                    render={({ field }) => (
                      <FormField label="Team Management" required>
                        <Select
                          value={field.value ? "YES" : "NO"}
                          onChange={(event) => field.onChange(event.target.value === "YES")}
                        >
                          <option value="NO">No - Individual Contributor</option>
                          <option value="YES">Yes - Managed a team</option>
                        </Select>
                      </FormField>
                    )}
                  />
                  <FormField label="Current Role Level" required>
                    <Select {...careerForm.register("currentRoleLevel")}>
                      <RoleLevelOptions />
                    </Select>
                  </FormField>
                  <FormField label="Highest Role Level" required>
                    <Select {...careerForm.register("highestRoleLevel")}>
                      <RoleLevelOptions />
                    </Select>
                  </FormField>
                  {teamManagement ? (
                    <FormField label="Largest Team Managed" required>
                      <Select {...careerForm.register("largestTeamManaged")}>
                        <EnumLabelOptions items={largestTeamManagedOptions} labels={largestTeamManagedOptionLabels} />
                      </Select>
                    </FormField>
                  ) : (
                    <div className="hidden">
                      <input {...careerForm.register("largestTeamManaged")} value="NA" readOnly />
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 md:p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Sales Type & Coverage</h3>
                <div className="space-y-4">
                  <Controller
                    control={careerForm.control}
                    name="salesSubtypes"
                    render={({ field }) => (
                      <FormField label="Sales Sub-types (Multiselect)" required>
                        <div className="space-y-3">
                          {(primarySalesType === "B2B" || primarySalesType === "BOTH") && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2B Sub-types</p>
                              <MultiSelectDropdownChips
                                options={b2bSalesSubtypeOptions}
                                labels={b2bSalesSubtypeOptionLabels}
                                selected={field.value ?? []}
                                onChange={field.onChange}
                                allowOther
                                otherPlaceholder="Enter B2B sub-type"
                              />
                            </div>
                          )}
                          {(primarySalesType === "B2C" || primarySalesType === "BOTH") && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2C Sub-types</p>
                              <MultiSelectDropdownChips
                                options={b2cSalesSubtypeOptions}
                                labels={b2cSalesSubtypeOptionLabels}
                                selected={field.value ?? []}
                                onChange={field.onChange}
                              />
                            </div>
                          )}
                        </div>
                      </FormField>
                    )}
                  />
                  <Controller
                    control={careerForm.control}
                    name="customerSegments"
                    render={({ field }) => (
                      <FormField label="Customer Segments (Multiselect)" required>
                        <MultiSelectDropdownChips
                          options={customerSegmentOptions}
                          labels={customerSegmentOptionLabels}
                          selected={field.value ?? []}
                          onChange={field.onChange}
                          allowOther
                          otherPlaceholder="Enter customer segment"
                        />
                      </FormField>
                    )}
                  />
                  <Controller
                    control={careerForm.control}
                    name="geographyCovered"
                    render={({ field }) => (
                      <FormField label="Geography Covered (Multiselect)" required>
                        <MultiSelectDropdownChips
                          options={geographyCoveredOptions}
                          labels={geographyCoveredOptionLabels}
                          selected={field.value ?? []}
                          onChange={field.onChange}
                        />
                      </FormField>
                    )}
                  />
                  <Controller
                    control={careerForm.control}
                    name="markets"
                    render={({ field }) => (
                      <FormField label="Market Sold To (Multiselect)" required>
                        <MultiSelectDropdownChips
                          options={marketSoldToOptions}
                          labels={marketSoldToOptionLabels}
                          selected={field.value ?? []}
                          onChange={field.onChange}
                        />
                      </FormField>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Controller
                      control={careerForm.control}
                      name="industriesWorkedIn"
                      render={({ field }) => (
                        <FormField label="Industries Worked In (Multiselect)" required>
                          <MultiSelectDropdownChips
                            options={industryOptions}
                            labels={industryOptionLabels}
                            selected={field.value ?? []}
                            onChange={field.onChange}
                            optionGroups={industryOptionGroups}
                            allowOther
                            otherPlaceholder="Enter industry worked in"
                          />
                        </FormField>
                      )}
                    />
                    <Controller
                      control={careerForm.control}
                      name="industriesSoldInto"
                      render={({ field }) => (
                        <FormField label="Industries Sold Into (Multiselect)" required>
                          <MultiSelectDropdownChips
                            options={industryOptions}
                            labels={industryOptionLabels}
                            selected={field.value ?? []}
                            onChange={field.onChange}
                            optionGroups={industryOptionGroups}
                            allowOther
                            otherPlaceholder="Enter industry sold into"
                          />
                        </FormField>
                      )}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 md:p-5">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">Scale & Quota</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={careerForm.control}
                    name="highestQuotaValue"
                    render={({ field }) => (
                      <FormField label="Highest Annual Target" required>
                        <Select
                          value={typeof field.value === "number" ? String(field.value) : ""}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        >
                          <option value="">Select</option>
                          {careerAnnualQuotaBandOptions.map((band) => (
                            <option key={band.value} value={band.value}>
                              {band.label}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    )}
                  />
                  <FormField label="Quota Currency" required>
                    <Select {...careerForm.register("quotaCurrency")}>
                      <EnumOptions items={quotaCurrencyOptions} />
                    </Select>
                  </FormField>
                  <FormField label="Open to Startup" required className="md:col-span-2">
                    <Select {...careerForm.register("openToStartup")}>
                      <EnumLabelOptions items={startupPreferenceOptions} labels={startupPreferenceOptionLabels} />
                    </Select>
                  </FormField>
                </div>
              </section>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button disabled={!careerForm.formState.isValid || careerMutation.isPending} type="submit">Save & Next</Button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={jobsForm.handleSubmit((value) => jobsMutation.mutate(value))} className="space-y-4">
              {fields.map((field, idx) => {
                const type = watchedJobs?.[idx]?.jobSalesType;
                const isCurrentJob = Boolean(watchedJobs?.[idx]?.isCurrent);
                const selectedSalesSubtypes = normalizeSalesSubtypeValue(watchedJobs?.[idx]?.salesSubtype);
                const isB2B = type === "B2B" || type === "BOTH";
                const isB2C = type === "B2C" || type === "BOTH";
                const hasChannelSubtype = selectedSalesSubtypes.includes("CHANNEL_PARTNER_SALES");
                const hasGovtSubtype = selectedSalesSubtypes.includes("GOVERNMENT_PSU_SALES");
                const hasInternationalSubtype = selectedSalesSubtypes.includes("INTERNATIONAL_B2B");
                const selectedQuotaCurrency = (watchedJobs?.[idx]?.quotaCurrency ?? "INR") as QuotaCurrencyCode;
                const annualQuotaBandOptions = annualQuotaBandOptionsByCurrency[selectedQuotaCurrency];

                return (
                  <div key={field.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Job #{idx + 1}</p>
                      {fields.length > 1 ? (
                        <Button type="button" variant="destructive" onClick={() => remove(idx)}>Remove</Button>
                      ) : null}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <FormField label="Company" required><Input {...jobsForm.register(`jobs.${idx}.companyName`)} /></FormField>
                      <FormField label="Designation" required><Input {...jobsForm.register(`jobs.${idx}.designation`)} /></FormField>
                      <FormField label="Start Date" required><Input type="date" {...jobsForm.register(`jobs.${idx}.startDate`)} /></FormField>
                      <FormField label="End Date"><Input type="date" disabled={isCurrentJob} {...jobsForm.register(`jobs.${idx}.endDate`)} /></FormField>
                      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...jobsForm.register(`jobs.${idx}.isCurrent`)} />Currenty Working</label>
                      <FormField label="Sales Type" required><Select {...jobsForm.register(`jobs.${idx}.jobSalesType`)}><EnumOptions items={jobSalesTypeOptions} /></Select></FormField>
                      <Controller
                        control={jobsForm.control}
                        name={`jobs.${idx}.salesSubtype`}
                        render={({ field }) => {
                          const selectedValues = normalizeSalesSubtypeValue(field.value);
                          const selectedB2BValues = selectedValues.filter((value) =>
                            b2bSalesSubtypeOptions.includes(value as (typeof b2bSalesSubtypeOptions)[number])
                          );
                          const selectedB2CValues = selectedValues.filter((value) =>
                            b2cSalesSubtypeOptions.includes(value as (typeof b2cSalesSubtypeOptions)[number])
                          );

                          return (
                            <FormField label="Sales Sub-types (Multiselect)" required>
                              <div className="space-y-3">
                                {(type === "B2B" || type === "BOTH") && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2B Sub-types</p>
                                    <MultiSelectDropdownChips
                                      options={b2bSalesSubtypeOptions}
                                      labels={b2bSalesSubtypeOptionLabels}
                                      selected={selectedB2BValues}
                                      onChange={(next) =>
                                        field.onChange(type === "BOTH" ? [...next, ...selectedB2CValues] : next)
                                      }
                                      allowOther
                                      otherPlaceholder="Enter B2B sub-type"
                                    />
                                  </div>
                                )}
                                {(type === "B2C" || type === "BOTH") && (
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2C Sub-types</p>
                                    <MultiSelectDropdownChips
                                      options={b2cSalesSubtypeOptions}
                                      labels={b2cSalesSubtypeOptionLabels}
                                      selected={selectedB2CValues}
                                      onChange={(next) =>
                                        field.onChange(type === "BOTH" ? [...selectedB2BValues, ...next] : next)
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </FormField>
                          );
                        }}
                      />
                      <FormField label="Role Level" required><Select {...jobsForm.register(`jobs.${idx}.roleLevel`)}><RoleLevelOptions /></Select></FormField>
                      <Controller
                        control={jobsForm.control}
                        name={`jobs.${idx}.industry`}
                        render={({ field: industryField }) => {
                          const isCustomIndustry =
                            typeof industryField.value === "string" &&
                            industryField.value.length > 0 &&
                            !industryOptions.includes(industryField.value as (typeof industryOptions)[number]);
                          const showIndustryOtherInput = jobIndustryOtherMode[field.id] ?? isCustomIndustry;
                          const industrySelectValue = showIndustryOtherInput
                            ? OTHER_JOB_INDUSTRY_VALUE
                            : (industryField.value ?? "");

                          return (
                            <FormField label="Industry" required>
                              <div className="space-y-2">
                                <Select
                                  value={industrySelectValue}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    if (nextValue === OTHER_JOB_INDUSTRY_VALUE) {
                                      setJobIndustryOtherMode((prev) => ({ ...prev, [field.id]: true }));
                                      if (!isCustomIndustry) {
                                        industryField.onChange("");
                                      }
                                      return;
                                    }

                                    setJobIndustryOtherMode((prev) => ({ ...prev, [field.id]: false }));
                                    industryField.onChange(nextValue);
                                  }}
                                >
                                  <option value="">Select</option>
                                  {industryOptionGroups.map((group) => (
                                    <optgroup key={group.label} label={group.label}>
                                      {group.options.map((value) => (
                                        <option key={value} value={value}>
                                          {industryOptionLabels[value]}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                  <option value={OTHER_JOB_INDUSTRY_VALUE}>Other</option>
                                </Select>
                                {showIndustryOtherInput ? (
                                  <Input
                                    placeholder="Enter industry"
                                    value={isCustomIndustry ? industryField.value : ""}
                                    onChange={(event) => {
                                      setJobIndustryOtherMode((prev) => ({ ...prev, [field.id]: true }));
                                      industryField.onChange(event.target.value);
                                    }}
                                  />
                                ) : null}
                              </div>
                            </FormField>
                          );
                        }}
                      />
                      <FormField label="Direct Reports" required><Input type="number" {...jobsForm.register(`jobs.${idx}.directReports`, { valueAsNumber: true })} /></FormField>
                      <FormField label="Reason For Leaving" required>
                        <Select {...jobsForm.register(`jobs.${idx}.reasonForLeaving`)}>
                          <EnumLabelOptions items={reasonForLeavingOptions} labels={reasonForLeavingOptionLabels} />
                        </Select>
                      </FormField>
                      <FormField label="Quota Currency" required><Select {...jobsForm.register(`jobs.${idx}.quotaCurrency`)}><EnumOptions items={quotaCurrencyOptions} /></Select></FormField>
                      <Controller
                        control={jobsForm.control}
                        name={`jobs.${idx}.quotaValue`}
                        render={({ field }) => (
                          <FormField label="Annual Quota" required>
                            <Select
                              value={typeof field.value === "number" ? String(field.value) : ""}
                              onChange={(event) => field.onChange(Number(event.target.value))}
                            >
                              <option value="">Select</option>
                              {annualQuotaBandOptions.map((band) => (
                                <option key={band.value} value={band.value}>
                                  {band.label}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                        )}
                      />
                      <FormField label="Quota Attainment" required>
                        <Select {...jobsForm.register(`jobs.${idx}.quotaAttainment`)}>
                          <EnumLabelOptions items={quotaAttainmentOptions} labels={quotaAttainmentOptionLabels} />
                        </Select>
                      </FormField>
                      <FormField label="Quota Basis" required>
                        <Select {...jobsForm.register(`jobs.${idx}.quotaBasis`)}>
                          <EnumLabelOptions items={quotaBasisOptions} labels={quotaBasisOptionLabels} />
                        </Select>
                      </FormField>
                      {isB2B && (
                        <>
                          <FormField label="Deal Size" required>
                            <Select {...jobsForm.register(`jobs.${idx}.dealSizeRange`)}>
                              <EnumOptions items={dealSizeRangeOptions} />
                            </Select>
                          </FormField>
                          <FormField label="Sales Cycle" required>
                            <Select {...jobsForm.register(`jobs.${idx}.salesCycle`)}>
                              <EnumLabelOptions items={salesCycleOptions} labels={salesCycleOptionLabels} />
                            </Select>
                          </FormField>
                        </>
                      )}
                      <FormField label="Hunter %(0-100)" required><Input type="number" min={0} max={100} {...jobsForm.register(`jobs.${idx}.hunterPercentage`, { valueAsNumber: true })} /></FormField>
                      <Controller
                        control={jobsForm.control}
                        name={`jobs.${idx}.industriesSoldInto`}
                        render={({ field }) => (
                          <FormField label="Industries Sold Into (Multiselect)" required>
                            <MultiSelectDropdownChips
                              options={industryOptions}
                              labels={industryOptionLabels}
                              selected={field.value ?? []}
                              onChange={field.onChange}
                              optionGroups={industryOptionGroups}
                              allowOther
                              otherPlaceholder="Enter industry sold into"
                            />
                          </FormField>
                        )}
                      />
                      <Controller
                        control={jobsForm.control}
                        name={`jobs.${idx}.geography`}
                        render={({ field }) => (
                          <FormField label="Geography (Multiselect)" required>
                            <MultiSelectDropdownChips
                              options={jobGeographyOptions}
                              labels={jobGeographyOptionLabels}
                              selected={field.value ?? []}
                              onChange={field.onChange}
                            />
                          </FormField>
                        )}
                      />
                    </div>
                    {isB2B && (
                      <div className="rounded-md bg-slate-50 p-3 space-y-3">
                        <p className="text-sm font-medium">B2B Context</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <FormField label="Customer Segment" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2bContext.customerSegment`)}>
                              <EnumLabelOptions items={b2bCustomerSegmentOptions} labels={b2bCustomerSegmentOptionLabels} />
                            </Select>
                          </FormField>
                          <FormField label="Offering Type" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2bContext.offeringType`)}>
                              <EnumLabelOptions items={offeringTypeOptions} labels={offeringTypeOptionLabels} />
                            </Select>
                          </FormField>
                          <Controller
                            control={jobsForm.control}
                            name={`jobs.${idx}.b2bContext.salesMethodologies`}
                            render={({ field }) => (
                              <FormField label="Sales Methodologies (Multiselect)">
                                <MultiSelectDropdownChips
                                  options={salesMethodologyOptions}
                                  labels={salesMethodologyOptionLabels}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
                                />
                              </FormField>
                            )}
                          />
                          <FormField label="C-Suite / Senior Selling" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2bContext.cSuiteSelling`)}>
                              <EnumLabelOptions items={seniorSellingExperienceOptions} labels={seniorSellingExperienceOptionLabels} />
                            </Select>
                          </FormField>
                          <FormField label="RFP / Tender Experience" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2bContext.rfpExperience`)}>
                              <EnumLabelOptions items={rfpExperienceOptions} labels={rfpExperienceOptionLabels} />
                            </Select>
                          </FormField>
                          <Controller
                            control={jobsForm.control}
                            name={`jobs.${idx}.b2bContext.personas`}
                            render={({ field }) => (
                              <FormField label="Primary Personas">
                                <MultiSelectDropdownChips
                                  options={b2bPersonaOptions}
                                  labels={b2bPersonaOptionLabels}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
                                />
                              </FormField>
                            )}
                          />
                          {hasChannelSubtype && (
                            <>
                              <Controller
                                control={jobsForm.control}
                                name={`jobs.${idx}.b2bContext.channelType`}
                                render={({ field }) => (
                                  <FormField label="Channel Type">
                                    <MultiSelectDropdownChips
                                      options={channelTypeOptions}
                                      labels={channelTypeOptionLabels}
                                      selected={field.value ?? []}
                                      onChange={field.onChange}
                                    />
                                  </FormField>
                                )}
                              />
                              <FormField label="Partners Managed" required>
                                <Select {...jobsForm.register(`jobs.${idx}.b2bContext.partnersManaged`)}>
                                  <EnumLabelOptions items={partnersManagedRangeOptions} labels={partnersManagedRangeOptionLabels} />
                                </Select>
                              </FormField>
                            </>
                          )}
                          {hasGovtSubtype && (
                            <>
                              <Controller
                                control={jobsForm.control}
                                name={`jobs.${idx}.b2bContext.govtSegment`}
                                render={({ field }) => (
                                  <FormField label="Govt Segment">
                                    <MultiSelectDropdownChips
                                      options={govtSegmentOptions}
                                      labels={govtSegmentOptionLabels}
                                      selected={field.value ?? []}
                                      onChange={field.onChange}
                                    />
                                  </FormField>
                                )}
                              />
                              <FormField label="GeM Portal" required>
                                <Select {...jobsForm.register(`jobs.${idx}.b2bContext.gemExperience`)}>
                                  <EnumLabelOptions items={gemPortalOptions} labels={gemPortalOptionLabels} />
                                </Select>
                              </FormField>
                              <FormField label="Tender Types" required>
                                <Select {...jobsForm.register(`jobs.${idx}.b2bContext.tenderExperience`)}>
                                  <EnumLabelOptions items={tenderExperienceOptions} labels={tenderExperienceOptionLabels} />
                                </Select>
                              </FormField>
                            </>
                          )}
                          {hasInternationalSubtype && (
                            <Controller
                              control={jobsForm.control}
                              name={`jobs.${idx}.b2bContext.marketFocus`}
                              render={({ field }) => (
                                <FormField label="Market Focus">
                                  <MultiSelectDropdownChips
                                    options={marketFocusOptions}
                                    labels={marketFocusOptionLabels}
                                    selected={field.value ?? []}
                                    onChange={field.onChange}
                                  />
                                </FormField>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {isB2C && (
                      <div className="rounded-md bg-slate-50 p-3 space-y-3">
                        <p className="text-sm font-medium">B2C Context</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <Controller
                            control={jobsForm.control}
                            name={`jobs.${idx}.b2cContext.salesChannels`}
                            render={({ field }) => (
                              <FormField label="Sales Channel" required>
                                <MultiSelectDropdownChips
                                  options={b2cSalesChannelOptions}
                                  labels={b2cSalesChannelOptionLabels}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
                                />
                              </FormField>
                            )}
                          />
                          <Controller
                            control={jobsForm.control}
                            name={`jobs.${idx}.b2cContext.productsSold`}
                            render={({ field }) => (
                              <FormField label="Product / Service Sold" required>
                                <MultiSelectDropdownChips
                                  options={b2cProductServiceOptions}
                                  labels={b2cProductServiceOptionLabels}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
                                />
                              </FormField>
                            )}
                          />
                          <FormField label="Average Ticket Size" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2cContext.avgTicketSize`)}>
                              <EnumLabelOptions items={avgTicketSizeOptions} labels={avgTicketSizeOptionLabels} />
                            </Select>
                          </FormField>
                          <Controller
                            control={jobsForm.control}
                            name={`jobs.${idx}.b2cContext.customerProfile`}
                            render={({ field }) => (
                              <FormField label="Customer Profile" required>
                                <MultiSelectDropdownChips
                                  options={b2cCustomerProfileOptions}
                                  labels={b2cCustomerProfileOptionLabels}
                                  selected={field.value ?? []}
                                  onChange={field.onChange}
                                />
                              </FormField>
                            )}
                          />
                          <FormField label="Team Size" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2cContext.teamSize`)}>
                              <EnumLabelOptions items={teamSizeOptions} labels={teamSizeOptionLabels} />
                            </Select>
                          </FormField>
                          <FormField label="Distributor / Stockist" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2cContext.distributorManaged`)}>
                              <EnumLabelOptions items={binaryChoiceOptions} labels={distributorManagedOptionLabels} />
                            </Select>
                          </FormField>
                          <FormField label="Beat / Route Planning" required>
                            <Select {...jobsForm.register(`jobs.${idx}.b2cContext.beatPlanning`)}>
                              <EnumLabelOptions items={binaryChoiceOptions} labels={beatPlanningOptionLabels} />
                            </Select>
                          </FormField>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        companyName: "",
                        designation: "",
                        startDate: "",
                        endDate: "",
                        isCurrent: false,
                        jobSalesType: "B2B",
                        salesSubtype: [],
                        roleLevel: "SALES_EXECUTIVE",
                        industry: "",
                        industriesSoldInto: [],
                        geography: [],
                        directReports: 0,
                        reasonForLeaving: "BETTER_OPPORTUNITY",
                        quotaValue: 0,
                        quotaCurrency: "INR",
                        quotaAttainment: "FROM_100_TO_110",
                        quotaBasis: "REVENUE",
                        dealSizeRange: "MEDIUM",
                        salesCycle: "M1_TO_3_MONTHS",
                        hunterPercentage: 50,
                        b2bContext: {
                          customerSegment: "SMB",
                          offeringType: "SAAS",
                          salesMethodologies: [],
                          cSuiteSelling: "NO",
                          rfpExperience: "NO",
                          personas: [],
                          channelType: [],
                          partnersManaged: "ONE_TO_FIVE",
                          govtSegment: [],
                          gemExperience: "NO",
                          tenderExperience: "NO",
                          marketFocus: [],
                        },
                        b2cContext: {
                          salesChannels: [],
                          productsSold: [],
                          avgTicketSize: "FROM_25K_TO_1L",
                          customerProfile: [],
                          teamSize: "SIX_TO_FIFTEEN",
                          distributorManaged: "NO",
                          beatPlanning: "NO",
                        },
                      })
                    }
                  >
                    Add Job
                  </Button>
                  <Button type="submit" disabled={!jobsForm.formState.isValid || jobsMutation.isPending}>Save & Next</Button>
                </div>
              </div>
            </form>
          )}

          {currentStep === 4 && (
            <form className="space-y-4" onSubmit={skillsForm.handleSubmit((value) => skillsMutation.mutate(value))}>
              <p className="text-sm text-slate-600">
                Add skills, Tools & CRM, certifications, and one or more achievement summaries.
              </p>
              <Controller
                control={skillsForm.control}
                name="skills"
                render={({ field }) => (
                  <SearchableSkillPicker value={field.value ?? []} onChange={field.onChange} />
                )}
              />

              <Controller
                control={skillsForm.control}
                name="toolsCrm"
                render={({ field }) => (
                  <FormField label="Tools & CRM (Multiselect)" required>
                    <MultiSelectDropdownChips
                      options={crmSalesPlatformOptions}
                      labels={crmSalesPlatformOptionLabels}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormField>
                )}
              />

              <Controller
                control={skillsForm.control}
                name="certifications"
                render={({ field }) => (
                  <FormField label="Certifications (optional)">
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Add a certification and press Enter"
                    />
                  </FormField>
                )}
              />

              <Controller
                control={skillsForm.control}
                name="achievements.0.description"
                render={({ field }) => {
                  const achievementLength = (field.value ?? "").length;

                  return (
                    <FormField
                      label="Achievement (100-500 chars)"
                      required
                      error={skillsForm.formState.errors.achievements?.[0]?.description?.message}
                    >
                      <div className="space-y-1">
                        <Textarea {...field} />
                        <p className={`text-right text-xs ${achievementLength < 100 ? "text-rose-600" : "text-slate-500"}`}>
                          {achievementLength}/500 characters
                        </p>
                      </div>
                    </FormField>
                  );
                }}
              />

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                <Button type="submit" disabled={!skillsForm.formState.isValid || skillsMutation.isPending}>Save & Next</Button>
              </div>
            </form>
          )}

          {currentStep === 5 && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={compensationForm.handleSubmit((value) => compensationMutation.mutate(value))}>
              <FormField label="Compensation Currency">
                <Select value={compensationCurrency} onChange={(event) => setCompensationCurrency(event.target.value as "INR" | "USD") }>
                  <option value="INR">INR (Rs LPA)</option>
                  <option value="USD">USD (Annual)</option>
                </Select>
              </FormField>
              <div />

              <FormField label="Current Fixed CTC (Annual)" required>
                <Input type="number" {...compensationForm.register("currentFixed", { valueAsNumber: true })} />
                <p className="text-xs text-slate-500">In {compensationCurrency === "INR" ? "Rs LPA. Toggle to USD for international roles." : "USD. Toggle to INR."}</p>
              </FormField>
              <FormField label="Current Variable / Incentive Target" required>
                <Input type="number" {...compensationForm.register("currentVariable", { valueAsNumber: true })} />
                <p className="text-xs text-slate-500">Target at 100% attainment, not actual earned.</p>
              </FormField>

              <FormField label="Current Total CTC">
                <Input
                  type="text"
                  readOnly
                  value={formatCurrency(currentTotalCtc, compensationCurrency)}
                />
                <p className="text-xs text-slate-500">Fixed + Variable.</p>
              </FormField>
              <div />

              <FormField label="Expected Fixed CTC - Minimum" required>
                <Input type="number" {...compensationForm.register("expectedMin", { valueAsNumber: true })} />
                <p className="text-xs text-slate-500">Minimum acceptable.</p>
              </FormField>
              <FormField label="Expected Fixed CTC - Ideal">
                <Input type="number" {...compensationForm.register("expectedIdeal", { valueAsNumber: true })} />
                <p className="text-xs text-slate-500">Target.</p>
              </FormField>

              <FormField label="Open to ESOP / Equity" required>
                <Select {...compensationForm.register("esopPreference")}>
                  <EnumLabelOptions items={esopPreferenceOptions} labels={esopPreferenceOptionLabels} />
                </Select>
              </FormField>
              <FormField label="Notice Period" required>
                <Select {...compensationForm.register("noticePeriod")}>
                  <EnumLabelOptions items={noticePeriodOptions} labels={noticePeriodOptionLabels} />
                </Select>
              </FormField>
              <FormField label="Salary Flexibility">
                <Select {...compensationForm.register("salaryFlexibility")}>
                  <EnumLabelOptions items={salaryFlexibilityOptions} labels={salaryFlexibilityOptionLabels} />
                </Select>
              </FormField>
              <div className="md:col-span-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>Back</Button>
                <Button type="submit" disabled={compensationMutation.isPending}>Save & Next</Button>
              </div>
            </form>
          )}

          {currentStep === 6 && (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={documentsForm.handleSubmit((value) => documentsMutation.mutate(value))}>
              <FormField label="Resume" required>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => documentsForm.setValue("resume", event.target.files?.[0])}
                />
              </FormField>
              <FormField label="Salary Proof">
                <Input type="file" onChange={(event) => documentsForm.setValue("salaryProof", event.target.files?.[0])} />
              </FormField>
              <FormField label="LinkedIn URL"><Input {...documentsForm.register("linkedinUrl")} /></FormField>

              <div className="md:col-span-2 flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>Back</Button>
                <Button type="submit" disabled={documentsMutation.isPending}>Upload & Next</Button>
              </div>
            </form>
          )}

          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Profile Score</p>
                  <p className="text-2xl font-semibold">{snapshot.profileScore ?? 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Expected Ideal Compensation</p>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(snapshot.compensation?.expectedIdeal ?? 0, "INR")} LPA
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Profile</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Date of Birth</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.dob ? new Date(snapshot.profile.dob).toLocaleDateString("en-IN") : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Current City</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.currentCity ?? "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Relocation</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.relocationPreference ?? "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Travel</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.travelPreference ?? "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Work Mode</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.workMode ?? "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Primary Category</dt><dd className="text-right font-medium text-slate-800">{snapshot.profile?.primarySalesCategory ?? "-"}</dd></div>
                  </dl>
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Cities</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(snapshot.profile?.preferredCities?.length ?? 0) > 0
                        ? snapshot.profile?.preferredCities?.map((city) => (
                            <span key={city} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">{city}</span>
                          ))
                        : <span className="text-sm text-slate-500">No preferred cities added</span>}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Career Snapshot</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Work Experience</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? experienceRangeOptionLabels[snapshot.career.totalWorkExperience] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Sales Experience</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? experienceRangeOptionLabels[snapshot.career.totalSalesExperience] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Employment Status</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? employmentStatusOptionLabels[snapshot.career.employmentStatus] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Current Role Level</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? roleLevelOptionLabels[snapshot.career.currentRoleLevel] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Highest Role Level</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? roleLevelOptionLabels[snapshot.career.highestRoleLevel] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Team Managed</dt><dd className="text-right font-medium text-slate-800">{snapshot.career?.teamManagement ? "Yes" : "No"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Largest Team</dt><dd className="text-right font-medium text-slate-800">{snapshot.career ? largestTeamManagedOptionLabels[snapshot.career.largestTeamManaged] : "-"}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Work History</h3>
                {(snapshot.jobs?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-3">
                    {snapshot.jobs.map((job, idx) => (
                      <div key={job.id ?? `${job.companyName}-${idx}`} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-800">{job.companyName} - {job.designation}</p>
                          <p className="text-xs text-slate-600">{job.startDate} to {job.isCurrent ? "Present" : (job.endDate || "-")}</p>
                        </div>
                        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                          <p className="text-slate-700">Sales Type: <span className="font-medium">{job.jobSalesType}</span></p>
                          <p className="text-slate-700">Industry: <span className="font-medium">{industryOptionLabels[job.industry as keyof typeof industryOptionLabels] ?? job.industry}</span></p>
                          <p className="text-slate-700">Role Level: <span className="font-medium">{roleLevelOptionLabels[job.roleLevel]}</span></p>
                          <p className="text-slate-700">Reason for Leaving: <span className="font-medium">{reasonForLeavingOptionLabels[job.reasonForLeaving]}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No work history added.</p>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Skills & Achievements</h3>
                  <div className="mt-3 space-y-3 text-sm text-slate-700">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
                      <p className="mt-1">{snapshot.skills?.skills?.map((item) => item.name).join(", ") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tools & CRM</p>
                      <p className="mt-1">{snapshot.skills?.toolsCrm?.map((item) => crmSalesPlatformOptionLabels[item]).join(", ") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certifications</p>
                      <p className="mt-1">{snapshot.skills?.certifications?.join(", ") || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Achievements</p>
                      {(snapshot.skills?.achievements?.length ?? 0) > 0 ? (
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {snapshot.skills?.achievements?.map((item, idx) => (
                            <li key={`${idx}-${item.description.slice(0, 20)}`}>{item.description}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1">-</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-800">Compensation & Documents</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Current Fixed</dt><dd className="text-right font-medium text-slate-800">{formatCurrency(snapshot.compensation?.currentFixed ?? 0, "INR")} LPA</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Current Variable</dt><dd className="text-right font-medium text-slate-800">{formatCurrency(snapshot.compensation?.currentVariable ?? 0, "INR")} LPA</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Current Total</dt><dd className="text-right font-medium text-slate-800">{formatCurrency((snapshot.compensation?.currentFixed ?? 0) + (snapshot.compensation?.currentVariable ?? 0), "INR")} LPA</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Expected Min</dt><dd className="text-right font-medium text-slate-800">{formatCurrency(snapshot.compensation?.expectedMin ?? 0, "INR")} LPA</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Expected Ideal</dt><dd className="text-right font-medium text-slate-800">{formatCurrency(snapshot.compensation?.expectedIdeal ?? 0, "INR")} LPA</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">ESOP / Equity</dt><dd className="text-right font-medium text-slate-800">{snapshot.compensation ? esopPreferenceOptionLabels[snapshot.compensation.esopPreference] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Notice Period</dt><dd className="text-right font-medium text-slate-800">{snapshot.compensation ? noticePeriodOptionLabels[snapshot.compensation.noticePeriod] : "-"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-500">Salary Flexibility</dt><dd className="text-right font-medium text-slate-800">{snapshot.compensation ? salaryFlexibilityOptionLabels[snapshot.compensation.salaryFlexibility] : "-"}</dd></div>
                  </dl>

                  <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
                    <div className="mt-2 grid gap-1">
                      <p className="text-slate-700">LinkedIn: {snapshot.documents?.linkedinUrl ? <a className="text-slate-900 underline" href={snapshot.documents.linkedinUrl} target="_blank" rel="noreferrer">Open Profile</a> : "-"}</p>
                      <p className="text-slate-700">Resume: {snapshot.documents?.resumeUrl ? <a className="text-slate-900 underline" href={snapshot.documents.resumeUrl} target="_blank" rel="noreferrer">View Resume</a> : "-"}</p>
                      <p className="text-slate-700">Salary Proof: {snapshot.documents?.salaryProofUrl ? <a className="text-slate-900 underline" href={snapshot.documents.salaryProofUrl} target="_blank" rel="noreferrer">View Document</a> : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(6)}>Back</Button>
                <Button
                  type="button"
                  onClick={() => {
                    markStepCompleted(7);
                    toast.success("Onboarding completed successfully");
                    router.push("/dashboard");
                  }}
                >
                  Submit Final Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
