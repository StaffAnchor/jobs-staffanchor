"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/modules/auth/store";
import { getOnboardingPath } from "@/modules/auth/navigation";
import { userApi } from "@/modules/user/api";
import { formatCurrency } from "@/lib/utils";
import {
  avgTicketSizeOptionLabels,
  b2bCustomerSegmentOptionLabels,
  b2bPersonaOptionLabels,
  b2bSalesSubtypeOptionLabels,
  b2cCustomerProfileOptionLabels,
  b2cProductServiceOptionLabels,
  b2cSalesChannelOptionLabels,
  b2cSalesSubtypeOptionLabels,
  beatPlanningOptionLabels,
  channelTypeOptionLabels,
  crmSalesPlatformOptionLabels,
  customerSegmentOptionLabels,
  dealSizeRangeOptions,
  distributorManagedOptionLabels,
  employmentStatusOptionLabels,
  esopPreferenceOptionLabels,
  experienceRangeOptionLabels,
  gemPortalOptionLabels,
  geographyCoveredOptionLabels,
  govtSegmentOptionLabels,
  industryOptionLabels,
  largestTeamManagedOptionLabels,
  marketFocusOptionLabels,
  marketSoldToOptionLabels,
  noticePeriodOptionLabels,
  offeringTypeOptionLabels,
  partnersManagedRangeOptionLabels,
  quotaAttainmentOptionLabels,
  quotaBasisOptionLabels,
  reasonForLeavingOptionLabels,
  roleLevelOptionLabels,
  rfpExperienceOptionLabels,
  salaryFlexibilityOptionLabels,
  salesCycleOptions,
  salesCycleOptionLabels,
  salesMethodologyOptionLabels,
  seniorSellingExperienceOptionLabels,
  startupPreferenceOptionLabels,
  teamSizeOptionLabels,
  tenderExperienceOptionLabels,
} from "@/modules/shared/options";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN");
}

function withFallback(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return value;
}

function mapLabel<T extends string>(value: string | null | undefined, labels: Record<T, string>) {
  if (!value) {
    return "-";
  }

  return labels[value as T] ?? value;
}

function renderPills(values: string[], labels?: Record<string, string>) {
  if (!values.length) {
    return <p className="text-sm text-slate-500">-</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} className="border border-slate-200 bg-slate-50">{labels?.[value] ?? value}</Badge>
      ))}
    </div>
  );
}

function LoadingSkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl border border-slate-200 bg-white ${className}`} />;
}

function CandidateDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidate Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <LoadingSkeletonCard className="h-20" />
          <LoadingSkeletonCard className="h-20" />
          <LoadingSkeletonCard className="h-20" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-5 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <LoadingSkeletonCard className="h-24" />
          <LoadingSkeletonCard className="h-20" />
        </CardContent>
      </Card>
    </div>
  );
}

export function CandidateDashboard() {
  const storedProfileType = useAuthStore((state) => state.profileType);
  const {
    data: account,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user-me"],
    queryFn: userApi.me,
  });
  const profileType = storedProfileType ?? account?.profileType ?? null;
  const onboardingPath = getOnboardingPath(profileType);

  if (isPending) {
    return <CandidateDashboardSkeleton />;
  }

  if (isError || !account) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">Unable to load your profile right now.</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileType === "NON_SALES") {
    const profile = account?.generalCandidateProfile;
    const generalCompletion = [profile?.city, profile?.functionDepartment, profile?.resumeUrl].filter(Boolean).length;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Completion</p>
              <p className="text-2xl font-semibold">{Math.round((generalCompletion / 3) * 100)}%</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Profile Type</p>
              <Badge>NON_SALES</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Resume</p>
              <p className="text-2xl font-semibold">{profile?.resumeUrl ? "Uploaded" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General Candidate Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Open to relocation</p>
                <p className="font-medium">{profile?.openToRelocation === "OPEN_TO_RELOCATION" ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total experience</p>
                <p className="font-medium">{withFallback(profile?.totalExperienceYears)} years</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Current employer</p>
                <p className="font-medium">{withFallback(profile?.currentEmployer)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Current job title</p>
                <p className="font-medium">{withFallback(profile?.currentJobTitle)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Highest qualification</p>
                <p className="font-medium">{withFallback(profile?.highestQualification)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Current fixed salary (LPA)</p>
                <p className="font-medium">{withFallback(profile?.currentFixedSalaryLpa)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium">{profile ? `${profile.city}, ${profile.state}, ${profile.country} - ${profile.postalCode}` : "-"}</p>
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-500">Domains</p>
              {renderPills(profile?.domains ?? [])}
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-500">Skills</p>
              {renderPills(profile?.skills ?? [])}
            </div>

            <div>
              <p className="text-sm text-slate-500">Resume</p>
              {profile?.resumeUrl ? (
                <a className="font-medium text-sky-700 underline" href={profile.resumeUrl} target="_blank" rel="noreferrer">View uploaded resume</a>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href={onboardingPath}><Button>Continue Onboarding</Button></Link>
        </div>
      </div>
    );
  }

  const profile = account.candidateProfile;
  const jobs = profile?.jobs ?? [];
  const completion = profile?.profileScore ?? account.candidateProfileCompletion ?? 0;
  const career = profile?.careerSnapshot;
  const skills = profile?.candidateSkills ?? [];
  const achievements = profile?.achievements ?? [];
  const compensation = profile?.compensation;
  const documents = profile?.document;
  const salesSubTypeLabels = {
    ...b2bSalesSubtypeOptionLabels,
    ...b2cSalesSubtypeOptionLabels,
  } as Record<string, string>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidate Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Completion</p>
            <p className="text-2xl font-semibold">{completion}%</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Profile Score</p>
            <p className="text-2xl font-semibold">{profile?.profileScore ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Primary Category</p>
            <Badge>{profile?.primarySalesCategory ?? "N/A"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Date of birth</p>
              <p className="font-medium">{formatDate(profile?.dob)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current city</p>
              <p className="font-medium">{withFallback(profile?.currentCity)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Profile visibility</p>
              <p className="font-medium">{profile?.profileVisibility ? "Visible to verified hiring teams" : "Hidden"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Relocation preference</p>
              <p className="font-medium">{withFallback(profile?.relocationPreference)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Travel preference</p>
              <p className="font-medium">{withFallback(profile?.travelPreference)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Work mode</p>
              <p className="font-medium">{withFallback(profile?.workMode)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-500">Preferred cities</p>
            {renderPills(profile?.preferredCities ?? [])}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Total work experience</p>
              <p className="font-medium">{mapLabel(career?.totalWorkExperience, experienceRangeOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total sales experience</p>
              <p className="font-medium">{mapLabel(career?.totalSalesExperience, experienceRangeOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Employment status</p>
              <p className="font-medium">{mapLabel(career?.employmentStatus, employmentStatusOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current role level</p>
              <p className="font-medium">{mapLabel(career?.currentRoleLevel, roleLevelOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Highest role level</p>
              <p className="font-medium">{mapLabel(career?.highestRoleLevel, roleLevelOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Team management</p>
              <p className="font-medium">{career?.teamManagement ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Largest team managed</p>
              <p className="font-medium">{mapLabel(career?.largestTeamManaged, largestTeamManagedOptionLabels)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Highest annual target</p>
              <p className="font-medium">{career ? formatCurrency(career.highestQuotaValue, career.quotaCurrency === "USD" ? "USD" : "INR") : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Open to startup</p>
              <p className="font-medium">{mapLabel(career?.openToStartup, startupPreferenceOptionLabels)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-slate-500">Sales subtypes</p>
            {renderPills(career?.salesSubtypes ?? [], salesSubTypeLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Industries worked in</p>
            {renderPills(career?.industriesWorkedIn ?? [], industryOptionLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Industries sold into</p>
            {renderPills(career?.industriesSoldInto ?? [], industryOptionLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Customer segments</p>
            {renderPills(career?.customerSegments ?? [], customerSegmentOptionLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Geography covered</p>
            {renderPills(career?.geographyCovered ?? [], geographyCoveredOptionLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Markets sold to</p>
            {renderPills(career?.markets ?? [], marketSoldToOptionLabels)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 && <p className="text-sm text-slate-500">No jobs added yet.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{job.designation} @ {job.companyName}</p>
                <p className="text-xs text-slate-500">{formatDate(job.startDate)} - {job.isCurrent ? "Present" : formatDate(job.endDate)}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div>
                  <p className="text-slate-500">Sales type</p>
                  <p className="font-medium">{withFallback(job.jobSalesType)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Role level</p>
                  <p className="font-medium">{mapLabel(job.roleLevel, roleLevelOptionLabels)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Industry</p>
                  <p className="font-medium">{mapLabel(job.industry, industryOptionLabels)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Direct reports</p>
                  <p className="font-medium">{job.directReports}</p>
                </div>
                <div>
                  <p className="text-slate-500">Reason for leaving</p>
                  <p className="font-medium">{mapLabel(job.reasonForLeaving, reasonForLeavingOptionLabels)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Hunter percentage</p>
                  <p className="font-medium">{job.hunterPercentage}%</p>
                </div>
                <div>
                  <p className="text-slate-500">Quota</p>
                  <p className="font-medium">{formatCurrency(job.quotaValue, job.quotaCurrency === "USD" ? "USD" : "INR")}</p>
                </div>
                <div>
                  <p className="text-slate-500">Quota attainment</p>
                  <p className="font-medium">{mapLabel(job.quotaAttainment, quotaAttainmentOptionLabels)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Quota basis</p>
                  <p className="font-medium">{mapLabel(job.quotaBasis, quotaBasisOptionLabels)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Deal size range</p>
                  <p className="font-medium">{dealSizeRangeOptions.includes(job.dealSizeRange as (typeof dealSizeRangeOptions)[number]) ? job.dealSizeRange : withFallback(job.dealSizeRange)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Sales cycle</p>
                  <p className="font-medium">{salesCycleOptions.includes(job.salesCycle as (typeof salesCycleOptions)[number]) ? mapLabel(job.salesCycle, salesCycleOptionLabels) : withFallback(job.salesCycle)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">Sales subtypes</p>
                {renderPills(job.salesSubtype ?? [], salesSubTypeLabels)}
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-500">Industries sold into</p>
                {renderPills(job.industriesSoldInto ?? [], industryOptionLabels)}
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-500">Geography</p>
                {renderPills(job.geography ?? [])}
              </div>

              {job.b2bContext ? (
                <div className="rounded-md bg-slate-50 p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">B2B Context</p>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <p><span className="text-slate-500">Customer segment:</span> <span className="font-medium">{mapLabel(job.b2bContext.customerSegment, b2bCustomerSegmentOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Offering type:</span> <span className="font-medium">{mapLabel(job.b2bContext.offeringType, offeringTypeOptionLabels)}</span></p>
                    <p><span className="text-slate-500">C-suite selling:</span> <span className="font-medium">{mapLabel(job.b2bContext.cSuiteSelling, seniorSellingExperienceOptionLabels)}</span></p>
                    <p><span className="text-slate-500">RFP experience:</span> <span className="font-medium">{mapLabel(job.b2bContext.rfpExperience, rfpExperienceOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Partners managed:</span> <span className="font-medium">{mapLabel(job.b2bContext.partnersManaged, partnersManagedRangeOptionLabels)}</span></p>
                    <p><span className="text-slate-500">GeM experience:</span> <span className="font-medium">{mapLabel(job.b2bContext.gemExperience, gemPortalOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Tender experience:</span> <span className="font-medium">{mapLabel(job.b2bContext.tenderExperience, tenderExperienceOptionLabels)}</span></p>
                  </div>
                  <div><p className="mb-2 text-xs text-slate-500">Sales methodologies</p>{renderPills(job.b2bContext.salesMethodologies ?? [], salesMethodologyOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Personas</p>{renderPills(job.b2bContext.personas ?? [], b2bPersonaOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Channel type</p>{renderPills(job.b2bContext.channelType ?? [], channelTypeOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Govt segment</p>{renderPills(job.b2bContext.govtSegment ?? [], govtSegmentOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Market focus</p>{renderPills(job.b2bContext.marketFocus ?? [], marketFocusOptionLabels)}</div>
                </div>
              ) : null}

              {job.b2cContext ? (
                <div className="rounded-md bg-slate-50 p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">B2C Context</p>
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <p><span className="text-slate-500">Avg ticket size:</span> <span className="font-medium">{mapLabel(job.b2cContext.avgTicketSize, avgTicketSizeOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Team size:</span> <span className="font-medium">{mapLabel(job.b2cContext.teamSize, teamSizeOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Distributor managed:</span> <span className="font-medium">{mapLabel(job.b2cContext.distributorManaged, distributorManagedOptionLabels)}</span></p>
                    <p><span className="text-slate-500">Beat planning:</span> <span className="font-medium">{mapLabel(job.b2cContext.beatPlanning, beatPlanningOptionLabels)}</span></p>
                  </div>
                  <div><p className="mb-2 text-xs text-slate-500">Sales channels</p>{renderPills(job.b2cContext.salesChannels ?? [], b2cSalesChannelOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Products sold</p>{renderPills(job.b2cContext.productsSold ?? [], b2cProductServiceOptionLabels)}</div>
                  <div><p className="mb-2 text-xs text-slate-500">Customer profile</p>{renderPills(job.b2cContext.customerProfile ?? [], b2cCustomerProfileOptionLabels)}</div>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills and Achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-slate-500">Skills</p>
            {(skills.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((item) => (
                  <Badge key={item.id} className={item.isCore ? "bg-slate-900 text-white" : "border border-slate-200 bg-slate-50"}>
                    {item.skill.name}{item.isCore ? " (Core)" : ""}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">-</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Tools and CRM</p>
            {renderPills(profile?.toolsCrm ?? [], crmSalesPlatformOptionLabels)}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Certifications</p>
            {renderPills(profile?.certifications ?? [])}
          </div>
          <div>
            <p className="mb-2 text-sm text-slate-500">Achievements</p>
            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.map((item) => (
                  <p key={item.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{item.description}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">-</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Current fixed</p>
            <p className="font-medium">{compensation ? formatCurrency(compensation.currentFixed, "INR") : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Current variable</p>
            <p className="font-medium">{compensation ? formatCurrency(compensation.currentVariable, "INR") : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Expected min</p>
            <p className="font-medium">{compensation ? formatCurrency(compensation.expectedMin, "INR") : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Expected ideal</p>
            <p className="font-medium">{compensation ? formatCurrency(compensation.expectedIdeal, "INR") : "-"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">ESOP preference</p>
            <p className="font-medium">{mapLabel(compensation?.esopPreference, esopPreferenceOptionLabels)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Notice period</p>
            <p className="font-medium">{mapLabel(compensation?.noticePeriod, noticePeriodOptionLabels)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-slate-500">Salary flexibility</p>
            <p className="font-medium">{mapLabel(compensation?.salaryFlexibility, salaryFlexibilityOptionLabels)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>LinkedIn: {documents?.linkedinUrl ? <a className="text-sky-700 underline" href={documents.linkedinUrl} target="_blank" rel="noreferrer">Open profile</a> : "-"}</p>
          <p>Resume: {documents?.resumeUrl ? <a className="text-sky-700 underline" href={documents.resumeUrl} target="_blank" rel="noreferrer">View resume</a> : "-"}</p>
          <p>Salary proof: {documents?.salaryProofUrl ? <a className="text-sky-700 underline" href={documents.salaryProofUrl} target="_blank" rel="noreferrer">View salary proof</a> : "-"}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href={onboardingPath}><Button>Continue Onboarding</Button></Link>
        <Link href="/dashboard/edit/profile"><Button variant="outline">Edit Profile</Button></Link>
        <Link href="/dashboard/edit/career"><Button variant="outline">Edit Career</Button></Link>
        <Link href="/dashboard/edit/jobs"><Button variant="outline">Edit Jobs</Button></Link>
        <Link href="/dashboard/edit/skills"><Button variant="outline">Edit Skills</Button></Link>
        <Link href="/dashboard/edit/compensation"><Button variant="outline">Edit Compensation</Button></Link>
      </div>
    </div>
  );
}
