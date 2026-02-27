import { DetailPageDefinition } from "./types";

export const CASH_RECEIPT_DETAIL: DetailPageDefinition = {
  pageId: "cash-receipts-detail",
  parentPageId: "cash-receipts",
  entityName: "Cash Receipt",
  fields: [
    { fieldName: "refNumber", defaultLabel: "Dep #", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "date", defaultLabel: "Date", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "description", defaultLabel: "Desc", type: "readonly", defaultLabelWidth: 64 },
    { fieldName: "amount", defaultLabel: "Total", type: "readonly", defaultLabelWidth: 64, format: "currency" },
    { fieldName: "cleared", defaultLabel: "Cleared", type: "checkbox", defaultLabelWidth: 64 },
  ],
  defaultLayout: {
    version: 1,
    tabs: [
      {
        id: "details",
        label: "Details",
        visible: true,
        sections: [
          {
            id: "receipt-header",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "refNumber", label: "Dep #", column: 0, visible: true, readOnly: true },
              { fieldName: "date", label: "Date", column: 0, visible: true, readOnly: true },
              { fieldName: "description", label: "Desc", column: 0, visible: true, readOnly: true },
              { fieldName: "amount", label: "Total", column: 1, visible: true, readOnly: true },
              { fieldName: "cleared", label: "Cleared", column: 1, visible: true },
            ],
          },
        ],
      },
    ],
  },
};
