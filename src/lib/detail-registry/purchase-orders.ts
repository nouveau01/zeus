import { DetailPageDefinition } from "./types";

export const PURCHASE_ORDER_DETAIL: DetailPageDefinition = {
  pageId: "purchase-orders-detail",
  parentPageId: "purchase-orders",
  entityName: "Purchase Order",
  fields: [
    { fieldName: "poNumber", defaultLabel: "PO #", type: "readonly", defaultLabelWidth: 80 },
    { fieldName: "date", defaultLabel: "Date", type: "date", defaultLabelWidth: 80 },
    { fieldName: "dueDate", defaultLabel: "Due Date", type: "date", defaultLabelWidth: 80 },
    { fieldName: "terms", defaultLabel: "Terms", type: "text", defaultLabelWidth: 80 },
    { fieldName: "fob", defaultLabel: "FOB", type: "text", defaultLabelWidth: 80 },
    {
      fieldName: "status", defaultLabel: "Status", type: "select", defaultLabelWidth: 80,
      staticOptions: [
        { value: "Open", label: "Open" },
        { value: "Received", label: "Received" },
        { value: "Closed", label: "Closed" },
        { value: "Void", label: "Void" },
      ],
    },
    { fieldName: "shipVia", defaultLabel: "Ship Via", type: "text", defaultLabelWidth: 80 },
    { fieldName: "freight", defaultLabel: "Freight", type: "currency", defaultLabelWidth: 80, format: "currency" },
    { fieldName: "createdBy", defaultLabel: "Created By", type: "readonly", defaultLabelWidth: 80 },
    { fieldName: "custom1", defaultLabel: "Custom1", type: "text", defaultLabelWidth: 80 },
    { fieldName: "custom2", defaultLabel: "Custom2", type: "text", defaultLabelWidth: 80 },
    { fieldName: "total", defaultLabel: "Total", type: "readonly", defaultLabelWidth: 80, format: "currency" },
    { fieldName: "approved", defaultLabel: "Approved", type: "checkbox", defaultLabelWidth: 80 },
    { fieldName: "description", defaultLabel: "Description", type: "textarea", defaultColSpan: 2 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "details",
        label: "PO Details",
        visible: true,
        sections: [
          {
            id: "po-header",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "poNumber", label: "PO #", column: 0, visible: true, readOnly: true },
              { fieldName: "date", label: "Date", column: 0, visible: true },
              { fieldName: "dueDate", label: "Due Date", column: 0, visible: true },
              { fieldName: "terms", label: "Terms", column: 0, visible: true },
              { fieldName: "fob", label: "FOB", column: 0, visible: true },
              { fieldName: "status", label: "Status", column: 1, visible: true },
              { fieldName: "shipVia", label: "Ship Via", column: 1, visible: true },
              { fieldName: "freight", label: "Freight", column: 1, visible: true },
              { fieldName: "createdBy", label: "Created By", column: 1, visible: true, readOnly: true },
              { fieldName: "custom1", label: "Custom1", column: 1, visible: true },
              { fieldName: "custom2", label: "Custom2", column: 1, visible: true },
              { fieldName: "approved", label: "Approved", column: 1, visible: true },
            ],
          },
          {
            id: "po-description",
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
        id: "glItems",
        label: "GL Items",
        visible: true,
        sections: [], // Custom content — GL items grid
      },
      {
        id: "jobCostingItems",
        label: "Job Costing",
        visible: true,
        sections: [], // Custom content — job costing items grid
      },
      {
        id: "inventoryItems",
        label: "Inventory",
        visible: true,
        sections: [], // Custom content — inventory items grid
      },
    ],
  },
};
