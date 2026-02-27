import { DetailPageDefinition } from "./types";

export const ESTIMATE_DETAIL: DetailPageDefinition = {
  pageId: "estimates-detail",
  parentPageId: "estimates",
  entityName: "Estimate",
  fields: [
    { fieldName: "estimateNumber", defaultLabel: "Estimate #", type: "readonly", defaultLabelWidth: 80 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Draft", label: "Draft" },
        { value: "Sent", label: "Sent" },
        { value: "Accepted", label: "Accepted" },
        { value: "Rejected", label: "Rejected" },
        { value: "Expired", label: "Expired" },
      ],
    },
    { fieldName: "expirationDate", defaultLabel: "Expires", type: "date", defaultLabelWidth: 80 },
    {
      fieldName: "salesperson", defaultLabel: "Salesperson", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "John Smith", label: "John Smith" },
        { value: "Mike Johnson", label: "Mike Johnson" },
        { value: "Sarah Davis", label: "Sarah Davis" },
        { value: "Tom Wilson", label: "Tom Wilson" },
      ],
    },
    { fieldName: "probability", defaultLabel: "Probability", type: "number", defaultLabelWidth: 80 },
    { fieldName: "description", defaultLabel: "Description", type: "text", defaultLabelWidth: 80 },
    { fieldName: "taxRate", defaultLabel: "Tax Rate", type: "number", defaultLabelWidth: 80 },
    {
      fieldName: "terms", defaultLabel: "Terms", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Net 30", label: "Net 30" },
        { value: "Net 15", label: "Net 15" },
        { value: "Due on Receipt", label: "Due on Receipt" },
        { value: "50% Deposit", label: "50% Deposit" },
      ],
    },
    { fieldName: "notes", defaultLabel: "Internal Notes", type: "textarea", defaultColSpan: 2 },
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
            id: "estimate-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "estimateNumber", label: "Estimate #", column: 0, visible: true, readOnly: true },
              { fieldName: "status", label: "Status", column: 0, visible: true },
              { fieldName: "expirationDate", label: "Expires", column: 0, visible: true },
              { fieldName: "salesperson", label: "Salesperson", column: 0, visible: true },
              { fieldName: "probability", label: "Probability", column: 1, visible: true },
              { fieldName: "description", label: "Description", column: 1, visible: true },
              { fieldName: "taxRate", label: "Tax Rate", column: 1, visible: true },
              { fieldName: "terms", label: "Terms", column: 1, visible: true },
            ],
          },
        ],
      },
      {
        id: "lineItems",
        label: "Line Items",
        visible: true,
        sections: [], // Custom content — line items grid
      },
      {
        id: "notes",
        label: "Notes",
        visible: true,
        sections: [
          {
            id: "notes-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "notes", label: "Internal Notes", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "history",
        label: "History",
        visible: true,
        sections: [], // Custom content — history table
      },
    ],
  },
};
