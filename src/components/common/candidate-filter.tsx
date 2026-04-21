"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/forms/tag-input";
import { FormField } from "@/components/forms/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  experienceRangeOptions,
  experienceRangeOptionLabels,
} from "@/modules/shared/options";
import {
  adminCandidateFilterSchema,
  type AdminCandidateFilterFormInput,
  type AdminCandidateFilterFormValues,
} from "@/modules/admin/schema";
import type {
  AdminCandidateFilterInput,
} from "@/modules/admin/types";

interface CandidateFilterProps {
  onFilter: (filter: AdminCandidateFilterInput) => void;
  isLoading?: boolean;
}

export function CandidateFilter({ onFilter, isLoading = false }: CandidateFilterProps) {
  const toNumber = (value: unknown): number | undefined => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const mapExperienceToYearsRange = (value?: string) => {
    if (!value) {
      return undefined;
    }

    const mapping: Record<string, { min?: number; max?: number }> = {
      FRESHER: { min: 0, max: 0 },
      LT_1: { min: 0, max: 1 },
      Y1_2: { min: 1, max: 2 },
      Y2_3: { min: 2, max: 3 },
      Y3_5: { min: 3, max: 5 },
      Y5_7: { min: 5, max: 7 },
      Y7_10: { min: 7, max: 10 },
      Y10_12: { min: 10, max: 12 },
      Y12_15: { min: 12, max: 15 },
      Y15_20: { min: 15, max: 20 },
      GT_20: { min: 20 },
    };

    return mapping[value];
  };

  const form = useForm<AdminCandidateFilterFormInput, unknown, AdminCandidateFilterFormValues>({
    resolver: zodResolver(adminCandidateFilterSchema),
    defaultValues: {
      search: "",
      skills: [],
      totalWorkExperience: undefined,
      totalSalesExperience: undefined,
      page: 1,
      limit: 20,
    },
  });

  const onSubmit = (values: AdminCandidateFilterFormValues) => {
    const currentFixedSalaryLpaMin = toNumber(values.currentFixedSalaryLpaMin);
    const currentFixedSalaryLpaMax = toNumber(values.currentFixedSalaryLpaMax);
    const page = toNumber(values.page) ?? 1;
    const limit = toNumber(values.limit) ?? 20;
    const skills = Array.isArray(values.skills) ? values.skills : [];
    const workExperienceRange = mapExperienceToYearsRange(values.totalWorkExperience);
    const salesExperienceRange = mapExperienceToYearsRange(values.totalSalesExperience);
    const fallbackExperienceRange = workExperienceRange ?? salesExperienceRange;

    const payload: AdminCandidateFilterInput = {
      page,
      limit,
      search: values.search?.trim() || undefined,
      skills: skills.length ? skills : undefined,
      totalWorkExperience: values.totalWorkExperience ? [values.totalWorkExperience] : undefined,
      totalSalesExperience: values.totalSalesExperience ? [values.totalSalesExperience] : undefined,
      totalExperienceYears: fallbackExperienceRange,
      currentFixedSalaryLpa:
        currentFixedSalaryLpaMin !== undefined || currentFixedSalaryLpaMax !== undefined
          ? { min: currentFixedSalaryLpaMin, max: currentFixedSalaryLpaMax }
          : undefined,
    };

    onFilter(payload as AdminCandidateFilterInput);
  };

  const handleReset = () => {
    form.reset();
    onFilter({ page: 1, limit: 20 } as AdminCandidateFilterInput);
  };

  const arrayField = (name: keyof AdminCandidateFilterFormValues, label: string, placeholder: string) => (
    <Controller
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormField label={label}>
          <TagInput
            value={(field.value as string[] | undefined) ?? []}
            onChange={field.onChange}
            placeholder={placeholder}
          />
        </FormField>
      )}
    />
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-3">
            <FormField label="Search">
              <Input placeholder="Name, email, phone, city, skill" {...form.register("search")} />
            </FormField>
            {arrayField("skills", "Skills", "Add skills")}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              control={form.control}
              name="totalWorkExperience"
              render={({ field }) => (
                <FormField label="Total Work Experience">
                  <Select
                    value={(field.value as string | undefined) ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  >
                    <option value="">Any</option>
                    {experienceRangeOptions.map((value) => (
                      <option key={value} value={value}>
                        {experienceRangeOptionLabels[value]}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="totalSalesExperience"
              render={({ field }) => (
                <FormField label="Total Sales Experience">
                  <Select
                    value={(field.value as string | undefined) ?? ""}
                    onChange={(event) => field.onChange(event.target.value)}
                  >
                    <option value="">Any</option>
                    {experienceRangeOptions.map((value) => (
                      <option key={value} value={value}>
                        {experienceRangeOptionLabels[value]}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FormField label="Min Current Fixed Salary (LPA)">
                <Input type="number" placeholder="Min" {...form.register("currentFixedSalaryLpaMin", { valueAsNumber: true })} />
              </FormField>
            </div>
            <div>
              <FormField label="Max Current Fixed Salary (LPA)">
                <Input type="number" placeholder="Max" {...form.register("currentFixedSalaryLpaMax", { valueAsNumber: true })} />
              </FormField>
            </div>
          </div>

          <div>
            <FormField label="Results Per Page">
              <Input
                type="number"
                placeholder="20"
                {...form.register("limit", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
