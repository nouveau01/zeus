import { DetailPageDefinition } from "./types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export const ACCOUNT_DETAIL: DetailPageDefinition = {
  pageId: "accounts-detail",
  parentPageId: "accounts",
  entityName: "Account",
  fields: [
    // General tab — left column (address info)
    { fieldName: "premisesId", defaultLabel: "ID", type: "text", defaultLabelWidth: 64 },
    { fieldName: "name", defaultLabel: "Tag", type: "text", defaultLabelWidth: 64 },
    { fieldName: "address", defaultLabel: "Address", type: "text", defaultLabelWidth: 64 },
    { fieldName: "city", defaultLabel: "City", type: "text", defaultLabelWidth: 64 },
    {
      fieldName: "state", defaultLabel: "State", type: "select", defaultLabelWidth: 64,
      staticOptions: US_STATES.map((s) => ({ value: s, label: s })),
    },
    { fieldName: "zipCode", defaultLabel: "Zip", type: "text", defaultLabelWidth: 64 },
    { fieldName: "country", defaultLabel: "Country", type: "text", defaultLabelWidth: 64 },

    // General tab — middle column (contact info)
    { fieldName: "contact", defaultLabel: "Contact", type: "text", defaultLabelWidth: 64 },
    { fieldName: "phone", defaultLabel: "Phone", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "fax", defaultLabel: "Fax", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "cellular", defaultLabel: "Cellular", type: "phone", defaultLabelWidth: 64 },
    { fieldName: "email", defaultLabel: "e-mail", type: "email", defaultLabelWidth: 64 },
    { fieldName: "website", defaultLabel: "Web Site", type: "url", defaultLabelWidth: 64 },

    // General tab — stats (readonly)
    {
      fieldName: "unitCount", defaultLabel: "# Units", type: "readonly", defaultLabelWidth: 80,
      valueGetter: (data) => data._count?.units || data.units?.length || 0,
    },
    { fieldName: "balance", defaultLabel: "Balance", type: "readonly", defaultLabelWidth: 80, format: "currency" },

    // Control tab
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "S", label: "S" },
        { value: "H", label: "H" },
        { value: "MOD", label: "MOD" },
        { value: "Resident Mech.", label: "Resident Mech." },
        { value: "Non-Contract", label: "Non-Contract" },
      ],
    },
    {
      fieldName: "isActive", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      valueGetter: (data) => (data.isActive ? "Active" : "Inactive"),
      staticOptions: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
      ],
    },

    // Custom tab fields
    { fieldName: "custom1", defaultLabel: "Custom1", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom2", defaultLabel: "Custom2", type: "text", defaultLabelWidth: 80 },
    { fieldName: "maint", defaultLabel: "Maint", type: "text", defaultLabelWidth: 80 },
    { fieldName: "billing", defaultLabel: "Billing", type: "text", defaultLabelWidth: 80 },

    // Remarks tab
    { fieldName: "remarks", defaultLabel: "Account Remarks", type: "textarea", defaultColSpan: 2 },
    { fieldName: "salesRemarks", defaultLabel: "Sales Remarks", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "general",
        label: "General",
        visible: true,
        sections: [
          {
            id: "general-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "premisesId", label: "ID", column: 0, visible: true },
              { fieldName: "name", label: "Tag", column: 0, visible: true },
              { fieldName: "address", label: "Address", column: 0, visible: true },
              { fieldName: "city", label: "City", column: 0, visible: true },
              { fieldName: "state", label: "State", column: 0, visible: true },
              { fieldName: "zipCode", label: "Zip", column: 0, visible: true },
              { fieldName: "country", label: "Country", column: 0, visible: true },
              { fieldName: "contact", label: "Contact", column: 1, visible: true },
              { fieldName: "phone", label: "Phone", column: 1, visible: true },
              { fieldName: "fax", label: "Fax", column: 1, visible: true },
              { fieldName: "cellular", label: "Cellular", column: 1, visible: true },
              { fieldName: "email", label: "e-mail", column: 1, visible: true },
              { fieldName: "website", label: "Web Site", column: 1, visible: true },
            ],
          },
          {
            id: "general-stats",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "unitCount", label: "# Units", column: 0, visible: true, readOnly: true, labelWidth: 80 },
              { fieldName: "balance", label: "Balance", column: 1, visible: true, readOnly: true, labelWidth: 80 },
            ],
          },
        ],
      },
      {
        id: "billing",
        label: "Billing",
        visible: true,
        sections: [], // Custom content — billing address + parts markup table
      },
      {
        id: "control",
        label: "Control",
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
            ],
          },
        ],
      },
      {
        id: "custom",
        label: "Custom",
        visible: true,
        sections: [
          {
            id: "custom-fields",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "custom1", label: "Custom1", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "custom2", label: "Custom2", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "maint", label: "Maint", column: 1, visible: true, labelWidth: 80 },
              { fieldName: "billing", label: "Billing", column: 1, visible: true, labelWidth: 80 },
            ],
          },
        ],
      },
      {
        id: "pmContracts",
        label: "PM Contracts",
        visible: true,
        sections: [], // Custom content — PM contracts grid with CRUD
      },
      {
        id: "contacts",
        label: "Contacts",
        visible: true,
        sections: [], // Custom content — contacts grid with CRUD
      },
      {
        id: "remarks",
        label: "Remarks",
        visible: true,
        sections: [
          {
            id: "remarks-content",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "remarks", label: "Account Remarks", column: 0, visible: true, colSpan: 2 },
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
              { fieldName: "salesRemarks", label: "Sales Remarks", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
    ],
  },
};
