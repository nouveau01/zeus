import { DetailPageDefinition } from "./types";

export const UNIT_DETAIL: DetailPageDefinition = {
  pageId: "units-detail",
  parentPageId: "units",
  entityName: "Unit",
  fields: [
    // General tab — left column
    { fieldName: "unitNumber", defaultLabel: "Unit #", type: "text", defaultLabelWidth: 80 },
    { fieldName: "description", defaultLabel: "Description", type: "text", defaultLabelWidth: 80 },
    { fieldName: "stateNumber", defaultLabel: "State #", type: "text", defaultLabelWidth: 80 },
    {
      fieldName: "template", defaultLabel: "Template", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Standard", label: "Standard" },
        { value: "Hydraulic", label: "Hydraulic" },
        { value: "Traction", label: "Traction" },
        { value: "MRL", label: "MRL" },
        { value: "Freight", label: "Freight" },
      ],
    },
    {
      fieldName: "category", defaultLabel: "Category", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "CONSULTANT", label: "CONSULTANT" },
        { value: "N/A", label: "N/A" },
        { value: "Other", label: "Other" },
        { value: "Private", label: "Private" },
        { value: "Public", label: "Public" },
        { value: "Service", label: "Service" },
      ],
    },
    {
      fieldName: "type", defaultLabel: "Type", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Elevator", label: "Elevator" },
        { value: "Hydraulic", label: "Hydraulic" },
        { value: "Service", label: "Service" },
        { value: "Escalator", label: "Escalator" },
        { value: "Dumbwaiter", label: "Dumbwaiter" },
      ],
    },
    {
      fieldName: "building", defaultLabel: "Building", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Hospital", label: "Hospital" },
        { value: "Office / Commercial", label: "Office / Commercial" },
        { value: "Store / Retail", label: "Store / Retail" },
        { value: "School", label: "School" },
        { value: "Residential", label: "Residential" },
        { value: "Other", label: "Other" },
      ],
    },

    // General tab — right column
    { fieldName: "accountTag", defaultLabel: "Account", type: "readonly", defaultLabelWidth: 80 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
        { value: "Pending", label: "Pending" },
        { value: "On Hold", label: "On Hold" },
      ],
    },
    {
      fieldName: "group", defaultLabel: "Group", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "", label: "" },
        { value: "Group A", label: "Group A" },
        { value: "Group B", label: "Group B" },
      ],
    },
    { fieldName: "onServiceSince", defaultLabel: "On Service Since", type: "date", defaultLabelWidth: 100 },
    { fieldName: "lastServiceOn", defaultLabel: "Last Service On", type: "date", defaultLabelWidth: 100 },
    { fieldName: "installed", defaultLabel: "Installed", type: "date", defaultLabelWidth: 100 },
    { fieldName: "installedBy", defaultLabel: "Installed By", type: "text", defaultLabelWidth: 100 },
    { fieldName: "manufacturer", defaultLabel: "Manufacturer", type: "text", defaultLabelWidth: 100 },
    { fieldName: "serialNumber", defaultLabel: "Serial Number", type: "text", defaultLabelWidth: 100 },
    { fieldName: "priceS", defaultLabel: "Price (S)", type: "currency", defaultLabelWidth: 100, format: "currency" },
    { fieldName: "week", defaultLabel: "Week", type: "text", defaultLabelWidth: 100 },

    // Unit Custom tab — left column (custom1-10)
    { fieldName: "testIncluded", defaultLabel: "Test Included", type: "text", defaultLabelWidth: 100 },
    { fieldName: "testCustomPricing", defaultLabel: "Test Custom Pricing", type: "text", defaultLabelWidth: 120 },
    { fieldName: "custom3", defaultLabel: "Custom3", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom4", defaultLabel: "Custom4", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom5", defaultLabel: "Custom5", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom6", defaultLabel: "Custom6", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom7", defaultLabel: "Custom7", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom8", defaultLabel: "Custom8", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom9", defaultLabel: "Custom9", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom10", defaultLabel: "Custom10", type: "text", defaultLabelWidth: 80 },

    // Unit Custom tab — right column (custom11-20)
    { fieldName: "custom11", defaultLabel: "Custom11", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom12", defaultLabel: "Custom12", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom13", defaultLabel: "Custom13", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom14", defaultLabel: "Custom14", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom15", defaultLabel: "Custom15", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom16", defaultLabel: "Custom16", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom17", defaultLabel: "Custom17", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom18", defaultLabel: "Custom18", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom19", defaultLabel: "Custom19", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom20", defaultLabel: "Custom20", type: "text", defaultLabelWidth: 80 },

    // Remarks tab
    { fieldName: "remarks", defaultLabel: "", type: "textarea", defaultColSpan: 2 },
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
              { fieldName: "unitNumber", label: "Unit #", column: 0, visible: true, required: true },
              { fieldName: "description", label: "Description", column: 0, visible: true },
              { fieldName: "stateNumber", label: "State #", column: 0, visible: true },
              { fieldName: "template", label: "Template", column: 0, visible: true },
              { fieldName: "category", label: "Category", column: 0, visible: true },
              { fieldName: "type", label: "Type", column: 0, visible: true },
              { fieldName: "building", label: "Building", column: 0, visible: true },
              { fieldName: "accountTag", label: "Account", column: 1, visible: true, readOnly: true },
              { fieldName: "status", label: "Status", column: 1, visible: true },
              { fieldName: "group", label: "Group", column: 1, visible: true },
              { fieldName: "onServiceSince", label: "On Service Since", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "lastServiceOn", label: "Last Service On", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "installed", label: "Installed", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "installedBy", label: "Installed By", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "manufacturer", label: "Manufacturer", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "serialNumber", label: "Serial Number", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "priceS", label: "Price (S)", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "week", label: "Week", column: 1, visible: true, labelWidth: 100 },
            ],
          },
        ],
      },
      {
        id: "templateCustom",
        label: "Template Custom",
        visible: true,
        sections: [], // Custom content — dynamic template fields grid
      },
      {
        id: "tests",
        label: "Tests",
        visible: true,
        sections: [], // Custom content — tests grid with CRUD
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
              { fieldName: "remarks", label: "", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "unitCustom",
        label: "Unit Custom",
        visible: true,
        sections: [
          {
            id: "unit-custom-fields",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "testIncluded", label: "Test Included", column: 0, visible: true, labelWidth: 120 },
              { fieldName: "testCustomPricing", label: "Test Custom Pricing", column: 0, visible: true, labelWidth: 120 },
              { fieldName: "custom3", label: "Custom3", column: 0, visible: true },
              { fieldName: "custom4", label: "Custom4", column: 0, visible: true },
              { fieldName: "custom5", label: "Custom5", column: 0, visible: true },
              { fieldName: "custom6", label: "Custom6", column: 0, visible: true },
              { fieldName: "custom7", label: "Custom7", column: 0, visible: true },
              { fieldName: "custom8", label: "Custom8", column: 0, visible: true },
              { fieldName: "custom9", label: "Custom9", column: 0, visible: true },
              { fieldName: "custom10", label: "Custom10", column: 0, visible: true },
              { fieldName: "custom11", label: "Custom11", column: 1, visible: true },
              { fieldName: "custom12", label: "Custom12", column: 1, visible: true },
              { fieldName: "custom13", label: "Custom13", column: 1, visible: true },
              { fieldName: "custom14", label: "Custom14", column: 1, visible: true },
              { fieldName: "custom15", label: "Custom15", column: 1, visible: true },
              { fieldName: "custom16", label: "Custom16", column: 1, visible: true },
              { fieldName: "custom17", label: "Custom17", column: 1, visible: true },
              { fieldName: "custom18", label: "Custom18", column: 1, visible: true },
              { fieldName: "custom19", label: "Custom19", column: 1, visible: true },
              { fieldName: "custom20", label: "Custom20", column: 1, visible: true },
            ],
          },
        ],
      },
    ],
  },
};
