import { DetailPageDefinition } from "./types";

export const QUOTE_DETAIL: DetailPageDefinition = {
  pageId: "quotes-detail",
  parentPageId: "quotes",
  entityName: "Quote",
  fields: [
    { fieldName: "quoteNumber", defaultLabel: "Quote Number", type: "readonly", defaultLabelWidth: 100 },
    { fieldName: "subject", defaultLabel: "Subject", type: "text", defaultLabelWidth: 80 },
    { fieldName: "description", defaultLabel: "Description", type: "textarea", defaultColSpan: 2 },
    { fieldName: "expirationDate", defaultLabel: "Expires", type: "date", defaultLabelWidth: 80 },
    {
      fieldName: "terms", defaultLabel: "Terms", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Net 30", label: "Net 30" },
        { value: "Net 15", label: "Net 15" },
        { value: "Net 45", label: "Net 45" },
        { value: "Net 60", label: "Net 60" },
        { value: "Due on receipt", label: "Due on receipt" },
      ],
    },
    { fieldName: "taxRate", defaultLabel: "Tax Rate", type: "number", defaultLabelWidth: 80 },
    { fieldName: "notes", defaultLabel: "Customer Notes", type: "textarea", defaultColSpan: 2 },
    { fieldName: "internalNotes", defaultLabel: "Internal Notes", type: "textarea", defaultColSpan: 2 },
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
            id: "quote-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "quoteNumber", label: "Quote Number", column: 0, visible: true, readOnly: true, labelWidth: 100 },
              { fieldName: "subject", label: "Subject", column: 0, visible: true },
              { fieldName: "expirationDate", label: "Expires", column: 1, visible: true },
              { fieldName: "taxRate", label: "Tax Rate", column: 1, visible: true },
            ],
          },
          {
            id: "quote-description",
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
        id: "lineItems",
        label: "Line Items",
        visible: true,
        sections: [], // Custom content — line items grid with CRUD
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
              { fieldName: "notes", label: "Customer Notes", column: 0, visible: true, colSpan: 2 },
              { fieldName: "internalNotes", label: "Internal Notes", column: 0, visible: true, colSpan: 2 },
              { fieldName: "terms", label: "Payment Terms", column: 0, visible: true },
            ],
          },
        ],
      },
      {
        id: "history",
        label: "History",
        visible: true,
        sections: [], // Custom content — history table (readonly)
      },
    ],
  },
};
