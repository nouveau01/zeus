import { DetailPageDefinition } from "./types";

export const COMPLETED_TICKET_DETAIL: DetailPageDefinition = {
  pageId: "completed-tickets-detail",
  parentPageId: "completed-tickets",
  entityName: "Completed Ticket",
  fields: [
    // Ticket Info tab — left column
    { fieldName: "ticketNumber", defaultLabel: "Ticket #", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "workOrderNumber", defaultLabel: "W/O#", type: "number", defaultLabelWidth: 64 },
    {
      fieldName: "category", defaultLabel: "Category", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "None", label: "None" },
        { value: "Maintenance", label: "Maintenance" },
        { value: "Repair", label: "Repair" },
        { value: "Callback", label: "Callback" },
      ],
    },
    {
      fieldName: "level", defaultLabel: "Level", type: "select", defaultLabelWidth: 64,
      staticOptions: [
        { value: "", label: "" },
        { value: "1-Emergency", label: "1-Emergency" },
        { value: "2-Urgent", label: "2-Urgent" },
        { value: "3-Normal", label: "3-Normal" },
        { value: "4-Violations", label: "4-Violations" },
        { value: "5-Low", label: "5-Low" },
      ],
    },
    { fieldName: "phase", defaultLabel: "Phase", type: "number", defaultLabelWidth: 64 },
    { fieldName: "scopeOfWork", defaultLabel: "Scope of Work", type: "textarea", defaultLabelWidth: 80 },
    { fieldName: "resolution", defaultLabel: "Resolution", type: "textarea", defaultLabelWidth: 80 },

    // Ticket Info tab — middle column
    { fieldName: "date", defaultLabel: "Date", type: "date", defaultLabelWidth: 48 },
    { fieldName: "workTime", defaultLabel: "Time", type: "text", defaultLabelWidth: 48 },
    { fieldName: "enRouteTime", defaultLabel: "En Route", type: "text", defaultLabelWidth: 56 },
    { fieldName: "onSiteTime", defaultLabel: "On Site", type: "text", defaultLabelWidth: 56 },
    { fieldName: "completedTime", defaultLabel: "Completed", type: "text", defaultLabelWidth: 56 },
    { fieldName: "mileageStarting", defaultLabel: "Starting", type: "number", defaultLabelWidth: 56 },
    { fieldName: "mileageEnding", defaultLabel: "Ending", type: "number", defaultLabelWidth: 56 },
    { fieldName: "mileageTraveled", defaultLabel: "Traveled", type: "number", defaultLabelWidth: 56 },
    { fieldName: "partsUsed", defaultLabel: "Parts Used", type: "textarea", defaultLabelWidth: 64 },

    // Ticket Info tab — right column (time spent)
    { fieldName: "hours", defaultLabel: "Regular", type: "number", defaultLabelWidth: 64 },
    { fieldName: "overtimeHours", defaultLabel: "Overtime", type: "number", defaultLabelWidth: 64 },
    { fieldName: "oneSevenHours", defaultLabel: "1.7 Time", type: "number", defaultLabelWidth: 64 },
    { fieldName: "doubleTimeHours", defaultLabel: "DoubleTime", type: "number", defaultLabelWidth: 64 },
    { fieldName: "travelHours", defaultLabel: "Travel", type: "number", defaultLabelWidth: 64 },
    { fieldName: "totalHours", defaultLabel: "Total", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "estTime", defaultLabel: "Est Time", type: "number", defaultLabelWidth: 64 },
    { fieldName: "difference", defaultLabel: "Difference", type: "readonly", defaultLabelWidth: 64 },

    // Checkboxes
    { fieldName: "workCompleted", defaultLabel: "Work Completed", type: "checkbox", defaultLabelWidth: 100 },
    { fieldName: "chargeable", defaultLabel: "Chargeable", type: "checkbox", defaultLabelWidth: 100 },
    { fieldName: "inv", defaultLabel: "Invoice", type: "checkbox", defaultLabelWidth: 100 },
    { fieldName: "emailOnSave", defaultLabel: "Email on Save", type: "checkbox", defaultLabelWidth: 100 },

    // Review & expenses
    {
      fieldName: "reviewStatus", defaultLabel: "Review Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Dispatch Review", label: "Dispatch Review" },
        { value: "Supervisor Review", label: "Supervisor Review" },
        { value: "Billing Review", label: "Billing Review" },
        { value: "Complete", label: "Complete" },
      ],
    },
    { fieldName: "expensePhase", defaultLabel: "Phase", type: "number", defaultLabelWidth: 64 },
    { fieldName: "contractType", defaultLabel: "Contract Type", type: "text", defaultLabelWidth: 80 },
    { fieldName: "internalComments", defaultLabel: "Internal Comments", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "ticketInfo",
        label: "1 Ticket Info",
        visible: true,
        sections: [
          {
            id: "ticket-main",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "ticketNumber", label: "Ticket #", column: 0, visible: true, readOnly: true },
              { fieldName: "workOrderNumber", label: "W/O#", column: 0, visible: true },
              { fieldName: "category", label: "Category", column: 0, visible: true },
              { fieldName: "level", label: "Level", column: 0, visible: true },
              { fieldName: "phase", label: "Phase", column: 0, visible: true },
              { fieldName: "date", label: "Date", column: 1, visible: true },
              { fieldName: "workTime", label: "Time", column: 1, visible: true },
              { fieldName: "hours", label: "Regular", column: 1, visible: true },
              { fieldName: "overtimeHours", label: "Overtime", column: 1, visible: true },
              { fieldName: "oneSevenHours", label: "1.7 Time", column: 1, visible: true },
              { fieldName: "doubleTimeHours", label: "DoubleTime", column: 1, visible: true },
              { fieldName: "travelHours", label: "Travel", column: 1, visible: true },
              { fieldName: "totalHours", label: "Total", column: 1, visible: true, readOnly: true },
            ],
          },
          {
            id: "ticket-work",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "scopeOfWork", label: "Scope of Work", column: 0, visible: true },
              { fieldName: "resolution", label: "Resolution", column: 0, visible: true },
              { fieldName: "enRouteTime", label: "En Route", column: 1, visible: true },
              { fieldName: "onSiteTime", label: "On Site", column: 1, visible: true },
              { fieldName: "completedTime", label: "Completed", column: 1, visible: true },
            ],
          },
          {
            id: "ticket-checkboxes",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "workCompleted", label: "Work Completed", column: 0, visible: true },
              { fieldName: "chargeable", label: "Chargeable", column: 0, visible: true },
              { fieldName: "inv", label: "Invoice", column: 1, visible: true },
              { fieldName: "emailOnSave", label: "Email on Save", column: 1, visible: true },
              { fieldName: "reviewStatus", label: "Review Status", column: 0, visible: true },
              { fieldName: "contractType", label: "Contract Type", column: 1, visible: true },
            ],
          },
          {
            id: "ticket-comments",
            label: "",
            columns: 1,
            visible: true,
            fields: [
              { fieldName: "internalComments", label: "Internal Comments", column: 0, visible: true, colSpan: 2 },
            ],
          },
        ],
      },
      {
        id: "materialsCustom",
        label: "2 Materials/Custom",
        visible: true,
        sections: [], // Custom content — materials grid, flat rates, purchase orders, custom fields
      },
      {
        id: "workersSignatures",
        label: "3 Workers/Signatures",
        visible: true,
        sections: [], // Custom content — workers table, signature canvases
      },
    ],
  },
};
