import { DetailPageDefinition } from "./types";

export const JOB_RESULT_DETAIL: DetailPageDefinition = {
  pageId: "job-results-detail",
  parentPageId: "job-results",
  entityName: "Job Result",
  fields: [
    // Header fields (readonly)
    { fieldName: "externalId", defaultLabel: "Job #", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "type", defaultLabel: "Type", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "jobDescription", defaultLabel: "Desc", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "status", defaultLabel: "Status", type: "readonly", defaultLabelWidth: 64 },

    // Custom/Remarks tab
    { fieldName: "supervisor", defaultLabel: "Supervisor", type: "text", defaultLabelWidth: 80 },
    { fieldName: "cityNumber", defaultLabel: "City #", type: "text", defaultLabelWidth: 80 },
    { fieldName: "schedule", defaultLabel: "Schedule", type: "text", defaultLabelWidth: 80 },
    { fieldName: "billingTerms", defaultLabel: "Billing Terms", type: "text", defaultLabelWidth: 80 },
    { fieldName: "material", defaultLabel: "Material", type: "text", defaultLabelWidth: 80 },
    { fieldName: "paperless", defaultLabel: "Paperless", type: "text", defaultLabelWidth: 80 },
    { fieldName: "remarks", defaultLabel: "Remarks", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "summary",
        label: "1 Summary & Hours Worked",
        visible: true,
        sections: [], // Custom content — hours table + financial summary
      },
      {
        id: "costingDetail",
        label: "2 Job Costing Detail",
        visible: true,
        sections: [], // Custom content — costing breakdown table
      },
      {
        id: "costingItems",
        label: "3 Job Costing Items",
        visible: true,
        sections: [], // Custom content — costing items grid with filters
      },
      {
        id: "customRemarks",
        label: "4 Custom/Remarks",
        visible: true,
        sections: [
          {
            id: "custom-fields",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "supervisor", label: "Supervisor", column: 0, visible: true },
              { fieldName: "cityNumber", label: "City #", column: 0, visible: true },
              { fieldName: "schedule", label: "Schedule", column: 1, visible: true },
              { fieldName: "billingTerms", label: "Billing Terms", column: 1, visible: true },
              { fieldName: "material", label: "Material", column: 1, visible: true },
              { fieldName: "paperless", label: "Paperless", column: 1, visible: true },
            ],
          },
          {
            id: "remarks-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "remarks", label: "Remarks", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
    ],
  },
};
