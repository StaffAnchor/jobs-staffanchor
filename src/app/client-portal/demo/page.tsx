"use client";

import RoleBoardView from "@/modules/client-portal/v2/RoleBoardView";
import { demoBoard } from "@/modules/client-portal/v2/demoData";

export default function ClientPortalDemoPage() {
  return (
    <RoleBoardView
      board={demoBoard}
      backHref="/client-portal/demo/overview"
      onFeedback={async () => {}}
      banner={
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          Sample data only. This is how a shortlist looks in your StaffAnchor client portal.
        </p>
      }
    />
  );
}
