import { DetailPageDefinition } from "./types";

export const INVOICE_DETAIL: DetailPageDefinition = {
  pageId: "invoices-detail",
  parentPageId: "invoices",
  entityName: "Invoice",
  fields: [
    // General tab fields
    { fieldName: "postingDate", defaultLabel: "Posting", type: "date", defaultLabelWidth: 64 },
    { fieldName: "date", defaultLabel: "Date", type: "date", defaultLabelWidth: 64 },
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Other", label: "Other" },
        { value: "Maintenance", label: "Maintenance" },
        { value: "Modernization", label: "Modernization" },
        { value: "Repair", label: "Repair" },
      ],
    },
    {
      fieldName: "terms", defaultLabel: "Terms", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Net 30 Days", label: "Net 30 Days" },
        { value: "Net 45 Days", label: "Net 45 Days" },
        { value: "Net 60 Days", label: "Net 60 Days" },
        { value: "Due on Receipt", label: "Due on Receipt" },
      ],
    },
    {
      fieldName: "priceLevel", defaultLabel: "Inv. Price", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Price Level", label: "Price Level" },
        { value: "Standard", label: "Standard" },
        { value: "Premium", label: "Premium" },
        { value: "Discount", label: "Discount" },
      ],
    },
    { fieldName: "poNumber", defaultLabel: "PO #", type: "text", defaultLabelWidth: 64 },
    { fieldName: "mechSales", defaultLabel: "Mech/Sales", type: "text", defaultLabelWidth: 64 },
    { fieldName: "creditReq", defaultLabel: "Credit Req", type: "text", defaultLabelWidth: 64 },
    { fieldName: "status", defaultLabel: "Status", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "backup", defaultLabel: "Backup", type: "text", defaultLabelWidth: 64 },
    { fieldName: "description", defaultLabel: "Invoice Description", type: "textarea", defaultColSpan: 2 },

    // Taxes/Job Remarks tab
    { fieldName: "taxRegion1", defaultLabel: "Tax Region 1", type: "text", defaultLabelWidth: 80 },
    { fieldName: "taxRate1", defaultLabel: "Tax Rate 1", type: "number", defaultLabelWidth: 80 },
    { fieldName: "taxRegion2", defaultLabel: "Tax Region 2", type: "text", defaultLabelWidth: 80 },
    { fieldName: "taxRate2", defaultLabel: "Tax Rate 2", type: "number", defaultLabelWidth: 80 },
    { fieldName: "taxFactor", defaultLabel: "Tax Factor", type: "number", defaultLabelWidth: 80 },
    { fieldName: "jobRemarks", defaultLabel: "Job Remarks", type: "textarea", defaultColSpan: 2 },

    // Labor hours
    { fieldName: "reg", defaultLabel: "Reg", type: "number", defaultLabelWidth: 40 },
    { fieldName: "ot", defaultLabel: "OT", type: "number", defaultLabelWidth: 40 },
    { fieldName: "ot17", defaultLabel: "1.7", type: "number", defaultLabelWidth: 40 },
    { fieldName: "dt", defaultLabel: "DT", type: "number", defaultLabelWidth: 40 },
    { fieldName: "tt", defaultLabel: "TT", type: "number", defaultLabelWidth: 40 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "general",
        label: "Account/General",
        visible: true,
        sections: [
          {
            id: "general-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "postingDate", label: "Posting", column: 0, visible: true },
              { fieldName: "date", label: "Date", column: 0, visible: true },
              { fieldName: "type", label: "Type", column: 0, visible: true },
              { fieldName: "terms", label: "Terms", column: 0, visible: true },
              { fieldName: "priceLevel", label: "Inv. Price", column: 0, visible: true },
              { fieldName: "poNumber", label: "PO #", column: 1, visible: true },
              { fieldName: "mechSales", label: "Mech/Sales", column: 1, visible: true },
              { fieldName: "creditReq", label: "Credit Req", column: 1, visible: true },
              { fieldName: "status", label: "Status", column: 1, visible: true, readOnly: true },
              { fieldName: "backup", label: "Backup", column: 1, visible: true },
            ],
          },
          {
            id: "general-description",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "description", label: "Invoice Description", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "taxes",
        label: "Taxes/Job Remarks",
        visible: true,
        sections: [
          {
            id: "tax-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "taxRegion1", label: "Tax Region 1", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "taxRate1", label: "Tax Rate 1", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "taxRegion2", label: "Tax Region 2", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "taxRate2", label: "Tax Rate 2", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "taxFactor", label: "Tax Factor", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "reg", label: "Reg", column: 1, visible: true, labelWidth: 40 },
              { fieldName: "ot", label: "OT", column: 1, visible: true, labelWidth: 40 },
              { fieldName: "ot17", label: "1.7", column: 1, visible: true, labelWidth: 40 },
              { fieldName: "dt", label: "DT", column: 1, visible: true, labelWidth: 40 },
              { fieldName: "tt", label: "TT", column: 1, visible: true, labelWidth: 40 },
            ],
          },
          {
            id: "job-remarks",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "jobRemarks", label: "Job Remarks", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
    ],
  },
};
