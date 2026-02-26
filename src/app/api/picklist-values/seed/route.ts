import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, isGodAdmin } from "@/lib/auth";

// ============================================
// SEED DATA DEFINITIONS
// ============================================

interface PicklistSeed {
  pageId: string;
  fieldName: string;
  values: {
    value: string;
    label?: string;
    color?: string;
    isDefault?: boolean;
  }[];
}

const PICKLIST_SEEDS: PicklistSeed[] = [
  // ------------------------------------------
  // Dispatch module
  // ------------------------------------------
  {
    pageId: "dispatch",
    fieldName: "type",
    values: [
      { value: "Maintenance" },
      { value: "Violation" },
      { value: "Other" },
      { value: "NEW REPAIR" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "status",
    values: [
      { value: "Open", color: "bg-[#90EE90]" },
      { value: "Assigned", color: "bg-[#ADD8E6]" },
      { value: "En Route", color: "bg-[#FFB6C1]" },
      { value: "On Site", color: "bg-[#FFDAB9]" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "source",
    values: [
      { value: "GENERAL" },
      { value: "PHONE" },
      { value: "EMAIL" },
      { value: "WALK-IN" },
      { value: "WEB" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "level",
    values: [
      { value: "1-Service Call" },
      { value: "2-Emergency" },
      { value: "3-PM" },
      { value: "4-Annual Test" },
      { value: "5-Violation" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "nature",
    values: [
      { value: "Existing Job" },
      { value: "New Job" },
      { value: "Callback" },
      { value: "Warranty" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "category",
    values: [
      { value: "None" },
      { value: "Maintenance" },
      { value: "Repair" },
      { value: "Installation" },
      { value: "Inspection" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "zone",
    values: [
      { value: "DIVISION #1" },
      { value: "DIVISION #2" },
      { value: "DIVISION #3" },
      { value: "DIVISION #4" },
      { value: "DIVISION #5" },
    ],
  },
  {
    pageId: "dispatch",
    fieldName: "scheme",
    values: [
      { value: "None" },
      { value: "Priority" },
      { value: "Zone" },
      { value: "Worker" },
      { value: "Type" },
    ],
  },

  // ------------------------------------------
  // Units module
  // ------------------------------------------
  {
    pageId: "units",
    fieldName: "category",
    values: [
      { value: "CONSULTANT" },
      { value: "N/A" },
      { value: "Other" },
      { value: "Private" },
      { value: "Public" },
      { value: "Service" },
    ],
  },
  {
    pageId: "units",
    fieldName: "type",
    values: [
      { value: "Elevator" },
      { value: "Hydraulic" },
      { value: "Service" },
      { value: "Escalator" },
      { value: "Dumbwaiter" },
    ],
  },
  {
    pageId: "units",
    fieldName: "building",
    values: [
      { value: "Hospital" },
      { value: "Office / Commercial" },
      { value: "Store / Retail" },
      { value: "School" },
      { value: "Residential" },
      { value: "Other" },
    ],
  },
  {
    pageId: "units",
    fieldName: "status",
    values: [
      { value: "Active" },
      { value: "Inactive" },
      { value: "Pending" },
      { value: "On Hold" },
    ],
  },
  {
    pageId: "units",
    fieldName: "template",
    values: [
      { value: "Standard" },
      { value: "Hydraulic" },
      { value: "Traction" },
      { value: "MRL" },
      { value: "Freight" },
    ],
  },
  {
    pageId: "units",
    fieldName: "testStatus",
    values: [
      { value: "No Proposal" },
      { value: "Job Awarded" },
      { value: "Proposal Sent" },
      { value: "Completed" },
      { value: "Cancelled" },
    ],
  },

  // ------------------------------------------
  // Accounts module
  // ------------------------------------------
  {
    pageId: "accounts",
    fieldName: "type",
    values: [
      { value: "S" },
      { value: "H" },
      { value: "MOD" },
      { value: "Resident Mech." },
      { value: "Non-Contract" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "status",
    values: [
      { value: "Active" },
      { value: "Inactive" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "billingFrequency",
    values: [
      { value: "Monthly" },
      { value: "Quarterly" },
      { value: "Annual" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "billingTerms",
    values: [
      { value: "Net 30" },
      { value: "Net 45" },
      { value: "Net 60" },
      { value: "Due on Receipt" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "escalationSchedule",
    values: [
      { value: "Annual" },
      { value: "Semi-Annual" },
      { value: "5 Year" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "priceLevel",
    values: [
      { value: "Standard" },
      { value: "Premium" },
      { value: "Discount" },
    ],
  },
  {
    pageId: "accounts",
    fieldName: "maintenanceSchedule",
    values: [
      { value: "Weekly" },
      { value: "Bi-Weekly" },
      { value: "Monthly" },
      { value: "Quarterly" },
      { value: "Semi-Annual" },
      { value: "Annual" },
    ],
  },

  // ------------------------------------------
  // Estimates module
  // ------------------------------------------
  {
    pageId: "estimates",
    fieldName: "status",
    values: [
      { value: "Draft" },
      { value: "Sent" },
      { value: "Accepted" },
      { value: "Rejected" },
      { value: "Expired" },
    ],
  },

  // ------------------------------------------
  // Quotes module
  // ------------------------------------------
  {
    pageId: "quotes",
    fieldName: "status",
    values: [
      { value: "Draft" },
      { value: "Sent" },
      { value: "Accepted" },
      { value: "Rejected" },
      { value: "Expired" },
      { value: "Converted" },
    ],
  },

  // ------------------------------------------
  // Violations module
  // ------------------------------------------
  {
    pageId: "violations",
    fieldName: "status",
    values: [
      { value: "Open" },
      { value: "Pending" },
      { value: "Work on Hold" },
      { value: "Dismissed" },
      { value: "CONTRACT CANCELLED" },
    ],
  },

  // ------------------------------------------
  // Safety Tests module
  // ------------------------------------------
  {
    pageId: "safety-tests",
    fieldName: "status",
    values: [
      { value: "Inspector to s" },
      { value: "Job Awarded" },
      { value: "Scheduled" },
      { value: "Test Complete" },
      { value: "No Proposal" },
      { value: "Proposal Sent" },
      { value: "Cancelled" },
      { value: "On Hold" },
    ],
  },
  {
    pageId: "safety-tests",
    fieldName: "testType",
    values: [
      { value: "ANNUAL INS" },
      { value: "OUTSIDE N" },
      { value: "CAT 1 TEST" },
      { value: "CAT 3 TEST" },
      { value: "CAT 5 TEST" },
      { value: "LOAD TEST" },
      { value: "FIRE SERVICE" },
      { value: "HYDRAULIC" },
      { value: "PRESSURE TEST" },
      { value: "SAFETY TEST" },
    ],
  },

  // ------------------------------------------
  // Award Job module
  // ------------------------------------------
  {
    pageId: "award-job",
    fieldName: "jobType",
    values: [
      { value: "Modernization" },
      { value: "Repair" },
      { value: "Service Contract" },
      { value: "Installation" },
      { value: "Inspection" },
      { value: "Consultation" },
    ],
  },
  {
    pageId: "award-job",
    fieldName: "jobCategory",
    values: [
      { value: "Capital Improvement" },
      { value: "Maintenance" },
      { value: "Safety Compliance" },
      { value: "New Construction" },
      { value: "Emergency" },
    ],
  },

  // ------------------------------------------
  // Job Types module
  // ------------------------------------------
  {
    pageId: "job-types",
    fieldName: "color",
    values: [
      { value: "Red" },
      { value: "Blue" },
      { value: "Green" },
      { value: "Yellow" },
      { value: "Orange" },
      { value: "Purple" },
      { value: "Pink" },
      { value: "Brown" },
      { value: "Gray" },
      { value: "Black" },
      { value: "White" },
    ],
  },

  // ------------------------------------------
  // Global values
  // ------------------------------------------
  {
    pageId: "_global",
    fieldName: "state",
    values: [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL",
      "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
      "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
      "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
      "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
      "WY",
    ].map((s) => ({ value: s, label: s })),
  },
  {
    pageId: "_global",
    fieldName: "jobType",
    values: [
      { value: "Maintenance" },
      { value: "Modernization" },
      { value: "Repair" },
      { value: "Other" },
      { value: "NEW REPAIR" },
    ],
  },
  {
    pageId: "_global",
    fieldName: "country",
    values: [
      { value: "United States", isDefault: true },
      { value: "Canada" },
    ],
  },
];

// ------------------------------------------
// Status Workflow seeds
// ------------------------------------------
interface WorkflowSeed {
  pageId: string;
  fromStatus: string;
  toStatus: string;
}

const WORKFLOW_SEEDS: WorkflowSeed[] = [
  // Dispatch module
  { pageId: "dispatch", fromStatus: "_initial", toStatus: "Open" },
  { pageId: "dispatch", fromStatus: "Open", toStatus: "Assigned" },
  { pageId: "dispatch", fromStatus: "Open", toStatus: "En Route" },
  { pageId: "dispatch", fromStatus: "Assigned", toStatus: "En Route" },
  { pageId: "dispatch", fromStatus: "Assigned", toStatus: "Open" },
  { pageId: "dispatch", fromStatus: "En Route", toStatus: "On Site" },
  { pageId: "dispatch", fromStatus: "On Site", toStatus: "Completed" },
  { pageId: "dispatch", fromStatus: "On Site", toStatus: "En Route" },
];

// ============================================
// POST /api/picklist-values/seed — GodAdmin only
// Seeds the database with all hardcoded dropdown values.
// Idempotent: uses upsert with @@unique([pageId, fieldName, value]).
// ============================================
export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !isGodAdmin(role)) {
    return NextResponse.json({ error: "Unauthorized — GodAdmin only" }, { status: 403 });
  }

  try {
    let picklistCount = 0;
    let workflowCount = 0;

    // Seed picklist values
    for (const seed of PICKLIST_SEEDS) {
      for (let i = 0; i < seed.values.length; i++) {
        const v = seed.values[i];
        await prisma.picklistValue.upsert({
          where: {
            pageId_fieldName_value: {
              pageId: seed.pageId,
              fieldName: seed.fieldName,
              value: v.value,
            },
          },
          update: {
            label: v.label || v.value,
            sortOrder: i,
            color: v.color || null,
            isDefault: v.isDefault || false,
            isActive: true,
          },
          create: {
            pageId: seed.pageId,
            fieldName: seed.fieldName,
            value: v.value,
            label: v.label || v.value,
            sortOrder: i,
            color: v.color || null,
            isDefault: v.isDefault || false,
            isActive: true,
          },
        });
        picklistCount++;
      }
    }

    // Seed status workflows
    for (let i = 0; i < WORKFLOW_SEEDS.length; i++) {
      const w = WORKFLOW_SEEDS[i];
      await prisma.statusWorkflow.upsert({
        where: {
          pageId_fromStatus_toStatus: {
            pageId: w.pageId,
            fromStatus: w.fromStatus,
            toStatus: w.toStatus,
          },
        },
        update: {
          sortOrder: i,
          isActive: true,
        },
        create: {
          pageId: w.pageId,
          fromStatus: w.fromStatus,
          toStatus: w.toStatus,
          sortOrder: i,
          isActive: true,
        },
      });
      workflowCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${picklistCount} picklist values and ${workflowCount} status workflows`,
      picklistCount,
      workflowCount,
    });
  } catch (error) {
    console.error("Error seeding picklist values:", error);
    return NextResponse.json(
      { error: "Failed to seed picklist values" },
      { status: 500 }
    );
  }
}
