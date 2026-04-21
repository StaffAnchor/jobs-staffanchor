"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { StepProgress } from "@/components/forms/step-progress";
import { TagInput } from "@/components/forms/tag-input";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage } from "@/modules/shared/error";
import { generalOnboardingApi } from "@/modules/general-onboarding/api";
import { useGeneralOnboardingStore } from "@/modules/general-onboarding/store";
import {
  generalAddressSchema,
  generalProfessionalSchema,
  type GeneralAddressFormValues,
  type GeneralProfessionalFormValues,
} from "@/modules/general-onboarding/schemas";
import {
  currentJobTitleOptions,
  domainOptions,
  functionDepartmentOptions,
  highestQualificationOptions,
  indianStates,
  openToRelocationOptions,
} from "@/modules/general-onboarding/options";
import type { CandidateAccountSummary } from "@/modules/general-onboarding/types";

interface GeneralOnboardingWizardProps {
  step: 1 | 2 | 3 | 4 | 5;
}

const stepLabels = [
  "Basic Details",
  "Address & Relocation",
  "Professional Details",
  "Upload Documents",
  "Review & Submit",
];

function MultiSelectChips({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addOption = (value: string) => {
    if (!value || selected.includes(value)) {
      setDraft("");
      return;
    }

    onChange([...selected, value]);
    setDraft("");
  };

  const removeOption = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <Select value={draft} onChange={(event) => addOption(event.target.value)}>
        <option value="">Select</option>
        {options
          .filter((item) => !selected.includes(item))
          .map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
      </Select>
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700"
          >
            {item}
            <button type="button" className="text-slate-500 hover:text-slate-700" onClick={() => removeOption(item)}>
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function GeneralOnboardingWizard({ step }: GeneralOnboardingWizardProps) {
  const router = useRouter();
  const { snapshot, setAddress, setProfessional, setResume, markSubmitted } = useGeneralOnboardingStore();
  const [selectedResume, setSelectedResume] = useState<File | null>(null);

  const meQuery = useQuery({
    queryKey: ["general-onboarding-me"],
    queryFn: generalOnboardingApi.me,
  });

  const addressForm = useForm<GeneralAddressFormValues>({
    resolver: zodResolver(generalAddressSchema),
    mode: "onChange",
    defaultValues: snapshot.address ?? {
      openToRelocation: "OPEN_TO_RELOCATION",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  const professionalForm = useForm<GeneralProfessionalFormValues>({
    resolver: zodResolver(generalProfessionalSchema),
    mode: "onChange",
    defaultValues: snapshot.professional ?? {
      functionDepartment: "",
      currentJobTitle: "",
      currentEmployer: "",
      totalExperienceYears: 0,
      highestQualification: "",
      currentFixedSalaryLpa: 0,
      domains: [],
      skills: [],
    },
  });

  const resumeMutation = useMutation({
    mutationFn: generalOnboardingApi.uploadResume,
    onSuccess: (data) => {
      setResume({ resumeUrl: data.resumeUrl, resumeFileName: selectedResume?.name });
      toast.success("Resume uploaded successfully");
      router.push("/onboarding/general/review-submit");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to upload resume")),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!snapshot.address || !snapshot.professional || !snapshot.resumeUrl) {
        throw new Error("Please complete all steps before submitting");
      }

      return generalOnboardingApi.save({
        address: snapshot.address,
        professional: snapshot.professional,
        resumeUrl: snapshot.resumeUrl,
      });
    },
    onSuccess: () => {
      markSubmitted();
      toast.success("General onboarding submitted successfully");
      router.push("/dashboard");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to submit onboarding")),
  });

  const completedSteps = [
    snapshot.address ? 2 : 0,
    snapshot.professional ? 3 : 0,
    snapshot.resumeUrl ? 4 : 0,
  ].filter(Boolean) as number[];

  useEffect(() => {
    if (step === 1) {
      void meQuery.refetch();
    }
  }, [meQuery, step]);

  if (step === 1) {
    const account = meQuery.data as CandidateAccountSummary | undefined;

    return (
      <div className="space-y-6">
        <StepProgress current={1} labels={stepLabels} completedSteps={completedSteps} />
        <Card>
          <CardHeader>
            <CardTitle>General Candidate Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meQuery.isLoading ? (
              <div className="flex items-center gap-3 py-6 text-slate-600">
                <Spinner className="h-5 w-5" />
                Loading account details...
              </div>
            ) : account ? (
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Registered Name</p>
                  <p className="text-base font-medium text-slate-900">{account.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Registered Email</p>
                  <p className="text-base font-medium text-slate-900">{account.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Registered Mobile</p>
                  <p className="text-base font-medium text-slate-900">{account.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Unable to load your account details.</p>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => router.push("/onboarding/general/step-2-address")} disabled={!account}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <StepProgress current={2} labels={stepLabels} completedSteps={completedSteps} />
        <Card>
          <CardHeader>
            <CardTitle>Address and Relocation</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={addressForm.handleSubmit((values) => {
                setAddress(values);
                router.push("/onboarding/general/step-3-professional");
              })}
            >
              <FormField label="Open to relocation" required error={addressForm.formState.errors.openToRelocation?.message}>
                <Select {...addressForm.register("openToRelocation")}>
                  {openToRelocationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "OPEN_TO_RELOCATION" ? "Open to relocation" : "Not open to relocation"}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="City" required error={addressForm.formState.errors.city?.message}>
                <Input {...addressForm.register("city")} />
              </FormField>
              <FormField label="State" required error={addressForm.formState.errors.state?.message}>
                <Select {...addressForm.register("state")}>
                  <option value="">Select</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Country" required error={addressForm.formState.errors.country?.message}>
                <Input {...addressForm.register("country")} />
              </FormField>
              <FormField label="Postal code" required error={addressForm.formState.errors.postalCode?.message}>
                <Input {...addressForm.register("postalCode")} />
              </FormField>
              <div className="md:col-span-2 flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/onboarding/general/step-1-basic")}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <StepProgress current={3} labels={stepLabels} completedSteps={completedSteps} />
        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={professionalForm.handleSubmit((values) => {
                setProfessional(values);
                router.push("/onboarding/general/step-4-documents");
              })}
            >
              <FormField label="Function / Department" required error={professionalForm.formState.errors.functionDepartment?.message}>
                <Select {...professionalForm.register("functionDepartment")}>
                  <option value="">Select</option>
                  {functionDepartmentOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current job title" required error={professionalForm.formState.errors.currentJobTitle?.message}>
                <Select {...professionalForm.register("currentJobTitle")}>
                  <option value="">Select</option>
                  {currentJobTitleOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current employer" required error={professionalForm.formState.errors.currentEmployer?.message}>
                <Input {...professionalForm.register("currentEmployer")} />
              </FormField>
              <FormField label="Total experience (years)" required error={professionalForm.formState.errors.totalExperienceYears?.message as string | undefined}>
                <Input type="number" step="0.5" {...professionalForm.register("totalExperienceYears", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Highest qualification" required error={professionalForm.formState.errors.highestQualification?.message}>
                <Select {...professionalForm.register("highestQualification")}>
                  <option value="">Select</option>
                  {highestQualificationOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current fixed salary (LPA)" required error={professionalForm.formState.errors.currentFixedSalaryLpa?.message as string | undefined}>
                <Input type="number" step="0.1" {...professionalForm.register("currentFixedSalaryLpa", { valueAsNumber: true })} />
              </FormField>
              <Controller
                control={professionalForm.control}
                name="domains"
                render={({ field }) => (
                  <FormField label="Domains" required error={professionalForm.formState.errors.domains?.message as string | undefined}>
                    <MultiSelectChips options={domainOptions} selected={field.value ?? []} onChange={field.onChange} />
                  </FormField>
                )}
              />
              <Controller
                control={professionalForm.control}
                name="skills"
                render={({ field }) => (
                  <FormField label="Skills" required error={professionalForm.formState.errors.skills?.message as string | undefined}>
                    <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Type a skill and press Enter" />
                  </FormField>
                )}
              />
              <div className="md:col-span-2 flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/onboarding/general/step-2-address")}>
                  Back
                </Button>
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 4) {
    const resumeLabel = snapshot.resumeFileName ?? (snapshot.resumeUrl ? "Uploaded resume" : "No resume uploaded yet");
    const canContinueWithoutUpload = Boolean(snapshot.resumeUrl);

    return (
      <div className="space-y-6">
        <StepProgress current={4} labels={stepLabels} completedSteps={completedSteps} />
        <Card>
          <CardHeader>
            <CardTitle>Upload Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Resume" required>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedResume(file);
                }}
              />
            </FormField>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Current upload</p>
              <p>{resumeLabel}</p>
              {snapshot.resumeUrl ? (
                <a className="mt-1 inline-block text-sky-700 underline" href={snapshot.resumeUrl} target="_blank" rel="noreferrer">
                  View uploaded resume
                </a>
              ) : null}
            </div>
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => router.push("/onboarding/general/step-3-professional")}>
                Back
              </Button>
              {canContinueWithoutUpload ? (
                <Button type="button" onClick={() => router.push("/onboarding/general/review-submit")}>
                  Continue to review
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!selectedResume || resumeMutation.isPending}
                  onClick={() => {
                    if (!selectedResume) {
                      toast.error("Please choose a resume file first");
                      return;
                    }
                    resumeMutation.mutate(selectedResume);
                  }}
                >
                  Upload and continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepProgress current={5} labels={stepLabels} completedSteps={completedSteps} />
      <Card>
        <CardHeader>
          <CardTitle>Review and Submit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Address</p>
              <p className="text-sm text-slate-600">{snapshot.address?.city ?? "City not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.address?.state ?? "State not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.address?.country ?? "Country not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.address?.postalCode ?? "Postal code not added"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Professional summary</p>
              <p className="text-sm text-slate-600">{snapshot.professional?.functionDepartment ?? "Function not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.professional?.currentJobTitle ?? "Job title not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.professional?.currentEmployer ?? "Employer not added"}</p>
              <p className="text-sm text-slate-600">{snapshot.professional?.totalExperienceYears ?? 0} years</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Checklist</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              <li>{snapshot.resumeUrl ? "Resume uploaded" : "Resume not uploaded"}</li>
              <li>{snapshot.professional?.skills?.length ? "Skills added" : "Skills not added"}</li>
            </ul>
          </div>
          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/onboarding/general/step-4-documents")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!snapshot.address || !snapshot.professional || !snapshot.resumeUrl || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              Submit Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
