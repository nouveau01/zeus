import { DetailPageDefinition } from "./types";

export const JOURNAL_ENTRY_DETAIL: DetailPageDefinition = {
  pageId: "purchase-journal-detail",
  parentPageId: "purchase-journal",
  entityName: "Journal Entry",
  fields: [
    { fieldName: "refNumber", defaultLabel: "Ref #", type: "text", defaultLabelWidth: 64 },
    { fieldName: "postingDate", defaultLabel: "Posting", type: "date", defaultLabelWidth: 64 },
    { fieldName: "date", defaultLabel: "Date", type: "date", defaultLabelWidth: 64 },
    { fieldName: "dueDate", defaultLabel: "Due", type: "date", defaultLabelWidth: 64 },
    { fieldName: "dueIn", defaultLabel: "Due In", type: "number", defaultLabelWidth: 64 },
    { fieldName: "discPercent", defaultLabel: "% Disc", type: "number", defaultLabelWidth: 64 },
    { fieldName: "ifPaidIn", defaultLabel: "If Paid In", type: "number", defaultLabelWidth: 64 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Verified", label: "Verified" },
        { value: "Open", label: "Open" },
        { value: "Closed", label: "Closed" },
        { value: "Void", label: "Void" },
      ],
    },
    { fieldName: "poNumber", defaultLabel: "PO #", type: "text", defaultLabelWidth: 64 },
    { fieldName: "custom1", defaultLabel: "Custom1", type: "text", defaultLabelWidth: 64 },
    { fieldName: "custom2", defaultLabel: "Custom2", type: "text", defaultLabelWidth: 64 },
    { fieldName: "description", defaultLabel: "Description", type: "textarea", defaultColSpan: 2 },
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
            id: "journal-header",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "refNumber", label: "Ref #", column: 0, visible: true },
              { fieldName: "postingDate", label: "Posting", column: 0, visible: true },
              { fieldName: "date", label: "Date", column: 0, visible: true },
              { fieldName: "dueDate", label: "Due", column: 0, visible: true },
              { fieldName: "status", label: "Status", column: 1, visible: true },
              { fieldName: "poNumber", label: "PO #", column: 1, visible: true },
              { fieldName: "dueIn", label: "Due In", column: 1, visible: true },
              { fieldName: "discPercent", label: "% Disc", column: 1, visible: true },
              { fieldName: "ifPaidIn", label: "If Paid In", column: 1, visible: true },
              { fieldName: "custom1", label: "Custom1", column: 1, visible: true },
              { fieldName: "custom2", label: "Custom2", column: 1, visible: true },
            ],
          },
          {
            id: "journal-description",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "description", label: "Description", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "glItems",
        label: "GL Items",
        visible: true,
        sections: [], // Custom content — GL items grid
      },
      {
        id: "jobCostingItems",
        label: "Job Costing",
        visible: true,
        sections: [], // Custom content — job costing items grid
      },
      {
        id: "inventoryItems",
        label: "Inventory",
        visible: true,
        sections: [], // Custom content — inventory items grid
      },
    ],
  },
};
