/**
 * Ticket Detail Page Layout
 *
 * This defines the layout of the ticket detail page in a declarative format.
 * Admins can customize this through the page builder UI.
 */

import { PageLayout } from "../types";

export const ticketDetailLayout: PageLayout = {
  id: "ticket-detail-v1",
  name: "Ticket Detail",
  objectType: "ticket",
  gridCols: 12,
  rowHeight: 25,
  sections: [
    // Row 1: Ticket # and W/O#
    {
      id: "ticketHeader",
      type: "inline",
      fields: [
        { id: "ticketNum", type: "readonly", label: "Ticket #", field: "ticketNumber", width: "w-[70px]" },
        { id: "woNum", type: "text", label: "W/O#", field: "workOrderNumber", width: "w-[70px]" },
      ],
      layout: { x: 0, y: 0, w: 3, h: 1 },
    },

    // Category
    {
      id: "category",
      type: "inline",
      fields: [
        {
          id: "cat",
          type: "select",
          label: "Category",
          field: "category",
          options: [
            { value: "", label: "None" },
            { value: "Maintenance", label: "Maintenance" },
            { value: "Repair", label: "Repair" },
            { value: "Callback", label: "Callback" },
          ],
        },
      ],
      layout: { x: 0, y: 1, w: 3, h: 1 },
    },

    // Level
    {
      id: "level",
      type: "inline",
      fields: [
        {
          id: "lvl",
          type: "select",
          label: "Level",
          field: "level",
          options: [
            { value: "", label: "Select..." },
            { value: "10", label: "10-Maintenance" },
            { value: "20", label: "20-Callback" },
            { value: "30", label: "30-Repair" },
          ],
        },
      ],
      layout: { x: 0, y: 2, w: 3, h: 1 },
    },

    // Job and Phase
    {
      id: "jobPhase",
      type: "inline",
      fields: [
        { id: "job", type: "text", label: "Job", field: "jobId", width: "w-[60px]" },
        { id: "phase", type: "number", label: "Phase", field: "phase", width: "w-[40px]" },
      ],
      layout: { x: 0, y: 3, w: 3, h: 1 },
    },

    // Unit
    {
      id: "unit",
      type: "inline",
      fields: [
        { id: "unitSelect", type: "select", label: "Unit", field: "unitName", options: [] },
      ],
      layout: { x: 0, y: 4, w: 3, h: 1 },
    },

    // Name & Address
    {
      id: "nameAddress",
      type: "fieldset",
      title: "Name & Address",
      fields: [
        { id: "addr", type: "textarea", label: "", field: "nameAddress" },
      ],
      layout: { x: 0, y: 5, w: 3, h: 3, minH: 2 },
    },

    // Scope of Work
    {
      id: "scopeOfWork",
      type: "fieldset",
      title: "Scope of Work",
      fields: [
        { id: "scope", type: "textarea", label: "", field: "scopeOfWork" },
      ],
      layout: { x: 0, y: 8, w: 3, h: 2, minH: 2 },
    },

    // Resolution
    {
      id: "resolution",
      type: "fieldset",
      title: "Resolution",
      fields: [
        { id: "res", type: "textarea", label: "", field: "resolution" },
      ],
      layout: { x: 0, y: 10, w: 3, h: 4, minH: 2 },
    },

    // Work Performed
    {
      id: "workPerformed",
      type: "fieldset",
      title: "Work Performed",
      fields: [
        { id: "date", type: "date", label: "Date", field: "date" },
        { id: "time", type: "time", label: "Time", field: "workTime" },
        { id: "mech", type: "text", label: "Mech", field: "mechCrew" },
        { id: "wage", type: "text", label: "Wage", field: "wage" },
      ],
      layout: { x: 3, y: 0, w: 2, h: 5, minH: 4 },
    },

    // Time Frame
    {
      id: "timeFrame",
      type: "fieldset",
      title: "Time Frame",
      fields: [
        { id: "enRoute", type: "time", label: "En Route", field: "enRouteTime" },
        { id: "onSite", type: "time", label: "On Site", field: "onSiteTime" },
        { id: "completed", type: "time", label: "Completed", field: "completedTime" },
      ],
      layout: { x: 3, y: 5, w: 2, h: 4, minH: 3 },
    },

    // Mileage
    {
      id: "mileage",
      type: "fieldset",
      title: "Mileage",
      fields: [
        { id: "starting", type: "number", label: "Starting", field: "mileageStarting" },
        { id: "ending", type: "number", label: "Ending", field: "mileageEnding" },
        { id: "traveled", type: "number", label: "Traveled", field: "mileageTraveled" },
      ],
      layout: { x: 3, y: 9, w: 2, h: 4, minH: 3 },
    },

    // Parts Used
    {
      id: "partsUsed",
      type: "fieldset",
      title: "Parts Used",
      fields: [
        { id: "parts", type: "textarea", label: "", field: "partsUsed" },
      ],
      layout: { x: 3, y: 13, w: 2, h: 2, minH: 1 },
    },

    // Time Spent
    {
      id: "timeSpent",
      type: "fieldset",
      title: "Time Spent",
      fields: [
        { id: "regular", type: "number", label: "Regular", field: "hours" },
        { id: "overtime", type: "number", label: "Overtime", field: "overtimeHours" },
        { id: "oneSevenTime", type: "number", label: "1.7 Time", field: "oneSevenHours" },
        { id: "doubleTime", type: "number", label: "DoubleTime", field: "doubleTimeHours" },
        { id: "travel", type: "number", label: "Travel", field: "travelHours" },
        { id: "total", type: "number", label: "Total", field: "totalHours", readOnly: true },
        { id: "estTime", type: "number", label: "Est Time", field: "estTime" },
        { id: "diff", type: "number", label: "Difference", field: "difference", readOnly: true },
      ],
      layout: { x: 5, y: 0, w: 2, h: 8, minH: 6 },
    },

    // Checkboxes
    {
      id: "statusCheckboxes",
      type: "checkboxGroup",
      fields: [
        { id: "workCompleted", type: "checkbox", label: "Work Completed", field: "workCompleted" },
        { id: "chargeable", type: "checkbox", label: "Chargeable", field: "chargeable" },
        { id: "invoice", type: "checkbox", label: "Invoice", field: "inv" },
        { id: "emailOnSave", type: "checkbox", label: "Email on Save", field: "emailOnSave" },
        { id: "updateLocation", type: "checkbox", label: "Update Location", field: "updateLocation" },
        { id: "internetAccess", type: "checkbox", label: "Internet Access", field: "internetAccess" },
      ],
      layout: { x: 7, y: 0, w: 2, h: 5, minH: 4 },
    },

    // Review Status
    {
      id: "reviewStatus",
      type: "inline",
      fields: [
        {
          id: "review",
          type: "select",
          label: "Review Status",
          field: "reviewStatus",
          options: [
            { value: "Dispatch Review", label: "Dispatch Review" },
            { value: "Supervisor Review", label: "Supervisor Review" },
            { value: "Billing Review", label: "Billing Review" },
            { value: "Complete", label: "Complete" },
          ],
        },
      ],
      layout: { x: 7, y: 5, w: 2, h: 1 },
    },

    // Expenses
    {
      id: "expenses",
      type: "fieldset",
      title: "Expenses",
      fields: [
        { id: "expPhase", type: "number", label: "Phase", field: "expensePhase" },
        { id: "expMileage", type: "currency", label: "Mileage", field: "expenseMileage" },
        { id: "expZone", type: "currency", label: "Zone", field: "expenseZone" },
        { id: "expTolls", type: "currency", label: "Tolls", field: "expenseTolls" },
        { id: "expMisc", type: "currency", label: "Misc Exp", field: "expenseMisc" },
        { id: "expTotal", type: "currency", label: "Total", field: "expenseTotal" },
      ],
      layout: { x: 9, y: 0, w: 2, h: 6, minH: 5 },
    },

    // Contract Type
    {
      id: "contractType",
      type: "inline",
      fields: [
        { id: "contract", type: "text", label: "Contract Type", field: "contractType", width: "w-[80px]" },
      ],
      layout: { x: 5, y: 8, w: 3, h: 1 },
    },

    // Internal Comments
    {
      id: "internalComments",
      type: "fieldset",
      title: "Internal Comments Only",
      fields: [
        { id: "comments", type: "textarea", label: "", field: "internalComments" },
      ],
      layout: { x: 5, y: 9, w: 6, h: 5, minH: 2 },
    },
  ],
};
