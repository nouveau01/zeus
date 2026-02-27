import { DetailPageDefinition } from "./types";

export const SAFETY_TEST_DETAIL: DetailPageDefinition = {
  pageId: "safety-tests-detail",
  parentPageId: "safety-tests",
  entityName: "Safety Test",
  fields: [
    // Test info
    {
      fieldName: "testType", defaultLabel: "Test Type", type: "select", defaultLabelWidth: 90,
      staticOptions: [
        { value: "ANNUAL INS", label: "ANNUAL INS" },
        { value: "OUTSIDE N", label: "OUTSIDE N" },
        { value: "CAT 1 TEST", label: "CAT 1 TEST" },
        { value: "CAT 3 TEST", label: "CAT 3 TEST" },
        { value: "CAT 5 TEST", label: "CAT 5 TEST" },
        { value: "LOAD TEST", label: "LOAD TEST" },
        { value: "FIRE SERVICE", label: "FIRE SERVICE" },
        { value: "HYDRAULIC", label: "HYDRAULIC" },
        { value: "PRESSURE TEST", label: "PRESSURE TEST" },
        { value: "SAFETY TEST", label: "SAFETY TEST" },
      ],
    },
    { fieldName: "stateNumber", defaultLabel: "State #", type: "text", defaultLabelWidth: 90 },

    // Dates & status
    { fieldName: "lastTestedOn", defaultLabel: "Last Tested On", type: "date", defaultLabelWidth: 90 },
    { fieldName: "testDueDate", defaultLabel: "Test Due Date", type: "date", defaultLabelWidth: 90 },
    { fieldName: "lastDueDate", defaultLabel: "Last Due Date", type: "date", defaultLabelWidth: 90 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 90,
      staticOptions: [
        { value: "Inspector to s", label: "Inspector to s" },
        { value: "Job Awarded", label: "Job Awarded" },
        { value: "Scheduled", label: "Scheduled" },
        { value: "Test Complete", label: "Test Complete" },
        { value: "No Proposal", label: "No Proposal" },
        { value: "Proposal Sent", label: "Proposal Sent" },
        { value: "Cancelled", label: "Cancelled" },
        { value: "On Hold", label: "On Hold" },
      ],
    },
    { fieldName: "chargeForTest", defaultLabel: "Charge for Test", type: "checkbox", defaultLabelWidth: 100 },

    // Custom fields
    {
      fieldName: "witnessDropdown", defaultLabel: "WITNESS", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Building Super", label: "Building Super" },
        { value: "Property Manager", label: "Property Manager" },
        { value: "Owner", label: "Owner" },
        { value: "Other", label: "Other" },
      ],
    },
    { fieldName: "billing2012To2019", defaultLabel: "2012-2019 Billing", type: "text", defaultLabelWidth: 110 },
    { fieldName: "specialSkill", defaultLabel: "Special Skill", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom10", defaultLabel: "Custom 10", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom11", defaultLabel: "Custom 11", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom12", defaultLabel: "Custom 12", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom13", defaultLabel: "Custom 13", type: "text", defaultLabelWidth: 80 },
    { fieldName: "town", defaultLabel: "Town", type: "text", defaultLabelWidth: 80 },
    { fieldName: "townships", defaultLabel: "Townships", type: "text", defaultLabelWidth: 80 },

    // Remarks
    { fieldName: "remarks", defaultLabel: "Remarks", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "testInfo",
        label: "Test Info",
        visible: true,
        sections: [
          {
            id: "test-main",
            label: "Test Information",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "testType", label: "Test Type", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "stateNumber", label: "State #", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "lastTestedOn", label: "Last Tested On", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "testDueDate", label: "Test Due Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "lastDueDate", label: "Last Due Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "status", label: "Status", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "chargeForTest", label: "Charge for Test", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "witnessDropdown", label: "WITNESS", column: 1, visible: true },
              { fieldName: "billing2012To2019", label: "2012-2019 Billing", column: 1, visible: true, labelWidth: 110 },
              { fieldName: "specialSkill", label: "Special Skill", column: 1, visible: true },
              { fieldName: "custom10", label: "Custom 10", column: 1, visible: true },
              { fieldName: "custom11", label: "Custom 11", column: 1, visible: true },
              { fieldName: "custom12", label: "Custom 12", column: 1, visible: true },
              { fieldName: "custom13", label: "Custom 13", column: 1, visible: true },
              { fieldName: "town", label: "Town", column: 1, visible: true },
              { fieldName: "townships", label: "Townships", column: 1, visible: true },
            ],
          },
          {
            id: "test-remarks",
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
