import { DetailPageDefinition } from "./types";

export const JOB_DETAIL: DetailPageDefinition = {
  pageId: "jobs-detail",
  parentPageId: "job-maintenance",
  entityName: "Job",
  fields: [
    // Header fields
    { fieldName: "externalId", defaultLabel: "Job #", type: "text", defaultLabelWidth: 64 },
    {
      fieldName: "template", defaultLabel: "Template", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "NEW REPAIRS", label: "NEW REPAIRS" },
        { value: "Inspection / Correction", label: "Inspection / Correction" },
        { value: "Annual 2026 Billable", label: "Annual 2026 Billable" },
        { value: "Annual 2026 Non-Billable", label: "Annual 2026 Non-Billable" },
        { value: "Filing Fee", label: "Filing Fee" },
      ],
    },
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "NEW REPAIR", label: "NEW REPAIR" },
        { value: "Other", label: "Other" },
        { value: "Annual", label: "Annual" },
        { value: "Violations", label: "Violations" },
        { value: "Maintenance", label: "Maintenance" },
        { value: "Modernization", label: "Modernization" },
        { value: "Repair", label: "Repair" },
      ],
    },
    {
      fieldName: "status", defaultLabel: "Status (S)", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Open", label: "Open" },
        { value: "Hold", label: "Hold" },
        { value: "Completed", label: "Completed" },
        { value: "Closed", label: "Closed" },
      ],
    },
    { fieldName: "jobDescription", defaultLabel: "Desc", type: "text", defaultLabelWidth: 64 },

    // Specifications tab
    {
      fieldName: "contractType", defaultLabel: "Contract Type", type: "select", defaultLabelWidth: 90,
      staticOptions: [
        { value: "REPAIR", label: "REPAIR" },
        { value: "SERVICE", label: "SERVICE" },
        { value: "MODERNIZATION", label: "MODERNIZATION" },
        { value: "INSPECTION", label: "INSPECTION" },
      ],
    },
    { fieldName: "date", defaultLabel: "Contract Date", type: "date", defaultLabelWidth: 90 },
    {
      fieldName: "level", defaultLabel: "Default Level", type: "select", defaultLabelWidth: 90,
      staticOptions: [
        { value: "6-Repairs", label: "6-Repairs" },
        { value: "5-Service", label: "5-Service" },
        { value: "4-Violations", label: "4-Violations" },
      ],
    },
    { fieldName: "scheduleDate", defaultLabel: "Estimated Date", type: "date", defaultLabelWidth: 90 },
    { fieldName: "dueDate", defaultLabel: "Due Date", type: "date", defaultLabelWidth: 90 },
    { fieldName: "chargeable", defaultLabel: "Chargeable", type: "checkbox", defaultLabelWidth: 90 },

    // Custom/Remarks tab
    { fieldName: "sRemarks", defaultLabel: "Remarks", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "specifications",
        label: "Specifications",
        visible: true,
        sections: [
          {
            id: "spec-general",
            label: "General",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "contractType", label: "Contract Type", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "date", label: "Contract Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "level", label: "Default Level", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "scheduleDate", label: "Estimated Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "dueDate", label: "Due Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "chargeable", label: "Chargeable", column: 1, visible: true, labelWidth: 90 },
            ],
          },
        ],
      },
      {
        id: "tfmCustom",
        label: "TFM Custom",
        visible: true,
        sections: [], // Custom content — TFM custom fields
      },
      {
        id: "jobBudgets",
        label: "Job Budgets",
        visible: true,
        sections: [], // Custom content — budget tables (readonly)
      },
      {
        id: "customRemarks",
        label: "Custom/Remarks",
        visible: true,
        sections: [
          {
            id: "remarks-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "sRemarks", label: "Remarks", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "wageCategories",
        label: "Wage Categories",
        visible: true,
        sections: [], // Custom content — wage categories grid
      },
      {
        id: "deductionCat",
        label: "Deduction Cat.",
        visible: true,
        sections: [], // Custom content — deduction categories grid
      },
      {
        id: "techAlert",
        label: "Tech Alert",
        visible: true,
        sections: [], // Custom content — tech alert textarea (not yet wired)
      },
    ],
  },
};
