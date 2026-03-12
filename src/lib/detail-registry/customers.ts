import { DetailPageDefinition } from "./types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export const CUSTOMER_DETAIL: DetailPageDefinition = {
  pageId: "customers-detail",
  parentPageId: "customers",
  entityName: "Customer",
  grids: {
    "account-listing": [
      { fieldName: "premisesId", defaultLabel: "ID", defaultWidth: "10%", defaultVisible: true },
      { fieldName: "name", defaultLabel: "Tag", defaultWidth: "25%", defaultVisible: true },
      { fieldName: "city", defaultLabel: "City", defaultWidth: "12%", defaultVisible: true },
      { fieldName: "type", defaultLabel: "Type", defaultWidth: "12%", defaultVisible: true },
      { fieldName: "isActive", defaultLabel: "Status", defaultWidth: "8%", defaultVisible: true },
      { fieldName: "unitCount", defaultLabel: "# Units", defaultWidth: "8%", defaultVisible: true, align: "center" },
      { fieldName: "balance", defaultLabel: "Balance", defaultWidth: "12%", defaultVisible: true, format: "currency", align: "right" },
      // Additional available columns (hidden by default)
      { fieldName: "address", defaultLabel: "Address", defaultWidth: "20%", defaultVisible: false },
      { fieldName: "state", defaultLabel: "State", defaultWidth: "6%", defaultVisible: false },
      { fieldName: "zipCode", defaultLabel: "Zip", defaultWidth: "8%", defaultVisible: false },
      { fieldName: "phone", defaultLabel: "Phone", defaultWidth: "12%", defaultVisible: false },
      { fieldName: "email", defaultLabel: "Email", defaultWidth: "15%", defaultVisible: false },
      { fieldName: "route", defaultLabel: "Route", defaultWidth: "8%", defaultVisible: false },
      { fieldName: "zone", defaultLabel: "Zone", defaultWidth: "8%", defaultVisible: false },
      { fieldName: "contact", defaultLabel: "Contact", defaultWidth: "15%", defaultVisible: false },
      { fieldName: "fax", defaultLabel: "Fax", defaultWidth: "12%", defaultVisible: false },
    ],
  },
  fields: [
    // General tab fields
    { fieldName: "name", defaultLabel: "Name", type: "text", defaultLabelWidth: 64 },
    { fieldName: "address", defaultLabel: "Address", type: "text", defaultLabelWidth: 64 },
    { fieldName: "city", defaultLabel: "City", type: "text", defaultLabelWidth: 64 },
    {
      fieldName: "state", defaultLabel: "State", type: "select", defaultLabelWidth: 64,
      staticOptions: US_STATES.map((s) => ({ value: s, label: s })),
    },
    { fieldName: "zipCode", defaultLabel: "Zip", type: "text", defaultLabelWidth: 64 },
    { fieldName: "country", defaultLabel: "Country", type: "text", defaultLabelWidth: 64 },
    {
      fieldName: "contact", defaultLabel: "Primary Contact", type: "autocomplete", defaultLabelWidth: 96,
      autocompleteConfig: { searchType: "contacts", filterField: "customerId" },
    },
    { fieldName: "phone", defaultLabel: "Phone", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "fax", defaultLabel: "Fax", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "cellular", defaultLabel: "Cellular", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "email", defaultLabel: "e-mail", type: "email", defaultLabelWidth: 64 },
    { fieldName: "website", defaultLabel: "Web Site", type: "url", defaultLabelWidth: 64 },

    // Control tab fields
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "General", label: "General" },
        { value: "Commercial", label: "Commercial" },
        { value: "Bank", label: "Bank" },
        { value: "Churches", label: "Churches" },
        { value: "Clubs", label: "Clubs" },
        { value: "Property Manage", label: "Property Manage" },
      ],
    },
    {
      fieldName: "isActive", defaultLabel: "Status", type: "select", defaultLabelWidth: 64,
      valueGetter: (data) => (data.isActive ? "Active" : "Inactive"),
      staticOptions: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },
    {
      fieldName: "billing", defaultLabel: "Billing", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "Individual", label: "Individual" },
        { value: "Consolidated", label: "Consolidated" },
        { value: "Corporate", label: "Corporate" },
      ],
    },
    { fieldName: "custom1", defaultLabel: "Custom1", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom2", defaultLabel: "Custom2", type: "text", defaultLabelWidth: 80 },
    {
      fieldName: "accountCount", defaultLabel: "# Accounts", type: "readonly", defaultLabelWidth: 80,
      valueGetter: (data) => data.premises?.length || 0,
    },
    {
      fieldName: "unitCount", defaultLabel: "# Units", type: "readonly", defaultLabelWidth: 80,
      valueGetter: (data) =>
        data.premises?.reduce((sum: number, p: any) => sum + (p._count?.units || 0), 0) || 0,
    },
    { fieldName: "balance", defaultLabel: "Balance", type: "readonly", defaultLabelWidth: 80, format: "currency" },

    // Portal tab
    {
      fieldName: "portalAccess", defaultLabel: "Portal Access", type: "select", defaultLabelWidth: 96,
      valueGetter: (data) => (data.portalAccess ? "Yes" : "No"),
      staticOptions: [
        { value: "No", label: "No" },
        { value: "Yes", label: "Yes" },
      ],
    },

    // Remarks tab
    { fieldName: "remarks", defaultLabel: "", type: "textarea", defaultColSpan: 2 },
    { fieldName: "currentYearSales", defaultLabel: "Current Year Sales", type: "currency", defaultLabelWidth: 120, format: "currency" },
    { fieldName: "priorYearSales", defaultLabel: "Prior Year Sales", type: "currency", defaultLabelWidth: 120, format: "currency" },

    // Sales Remarks tab
    { fieldName: "salesRemarks", defaultLabel: "", type: "textarea", defaultColSpan: 2 },
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
              { fieldName: "name", label: "Name", column: 0, visible: true, required: true },
              { fieldName: "address", label: "Address", column: 0, visible: true },
              { fieldName: "city", label: "City", column: 0, visible: true },
              { fieldName: "state", label: "State", column: 0, visible: true },
              { fieldName: "zipCode", label: "Zip", column: 0, visible: true },
              { fieldName: "country", label: "Country", column: 0, visible: true },
              { fieldName: "contact", label: "Primary Contact", column: 1, visible: true, labelWidth: 96 },
              { fieldName: "phone", label: "Phone", column: 1, visible: true },
              { fieldName: "fax", label: "Fax", column: 1, visible: true },
              { fieldName: "cellular", label: "Cellular", column: 1, visible: true },
              { fieldName: "email", label: "e-mail", column: 1, visible: true },
              { fieldName: "website", label: "Web Site", column: 1, visible: true },
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
              { fieldName: "type", label: "Type", column: 0, visible: true },
              { fieldName: "isActive", label: "Status", column: 0, visible: true },
              { fieldName: "billing", label: "Billing", column: 0, visible: true },
              { fieldName: "custom1", label: "Custom1", column: 1, visible: true, labelWidth: 80 },
              { fieldName: "custom2", label: "Custom2", column: 1, visible: true, labelWidth: 80 },
              { fieldName: "accountCount", label: "# Accounts", column: 1, visible: true, readOnly: true, labelWidth: 80 },
              { fieldName: "unitCount", label: "# Units", column: 1, visible: true, readOnly: true, labelWidth: 80 },
              { fieldName: "balance", label: "Balance", column: 1, visible: true, readOnly: true, labelWidth: 80 },
            ],
          },
        ],
      },
      {
        id: "contacts",
        label: "3 Contacts",
        visible: true,
        sections: [], // Custom content — contacts grid rendered by page
      },
      {
        id: "portal",
        label: "4 Portal",
        visible: true,
        sections: [
          {
            id: "portal-info",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "portalAccess", label: "Portal Access", column: 0, visible: true, labelWidth: 96 },
            ],
          },
        ],
      },
      {
        id: "remarks",
        label: "5 Remarks",
        visible: true,
        sections: [
          {
            id: "remarks-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "remarks", label: "", column: 0, visible: true, colSpan: 2 },
            ],
          },
          {
            id: "remarks-sales",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "currentYearSales", label: "Current Year Sales", column: 0, visible: true, labelWidth: 120 },
              { fieldName: "priorYearSales", label: "Prior Year Sales", column: 1, visible: true, labelWidth: 120 },
            ],
          },
        ],
      },
      {
        id: "salesRemarks",
        label: "Sales Remarks",
        visible: true,
        sections: [
          {
            id: "sales-remarks-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "salesRemarks", label: "", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
    ],
  },
};
