import { DetailPageDefinition } from "./types";
import { CUSTOMER_DETAIL } from "./customers";
import { ACCOUNT_DETAIL } from "./accounts";
import { VENDOR_DETAIL } from "./vendors";
import { UNIT_DETAIL } from "./units";
import { INVOICE_DETAIL } from "./invoices";
import { JOB_DETAIL } from "./jobs";
import { COMPLETED_TICKET_DETAIL } from "./completed-tickets";
import { QUOTE_DETAIL } from "./quotes";
import { ESTIMATE_DETAIL } from "./estimates";
import { PURCHASE_ORDER_DETAIL } from "./purchase-orders";
import { JOURNAL_ENTRY_DETAIL } from "./purchase-journal";
import { CASH_RECEIPT_DETAIL } from "./cash-receipts";
import { JOB_RESULT_DETAIL } from "./job-results";
import { SAFETY_TEST_DETAIL } from "./safety-tests";
import { VIOLATION_DETAIL } from "./violations";
import { OPPORTUNITY_DETAIL } from "./opportunities";
import { CONTACT_DETAIL } from "./contacts";

export const DETAIL_REGISTRY: Record<string, DetailPageDefinition> = {
  "customers-detail": CUSTOMER_DETAIL,
  "accounts-detail": ACCOUNT_DETAIL,
  "vendors-detail": VENDOR_DETAIL,
  "units-detail": UNIT_DETAIL,
  "invoices-detail": INVOICE_DETAIL,
  "jobs-detail": JOB_DETAIL,
  "completed-tickets-detail": COMPLETED_TICKET_DETAIL,
  "quotes-detail": QUOTE_DETAIL,
  "estimates-detail": ESTIMATE_DETAIL,
  "purchase-orders-detail": PURCHASE_ORDER_DETAIL,
  "purchase-journal-detail": JOURNAL_ENTRY_DETAIL,
  "cash-receipts-detail": CASH_RECEIPT_DETAIL,
  "job-results-detail": JOB_RESULT_DETAIL,
  "safety-tests-detail": SAFETY_TEST_DETAIL,
  "violations-detail": VIOLATION_DETAIL,
  "opportunities-detail": OPPORTUNITY_DETAIL,
  "contacts-detail": CONTACT_DETAIL,
};
