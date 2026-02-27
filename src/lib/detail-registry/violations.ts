import { DetailPageDefinition } from "./types";

export const VIOLATION_DETAIL: DetailPageDefinition = {
  pageId: "violations-detail",
  parentPageId: "violations",
  entityName: "Violation",
  fields: [
    // Violation info
    { fieldName: "violationNumber", defaultLabel: "Violation #", type: "text", defaultLabelWidth: 80 },
    { fieldName: "unit", defaultLabel: "Unit", type: "text", defaultLabelWidth: 80 },
    { fieldName: "violationDate", defaultLabel: "Violation Date", type: "date", defaultLabelWidth: 90 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Open", label: "Open" },
        { value: "Pending", label: "Pending" },
        { value: "Dismissed", label: "Dismissed" },
        { value: "Work on Hold", label: "Work on Hold" },
        { value: "CONTRACT CANCELLED", label: "CONTRACT CANCELLED" },
      ],
    },
    { fieldName: "price", defaultLabel: "Price", type: "currency", defaultLabelWidth: 80, format: "currency" },
    { fieldName: "quote", defaultLabel: "Quote", type: "text", defaultLabelWidth: 80 },

    // Date fields
    { fieldName: "filePermit", defaultLabel: "File Permit", type: "date", defaultLabelWidth: 90 },
    { fieldName: "permitApproved", defaultLabel: "Permit Approved", type: "date", defaultLabelWidth: 100 },
    { fieldName: "neiDateSent", defaultLabel: "NEI DATE SENT", type: "date", defaultLabelWidth: 100 },
    { fieldName: "formsToDob", defaultLabel: "Forms to DOB", type: "date", defaultLabelWidth: 90 },
    { fieldName: "inspection", defaultLabel: "Inspection", type: "date", defaultLabelWidth: 90 },
    { fieldName: "hearing", defaultLabel: "Hearing", type: "date", defaultLabelWidth: 90 },
    { fieldName: "cureDueDate", defaultLabel: "Cure / Due Date", type: "date", defaultLabelWidth: 100 },
    { fieldName: "formsToCust", defaultLabel: "Forms to Cust", type: "date", defaultLabelWidth: 90 },
    { fieldName: "recvFromCust", defaultLabel: "Recv from Cust", type: "date", defaultLabelWidth: 90 },
    { fieldName: "cancelContract", defaultLabel: "Cancel Contract", type: "date", defaultLabelWidth: 100 },

    // Assignment checkboxes
    { fieldName: "assignedDiv5", defaultLabel: "Assigned Div # 5", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "assignedDiv2", defaultLabel: "Assigned Div # 2", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "jobCreated", defaultLabel: "Job Created", type: "checkbox", defaultLabelWidth: 90 },
    { fieldName: "assignedMod", defaultLabel: "Assigned Mod", type: "checkbox", defaultLabelWidth: 90 },
    { fieldName: "assignedDiv1", defaultLabel: "Assigned Div # 1", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "assignedDiv3", defaultLabel: "Assigned Div # 3", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "assignedRepair", defaultLabel: "Assigned Repair", type: "checkbox", defaultLabelWidth: 100 },
    { fieldName: "assignedCode", defaultLabel: "Assigned Code", type: "checkbox", defaultLabelWidth: 100 },
    { fieldName: "assignedDiv4", defaultLabel: "Assigned Div # 4", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "columbiaUniv", defaultLabel: "Columbia Univ", type: "checkbox", defaultLabelWidth: 90 },

    // Remarks
    { fieldName: "remarks1", defaultLabel: "Remarks 1", type: "textarea", defaultColSpan: 2 },
    { fieldName: "remarks2", defaultLabel: "Remarks 2", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "violationInfo",
        label: "Violation Info",
        visible: true,
        sections: [
          {
            id: "violation-main",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "violationNumber", label: "Violation #", column: 0, visible: true },
              { fieldName: "unit", label: "Unit", column: 0, visible: true },
              { fieldName: "violationDate", label: "Violation Date", column: 0, visible: true, labelWidth: 90 },
              { fieldName: "status", label: "Status", column: 0, visible: true },
              { fieldName: "price", label: "Price", column: 1, visible: true },
              { fieldName: "quote", label: "Quote", column: 1, visible: true },
            ],
          },
          {
            id: "violation-dates",
            label: "Dates",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "filePermit", label: "File Permit", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "permitApproved", label: "Permit Approved", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "neiDateSent", label: "NEI DATE SENT", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "formsToDob", label: "Forms to DOB", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "inspection", label: "Inspection", column: 0, visible: true, labelWidth: 100 },
              { fieldName: "hearing", label: "Hearing", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "cureDueDate", label: "Cure / Due Date", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "formsToCust", label: "Forms to Cust", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "recvFromCust", label: "Recv from Cust", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "cancelContract", label: "Cancel Contract", column: 1, visible: true, labelWidth: 100 },
            ],
          },
          {
            id: "violation-assignments",
            label: "Assignments",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "assignedDiv5", label: "Assigned Div # 5", column: 0, visible: true },
              { fieldName: "assignedDiv2", label: "Assigned Div # 2", column: 0, visible: true },
              { fieldName: "jobCreated", label: "Job Created", column: 0, visible: true },
              { fieldName: "assignedMod", label: "Assigned Mod", column: 0, visible: true },
              { fieldName: "assignedDiv1", label: "Assigned Div # 1", column: 0, visible: true },
              { fieldName: "assignedDiv3", label: "Assigned Div # 3", column: 1, visible: true },
              { fieldName: "assignedRepair", label: "Assigned Repair", column: 1, visible: true },
              { fieldName: "assignedCode", label: "Assigned Code", column: 1, visible: true },
              { fieldName: "assignedDiv4", label: "Assigned Div # 4", column: 1, visible: true },
              { fieldName: "columbiaUniv", label: "Columbia Univ", column: 1, visible: true },
            ],
          },
          {
            id: "violation-remarks",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "remarks1", label: "Remarks 1", column: 0, visible: true, colSpan: 2 },
              { fieldName: "remarks2", label: "Remarks 2", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
    ],
  },
};
