"use client";

import OverviewView from "@/modules/client-portal/v2/OverviewView";
import { demoOverview } from "@/modules/client-portal/v2/demoData";

export default function ClientPortalDemoOverviewPage() {
  return (
    <OverviewView
      data={demoOverview}
      roleHref={() => "/client-portal/demo"}
      banner={
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          Sample data only. This is how your roles look in your StaffAnchor client portal.
        </p>
      }
    />
  );
}
