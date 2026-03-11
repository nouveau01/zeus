import { DetailPageDefinition } from "./types";

export const CONTACT_DETAIL: DetailPageDefinition = {
  pageId: "contacts-detail",
  parentPageId: "contacts",
  entityName: "Contact",
  fields: [
    { fieldName: "name", defaultLabel: "Name", type: "text", defaultLabelWidth: 80 },
    { fieldName: "title", defaultLabel: "Title", type: "text", defaultLabelWidth: 80 },
    { fieldName: "phone", defaultLabel: "Phone", type: "phone", defaultLabelWidth: 80 },
    { fieldName: "fax", defaultLabel: "Fax", type: "phone", defaultLabelWidth: 80 },
    { fieldName: "mobile", defaultLabel: "Mobile", type: "phone", defaultLabelWidth: 80 },
    { fieldName: "email", defaultLabel: "Email", type: "email", defaultLabelWidth: 80 },
    { fieldName: "linkedinUrl", defaultLabel: "LinkedIn URL", type: "url", defaultLabelWidth: 100 },
    { fieldName: "inv", defaultLabel: "Invoice Contact", type: "checkbox", defaultLabelWidth: 110 },
    { fieldName: "es", defaultLabel: "Emergency/Safety", type: "checkbox", defaultLabelWidth: 110 },
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
            id: "contact-info",
            label: "",
            columns: 2,
            visible: true,
            fields: [
              { fieldName: "name", label: "Name", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "title", label: "Title", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "phone", label: "Phone", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "fax", label: "Fax", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "mobile", label: "Mobile", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "email", label: "Email", column: 0, visible: true, labelWidth: 80 },
              { fieldName: "linkedinUrl", label: "LinkedIn URL", column: 1, visible: true, labelWidth: 100 },
              { fieldName: "inv", label: "Invoice Contact", column: 1, visible: true, labelWidth: 110 },
              { fieldName: "es", label: "Emergency/Safety", column: 1, visible: true, labelWidth: 110 },
            ],
          },
        ],
      },
      {
        id: "accounts",
        label: "Accounts",
        visible: true,
        sections: [],
      },
      {
        id: "opportunities",
        label: "Opportunities",
        visible: true,
        sections: [],
      },
      {
        id: "activity-history",
        label: "Activity History",
        visible: true,
        sections: [],
      },
      {
        id: "activity",
        label: "Field History",
        visible: true,
        sections: [],
      },
    ],
  },
};
