import { DetailPageDefinition } from "./types";

export const OPPORTUNITY_DETAIL: DetailPageDefinition = {
  pageId: "opportunities-detail",
  parentPageId: "opportunities",
  entityName: "Opportunity",
  fields: [
    { fieldName: "opportunityNumber", defaultLabel: "Opportunity #", type: "readonly", defaultLabelWidth: 110 },
    { fieldName: "name", defaultLabel: "Opportunity Name", type: "text", defaultLabelWidth: 120 },
    {
      fieldName: "type",
      defaultLabel: "Type",
      type: "dynamic-select",
      picklistPageId: "opportunities",
      picklistFieldName: "type",
      fallbackOptions: ["New Client", "Service Request", "Modernization", "New Installation", "Repair", "Other"],
      defaultLabelWidth: 80,
    },
    {
      fieldName: "stage",
      defaultLabel: "Stage",
      type: "dynamic-select",
      picklistPageId: "opportunities",
      picklistFieldName: "stage",
      fallbackOptions: ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"],
      defaultLabelWidth: 80,
    },
    { fieldName: "probability", defaultLabel: "Probability (%)", type: "number", defaultLabelWidth: 110 },
    { fieldName: "estimatedValue", defaultLabel: "Estimated Value", type: "currency", defaultLabelWidth: 110 },
    { fieldName: "expectedCloseDate", defaultLabel: "Expected Close", type: "date", defaultLabelWidth: 110 },
    { fieldName: "owner", defaultLabel: "Owner", type: "text", defaultLabelWidth: 80 },
    { fieldName: "description", defaultLabel: "Description", type: "textarea", defaultColSpan: 2 },
    { fieldName: "nextStep", defaultLabel: "Next Step", type: "textarea", defaultColSpan: 2 },
    { fieldName: "lostReason", defaultLabel: "Lost Reason", type: "text", defaultLabelWidth: 100 },
    { fieldName: "remarks", defaultLabel: "Remarks", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "details",
        label: "Details",
        visible: true,
        sections: [
          {
            id: "opp-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "opportunityNumber", label: "Opportunity #", column: 0, visible: true, readOnly: true, labelWidth: 110 },
              { fieldName: "name", label: "Opportunity Name", column: 0, visible: true, labelWidth: 120 },
              { fieldName: "type", label: "Type", column: 1, visible: true },
              { fieldName: "stage", label: "Stage", column: 1, visible: true },
              { fieldName: "probability", label: "Probability (%)", column: 1, visible: true, labelWidth: 110 },
              { fieldName: "estimatedValue", label: "Estimated Value", column: 0, visible: true, labelWidth: 110 },
              { fieldName: "expectedCloseDate", label: "Expected Close", column: 0, visible: true, labelWidth: 110 },
              { fieldName: "owner", label: "Owner", column: 1, visible: true },
            ],
          },
          {
            id: "opp-details",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "description", label: "Description", column: 0, visible: true, colSpan: 2 },
              { fieldName: "nextStep", label: "Next Step", column: 0, visible: true, colSpan: 2 },
              { fieldName: "lostReason", label: "Lost Reason", column: 0, visible: true },
              { fieldName: "remarks", label: "Remarks", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "proposals",
        label: "Proposals",
        visible: true,
        sections: [], // Custom content — proposals grid
      },
      {
        id: "activity",
        label: "Activity",
        visible: true,
        sections: [], // Custom content — activity log
      },
    ],
  },
};
