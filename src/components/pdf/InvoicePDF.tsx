"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts (optional - uses default sans-serif if not registered)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.cdnfonts.com/s/29136/Helvetica.woff", fontWeight: "normal" },
    { src: "https://fonts.cdnfonts.com/s/29136/Helvetica-Bold.woff", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.4,
  },
  invoiceTitle: {
    textAlign: "right",
  },
  invoiceLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  invoiceNumber: {
    fontSize: 14,
    marginTop: 5,
    color: "#333",
  },
  invoiceStatus: {
    marginTop: 10,
    padding: "5 15",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusPaid: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  statusOpen: {
    backgroundColor: "#fff3cd",
    color: "#856404",
  },
  statusVoid: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  infoSection: {
    flexDirection: "row",
    marginBottom: 25,
  },
  billTo: {
    flex: 1,
    paddingRight: 20,
  },
  invoiceDetails: {
    flex: 1,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 10,
    color: "#333",
    lineHeight: 1.5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 80,
    fontSize: 9,
    color: "#666",
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: "#333",
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    color: "#fff",
    padding: "8 5",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: "8 5",
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  colDescription: {
    flex: 3,
    paddingRight: 10,
  },
  colQty: {
    width: 50,
    textAlign: "center",
  },
  colPrice: {
    width: 80,
    textAlign: "right",
  },
  colTax: {
    width: 40,
    textAlign: "center",
  },
  colAmount: {
    width: 80,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: 250,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "6 10",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "10 10",
    backgroundColor: "#1e3a5f",
    color: "#fff",
  },
  totalLabel: {
    fontSize: 10,
    color: "#333",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalLabelFinal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  totalValueFinal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: "#666",
  },
  footerThankYou: {
    fontSize: 10,
    color: "#1e3a5f",
    fontWeight: "bold",
    marginBottom: 5,
  },
});

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  tax: boolean;
  price: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: number;
  date: string;
  postingDate: string;
  status: string;
  terms: string | null;
  poNumber: string | null;
  description: string | null;
  premises: {
    address: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    customer: {
      name: string;
    } | null;
  } | null;
  items: InvoiceItem[];
  taxable: number;
  nonTaxable: number;
  subTotal: number;
  salesTax: number;
  total: number;
}

interface InvoicePDFProps {
  invoice: InvoiceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  const getStatusStyle = () => {
    switch (invoice.status) {
      case "Paid":
        return styles.statusPaid;
      case "Open":
        return styles.statusOpen;
      case "Void":
        return styles.statusVoid;
      default:
        return styles.statusOpen;
    }
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>NOUVEAU ELEVATOR</Text>
            <Text style={styles.companyDetails}>
              123 Elevator Street, Suite 100{"\n"}
              New York, NY 10001{"\n"}
              Phone: (212) 555-0100{"\n"}
              Email: billing@nouveauelevator.com
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <View style={[styles.invoiceStatus, getStatusStyle()]}>
              <Text>{invoice.status?.toUpperCase() || "OPEN"}</Text>
            </View>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.infoSection}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            {invoice.premises && (
              <Text style={styles.infoText}>
                {invoice.premises.customer?.name || ""}{"\n"}
                {invoice.premises.address}{"\n"}
                {invoice.premises.city && (
                  <>
                    {invoice.premises.city}
                    {invoice.premises.state ? `, ${invoice.premises.state}` : ""}
                    {invoice.premises.zipCode ? ` ${invoice.premises.zipCode}` : ""}
                  </>
                )}
              </Text>
            )}
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice Date:</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.postingDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Terms:</Text>
              <Text style={styles.infoValue}>{invoice.terms || "Net 30 Days"}</Text>
            </View>
            {invoice.poNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PO Number:</Text>
                <Text style={styles.infoValue}>{invoice.poNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {invoice.description && (
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.infoText}>{invoice.description}</Text>
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTax}>Tax</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View
              key={item.id}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colDescription}>
                {item.name}
                {item.description ? ` - ${item.description}` : ""}
              </Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.price)}</Text>
              <Text style={styles.colTax}>{item.tax ? "Y" : "N"}</Text>
              <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxable</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxable)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Non-Taxable</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.nonTaxable)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sales Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.salesTax)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL DUE</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Payment Instructions</Text>
          <Text style={styles.notesText}>
            Please make checks payable to Nouveau Elevator.{"\n"}
            For wire transfers, please contact our billing department.{"\n"}
            Payment is due within the terms specified above.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerThankYou}>Thank you for your business!</Text>
          <Text style={styles.footerText}>
            Questions? Contact billing@nouveauelevator.com or call (212) 555-0100
          </Text>
        </View>
      </Page>
    </Document>
  );
}
