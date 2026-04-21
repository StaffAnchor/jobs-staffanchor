"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/common/auth-guard";
import { adminApi } from "@/modules/admin/api";
import { getApiErrorMessage } from "@/modules/shared/error";
import { toast } from "sonner";
import type { AdminCandidateRecord } from "@/modules/admin/types";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";

  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const withFallback = (value: unknown, fallback = "N/A"): string => {
  return value === null || value === undefined || value === "" ? fallback : String(value);
};

const formatNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "N/A";

  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-IN") : "N/A";
};

const renderPills = (values?: string[] | null) => {
  if (!values?.length) {
    return <p className="text-sm text-slate-500">N/A</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {value}
        </Badge>
      ))}
    </div>
  );
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case "B2B":
      return "bg-blue-100 text-blue-800";
    case "B2C":
      return "bg-green-100 text-green-800";
    case "BOTH":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export default function CandidateProfilePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate-profile", candidateId],
    queryFn: async (): Promise<AdminCandidateRecord> => {
      try {
        return await adminApi.getCandidateById(candidateId);
      } catch (err) {
        toast.error(getApiErrorMessage(err as any, "Failed to load profile"));
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <AuthGuard roles={["ADMIN"]}>
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-64 animate-pulse rounded bg-slate-200" />
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (error || !data) {
    return (
      <AuthGuard roles={["ADMIN"]}>
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-900">
                  Failed to load candidate profile. Please try again.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </AuthGuard>
    );
  }

  const candidate = data;
  const profile = candidate.candidateProfile;

  return (
    <AuthGuard roles={["ADMIN"]}>
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
          <Badge className={getCategoryColor(profile?.primarySalesCategory)}>
            {profile?.primarySalesCategory ?? "N/A"}
          </Badge>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{candidate.name}</h1>
                <p className="mt-1 text-slate-600">
                  Profile Completion: {profile?.profileScore ?? 0}%
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4" />
                  {candidate.email}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  {candidate.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {withFallback(profile?.currentCity ?? candidate.generalCandidateProfile?.city)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Candidate Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-slate-900">Date of Birth</p>
                <p>{profile?.dob ? formatDate(profile.dob) : "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Profile Visibility</p>
                <p>{profile?.profileVisibility ? "Visible" : "Hidden"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Relocation</p>
                <p>{profile?.relocationPreference ?? "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Travel Preference</p>
                <p>{profile?.travelPreference ?? "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Work Mode</p>
                <p>{profile?.workMode ?? "N/A"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-900">Sales Category</p>
                <p>{profile?.primarySalesCategory ?? "N/A"}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-900">Preferred Cities</p>
              {renderPills(profile?.preferredCities)}
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-900">Tools / CRM</p>
              {renderPills(profile?.toolsCrm)}
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-900">Certifications</p>
              {renderPills(profile?.certifications)}
            </div>
          </CardContent>
        </Card>

        {profile?.careerSnapshot ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5" />
                Career Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="font-medium text-slate-900">Current Role Level</p>
                  <p>{profile.careerSnapshot.currentRoleLevel}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Highest Role Level</p>
                  <p>{profile.careerSnapshot.highestRoleLevel}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Work Experience</p>
                  <p>{profile.careerSnapshot.totalWorkExperience}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Sales Experience</p>
                  <p>{profile.careerSnapshot.totalSalesExperience}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Employment Status</p>
                  <p>{profile.careerSnapshot.employmentStatus}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Quota</p>
                  <p>{formatNumber(profile.careerSnapshot.highestQuotaValue)} {profile.careerSnapshot.quotaCurrency}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 font-medium text-slate-900">Industries Worked In</p>
                {renderPills(profile.careerSnapshot.industriesWorkedIn)}
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-900">Industries Sold Into</p>
                {renderPills(profile.careerSnapshot.industriesSoldInto)}
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-900">Geography Covered</p>
                {renderPills(profile.careerSnapshot.geographyCovered)}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {profile?.jobs?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.jobs.map((job) => (
                <div
                  key={job.id}
                  className="border-b border-slate-200 pb-4 last:border-0 last:pb-0"
                >
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {withFallback(job.designation)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {withFallback(job.companyName)} • {withFallback(job.industry)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(job.startDate)} - {formatDate(job.endDate)}
                      </p>
                    </div>
                    <Badge className="bg-slate-900 text-white">{job.roleLevel}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <p>Job Type: {job.jobSalesType}</p>
                    <p>
                      Quota: {formatNumber(job.quotaValue)} {job.quotaCurrency}
                    </p>
                    <p>Quota Attainment: {job.quotaAttainment}</p>
                    <p>Sales Cycle: {job.salesCycle}</p>
                  </div>

                  {job.b2bContext ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-slate-900">B2B Context</p>
                      <p>Customer Segment: {job.b2bContext.customerSegment}</p>
                      <p>Offering Type: {job.b2bContext.offeringType}</p>
                    </div>
                  ) : null}

                  {job.b2cContext ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-slate-900">B2C Context</p>
                      <p>Channels: {job.b2cContext.salesChannels.join(", ")}</p>
                      <p>Products: {job.b2cContext.productsSold.join(", ")}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {profile?.candidateSkills?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Skills & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.candidateSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    className={
                      skill.isCore
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-slate-50"
                    }
                  >
                    {skill.skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {profile?.achievements?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700"
                >
                  {achievement.description}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {profile?.compensation ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Compensation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 text-sm text-slate-700 md:grid-cols-2">
              <p>Current Fixed: {formatNumber(profile.compensation.currentFixed)}</p>
              <p>Current Variable: {formatNumber(profile.compensation.currentVariable)}</p>
              <p>Expected Min: {formatNumber(profile.compensation.expectedMin)}</p>
              <p>Expected Ideal: {formatNumber(profile.compensation.expectedIdeal)}</p>
              <p>ESOP Preference: {profile.compensation.esopPreference}</p>
              <p>Notice Period: {profile.compensation.noticePeriod}</p>
              <p>Salary Flexibility: {profile.compensation.salaryFlexibility}</p>
            </CardContent>
          </Card>
        ) : null}

        {candidate.generalCandidateProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>General Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="font-medium text-slate-900">Open To Relocation</p>
                  <p>{candidate.generalCandidateProfile.openToRelocation}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Location</p>
                  <p>
                    {candidate.generalCandidateProfile.city}, {candidate.generalCandidateProfile.state}, {candidate.generalCandidateProfile.country}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Function Department</p>
                  <p>{candidate.generalCandidateProfile.functionDepartment}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Current Job Title</p>
                  <p>{candidate.generalCandidateProfile.currentJobTitle}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Current Employer</p>
                  <p>{candidate.generalCandidateProfile.currentEmployer}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Experience</p>
                  <p>{candidate.generalCandidateProfile.totalExperienceYears} years</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Highest Qualification</p>
                  <p>{candidate.generalCandidateProfile.highestQualification}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Current Fixed Salary</p>
                  <p>{formatNumber(candidate.generalCandidateProfile.currentFixedSalaryLpa)} LPA</p>
                </div>
              </div>

              <div>
                <p className="mb-2 font-medium text-slate-900">Domains</p>
                {renderPills(candidate.generalCandidateProfile.domains)}
              </div>
              <div>
                <p className="mb-2 font-medium text-slate-900">Skills</p>
                {renderPills(candidate.generalCandidateProfile.skills)}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This admin view pulls the full candidate graph from the backend admin API, including profile, career, jobs, compensation, documents, and general profile data.
            </p>
          </CardContent>
        </Card>
      </main>
    </AuthGuard>
  );
}