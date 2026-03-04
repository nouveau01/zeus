import { DetailPageDefinition } from "./types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export const VENDOR_DETAIL: DetailPageDefinition = {
  pageId: "vendors-detail",
  parentPageId: "vendors",
  entityName: "Vendor",
  fields: [
    // General tab — left column
    { fieldName: "vendorId", defaultLabel: "ID #", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "name", defaultLabel: "Name", type: "text", defaultLabelWidth: 64 },
    { fieldName: "address", defaultLabel: "Address", type: "textarea", defaultLabelWidth: 64 },
    { fieldName: "city", defaultLabel: "City", type: "text", defaultLabelWidth: 64 },
    {
      fieldName: "state", defaultLabel: "State", type: "select", defaultLabelWidth: 64,
      staticOptions: US_STATES.map((s) => ({ value: s, label: s })),
    },
    { fieldName: "zip", defaultLabel: "Zip", type: "text", defaultLabelWidth: 64 },
    { fieldName: "country", defaultLabel: "Country", type: "text", defaultLabelWidth: 64 },

    // General tab — right column
    { fieldName: "contact", defaultLabel: "Contact", type: "text", defaultLabelWidth: 64 },
    { fieldName: "phone", defaultLabel: "Phone", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "fax", defaultLabel: "Fax", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "cellular", defaultLabel: "Cellular", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "email", defaultLabel: "e-mail", type: "email", defaultLabelWidth: 64 },
    { fieldName: "webSite", defaultLabel: "Web Site", type: "url", defaultLabelWidth: 64 },
    { fieldName: "remitTo", defaultLabel: "Remit To", type: "textarea", defaultLabelWidth: 64 },

    // Control tab — left column
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Cost of Sales", label: "Cost of Sales" },
        { value: "Overhead", label: "Overhead" },
      ],
    },
    { fieldName: "creditLimit", defaultLabel: "Credit Limit", type: "currency", defaultLabelWidth: 80, format: "currency" },
    { fieldName: "is1099", defaultLabel: "1099", type: "checkbox", defaultLabelWidth: 80 },
    { fieldName: "box1099", defaultLabel: "1099 Box", type: "number", defaultLabelWidth: 80 },
    { fieldName: "is1099MISC", defaultLabel: "1099 MISC", type: "checkbox", defaultLabelWidth: 80 },
    { fieldName: "is1099NEC", defaultLabel: "1099 NEC", type: "checkbox", defaultLabelWidth: 80 },
    { fieldName: "fedId", defaultLabel: "Fed ID#", type: "text", defaultLabelWidth: 80 },
    { fieldName: "acctNumber", defaultLabel: "Acct #", type: "text", defaultLabelWidth: 80 },
    { fieldName: "balance", defaultLabel: "Balance", type: "readonly", defaultLabelWidth: 80, format: "currency" },

    // Control tab — right column
    { fieldName: "shipVia", defaultLabel: "Ship Via", type: "text", defaultLabelWidth: 80 },
    {
      fieldName: "defaultAcct", defaultLabel: "Default Acct", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "OTHER INCOME & EXPENSES", label: "OTHER INCOME & EXPENSES" },
        { value: "COST OF GOODS SOLD", label: "COST OF GOODS SOLD" },
        { value: "OPERATING EXPENSES", label: "OPERATING EXPENSES" },
      ],
    },
    {
      fieldName: "payStyle", defaultLabel: "Pay Style", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Normal", label: "Normal" },
        { value: "Hold", label: "Hold" },
        { value: "Priority", label: "Priority" },
      ],
    },
    {
      fieldName: "desiredBank", defaultLabel: "Desired Bank", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Chase", label: "Chase" },
        { value: "Bank of America", label: "Bank of America" },
        { value: "Wells Fargo", label: "Wells Fargo" },
      ],
    },
    {
      fieldName: "terms", defaultLabel: "Terms", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Upon Receipt", label: "Upon Receipt" },
        { value: "Net 10 Days", label: "Net 10 Days" },
        { value: "Net 15 Days", label: "Net 15 Days" },
        { value: "Net 30 Days", label: "Net 30 Days" },
        { value: "Net 45 Days", label: "Net 45 Days" },
        { value: "Net 60 Days", label: "Net 60 Days" },
      ],
    },
    { fieldName: "discount", defaultLabel: "Discount", type: "number", defaultLabelWidth: 80 },
    { fieldName: "ifPaidIn", defaultLabel: "If Paid In", type: "number", defaultLabelWidth: 80 },

    // Custom tab
    { fieldName: "custom1", defaultLabel: "Custom1", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom2", defaultLabel: "Custom2", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom3", defaultLabel: "Custom3", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom4", defaultLabel: "Custom4", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom5", defaultLabel: "Custom5", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom6", defaultLabel: "Custom6", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom7", defaultLabel: "Custom7", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom8", defaultLabel: "Custom8", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom9", defaultLabel: "Custom9", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom10", defaultLabel: "Custom10", type: "text", defaultLabelWidth: 80 },
    { fieldName: "notes", defaultLabel: "Notes", type: "textarea", defaultColSpan: 2 },

    // ACH tab
    { fieldName: "bankAccountNumber", defaultLabel: "Bank Account #", type: "text", defaultLabelWidth: 100 },
    { fieldName: "bankRouteNumber", defaultLabel: "Bank Route #", type: "text", defaultLabelWidth: 100 },
    {
      fieldName: "bankAcctType", defaultLabel: "Bank Acct Type", type: "select", defaultLabelWidth: 100,
      staticOptions: [
        { value: "Checking", label: "Checking" },
        { value: "Savings", label: "Savings" },
      ],
    },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "general",
        label: "1 General",
        visible: true,
        sections: [
          {
            id: "general-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "vendorId", label: "ID #", column: 0, visible: true, readOnly: true },
              { fieldName: "name", label: "Name", column: 0, visible: true, required: true },
              { fieldName: "address", label: "Address", column: 0, visible: true },
              { fieldName: "city", label: "City", column: 0, visible: true },
              { fieldName: "state", label: "State", column: 0, visible: true },
              { fieldName: "zip", label: "Zip", column: 0, visible: true },
              { fieldName: "country", label: "Country", column: 0, visible: true },
              { fieldName: "contact", label: "Contact", column: 1, visible: true },
              { fieldName: "phone", label: "Phone", column: 1, visible: true },
              { fieldName: "fax", label: "Fax", column: 1, visible: true },
              { fieldName: "cellular", label: "Cellular", column: 1, visible: true },
              { fieldName: "email", label: "e-mail", column: 1, visible: true },
              { fieldName: "webSite", label: "Web Site", column: 1, visible: true },
              { fieldName: "remitTo", label: "Remit To", column: 1, visible: true },
            ],
          },
        ],
      },
      {
        id: "control",
        label: "2 Control",
        visible: true,
        sections: [
          {
            id: "control-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "status", label: "Status", column: 0, visible: true },
              { fieldName: "type", label: "Type", column: 0, visible: true },
              { fieldName: "creditLimit", label: "Credit Limit", column: 0, visible: true },
              { fieldName: "is1099", label: "1099", column: 0, visible: true },
              { fieldName: "box1099", label: "1099 Box", column: 0, visible: true },
              { fieldName: "is1099MISC", label: "1099 MISC", column: 0, visible: true },
              { fieldName: "is1099NEC", label: "1099 NEC", column: 0, visible: true },
              { fieldName: "fedId", label: "Fed ID#", column: 0, visible: true },
              { fieldName: "acctNumber", label: "Acct #", column: 0, visible: true },
              { fieldName: "balance", label: "Balance", column: 0, visible: true, readOnly: true },
              { fieldName: "shipVia", label: "Ship Via", column: 1, visible: true },
              { fieldName: "defaultAcct", label: "Default Acct", column: 1, visible: true },
              { fieldName: "payStyle", label: "Pay Style", column: 1, visible: true },
              { fieldName: "desiredBank", label: "Desired Bank", column: 1, visible: true },
              { fieldName: "terms", label: "Terms", column: 1, visible: true },
              { fieldName: "discount", label: "Discount", column: 1, visible: true },
              { fieldName: "ifPaidIn", label: "If Paid In", column: 1, visible: true },
            ],
          },
        ],
      },
      {
        id: "contacts",
        label: "3 Contacts",
        visible: true,
        sections: [], // Custom content — contacts grid with CRUD
      },
      {
        id: "custom",
        label: "4 Custom",
        visible: true,
        sections: [
          {
            id: "custom-fields",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "custom1", label: "Custom1", column: 0, visible: true },
              { fieldName: "custom2", label: "Custom2", column: 0, visible: true },
              { fieldName: "custom3", label: "Custom3", column: 0, visible: true },
              { fieldName: "custom4", label: "Custom4", column: 0, visible: true },
              { fieldName: "custom5", label: "Custom5", column: 0, visible: true },
              { fieldName: "custom6", label: "Custom6", column: 1, visible: true },
              { fieldName: "custom7", label: "Custom7", column: 1, visible: true },
              { fieldName: "custom8", label: "Custom8", column: 1, visible: true },
              { fieldName: "custom9", label: "Custom9", column: 1, visible: true },
              { fieldName: "custom10", label: "Custom10", column: 1, visible: true },
            ],
          },
          {
            id: "custom-notes",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "notes", label: "Notes", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "ach",
        label: "5 ACH",
        visible: true,
        sections: [
          {
            id: "ach-info",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "bankAccountNumber", label: "Bank Account #", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "bankRouteNumber", label: "Bank Route #", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "bankAcctType", label: "Bank Acct Type", column: 0, visible: true, labelWidth: 100 },
            ],
          },
        ],
      },
    ],
  },
};
