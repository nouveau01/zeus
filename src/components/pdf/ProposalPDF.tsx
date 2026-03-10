"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

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
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 15,
  },
  headerLogo: {
    maxWidth: 250,
    maxHeight: 60,
    marginBottom: 8,
    objectFit: "contain" as any,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 3,
  },
  companySubtitle: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  companyDetails: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.4,
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 80,
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e3a5f",
    textTransform: "uppercase",
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: "#333",
  },
  reLine: {
    flexDirection: "row",
    marginBottom: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  reLabel: {
    width: 30,
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  reValue: {
    flex: 1,
    fontSize: 11,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  workDescription: {
    fontSize: 10,
    color: "#333",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  laborLine: {
    flexDirection: "row",
    marginBottom: 5,
    fontSize: 10,
    color: "#333",
  },
  totalSection: {
    marginTop: 15,
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginRight: 20,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    width: 120,
    textAlign: "right",
  },
  validityNote: {
    fontSize: 9,
    color: "#666",
    marginBottom: 15,
    fontStyle: "italic",
  },
  termsSection: {
    marginTop: 15,
    marginBottom: 25,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 5,
  },
  termsText: {
    fontSize: 8,
    color: "#666",
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 20,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 15,
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  signatureField: {
    width: "48%",
    marginBottom: 15,
    marginRight: "2%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginBottom: 3,
    height: 25,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
  },
});

export interface CompanyInfo {
  companyName: string;
  companySubtitle: string;
  address: string;
  phone: string;
  fax: string;
  website: string;
  logoBase64: string;
}

interface ProposalPDFProps {
  proposal: {
    proposalNumber: number;
    title: string | null;
    type: string | null;
    workDescription: string | null;
    laborHours: number | null;
    laborRate: number | null;
    laborTotal: number | null;
    amount: number | null;
    taxNote: string | null;
    validDays: number | null;
    paymentTerms: string | null;
    attn: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
    fromName: string | null;
    createdAt: string;
  };
  customerName: string;
  premiseAddress: string;
  company?: CompanyInfo;
}

const formatCurrency = (amount: number | null) =>
  amount != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount)
    : "$0.00";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
};

export default function ProposalPDF({ proposal, customerName, premiseAddress, company }: ProposalPDFProps) {
  const co = {
    companyName: company?.companyName || "NOUVEAU ELEVATOR INDUSTRIES, INC.",
    companySubtitle: company?.companySubtitle || "Elevator Division",
    address: company?.address || "4755 37th Street, Long Island City, NY 11101",
    phone: company?.phone || "(718) 349-4700",
    fax: company?.fax || "(718) 349-4747",
    website: company?.website || "www.nouveauelevator.com",
    logoBase64: company?.logoBase64 || "",
  };

  const contactLine = [
    co.phone ? `Phone: ${co.phone}` : null,
    co.fax ? `Fax: ${co.fax}` : null,
    co.website || null,
  ].filter(Boolean).join(" | ");

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {co.logoBase64 ? (
            <Image style={styles.headerLogo} src={co.logoBase64} />
          ) : (
            <Text style={styles.companyName}>{co.companyName}</Text>
          )}
          {co.companySubtitle && (
            <Text style={styles.companySubtitle}>{co.companySubtitle}</Text>
          )}
          {co.address && (
            <Text style={styles.companyDetails}>{co.address}</Text>
          )}
          {contactLine && (
            <Text style={styles.companyDetails}>{contactLine}</Text>
          )}
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ATTN:</Text>
              <Text style={styles.infoValue}>{proposal.attn || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PHONE:</Text>
              <Text style={styles.infoValue}>{proposal.phone || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FAX:</Text>
              <Text style={styles.infoValue}>{proposal.fax || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EMAIL:</Text>
              <Text style={styles.infoValue}>{proposal.email || "—"}</Text>
            </View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FROM:</Text>
              <Text style={styles.infoValue}>{proposal.fromName || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PREMISE:</Text>
              <Text style={styles.infoValue}>{premiseAddress || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CUSTOMER:</Text>
              <Text style={styles.infoValue}>{customerName || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>PROPOSAL #:</Text>
              <Text style={styles.infoValue}>{proposal.proposalNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DATE:</Text>
              <Text style={styles.infoValue}>{formatDate(proposal.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* RE: Line */}
        <View style={styles.reLine}>
          <Text style={styles.reLabel}>RE:</Text>
          <Text style={styles.reValue}>{proposal.title || "—"}</Text>
        </View>

        {/* Type */}
        {proposal.type && (
          <View style={{ flexDirection: "row", marginBottom: 15 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1e3a5f", width: 80 }}>TYPE:</Text>
            <Text style={{ fontSize: 10, color: "#333" }}>{proposal.type}</Text>
          </View>
        )}

        {/* Work Description */}
        <Text style={styles.sectionTitle}>Work Description</Text>
        <Text style={styles.workDescription}>
          {proposal.workDescription || "No description provided."}
        </Text>

        {/* Labor */}
        {(proposal.laborHours || proposal.laborRate) && (
          <View>
            <Text style={styles.laborLine}>
              Approx. Labor: {proposal.laborHours || 0} hours @ {formatCurrency(proposal.laborRate)} / hour = {formatCurrency(proposal.laborTotal)}
            </Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>COST FOR IMPROVEMENT:</Text>
            <Text style={styles.totalValue}>{formatCurrency(proposal.amount)}</Text>
          </View>
          {proposal.taxNote && (
            <View style={styles.totalRow}>
              <Text style={{ fontSize: 9, color: "#666", textAlign: "right" }}>{proposal.taxNote}</Text>
            </View>
          )}
        </View>

        {/* Validity */}
        <Text style={styles.validityNote}>
          This proposal is valid for {proposal.validDays || 30} days from the date above.
        </Text>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            Payment terms: {proposal.paymentTerms || "Net 30 Days"}. All work will be performed during normal business hours unless otherwise specified.
            Additional charges may apply for overtime, weekends, or holidays. This proposal does not include permits unless specifically noted.
            Any additional work beyond the scope described above will require a separate authorization.
            {co.companyName} reserves the right to withdraw this proposal if not accepted within the validity period.
          </Text>
        </View>

        {/* Signature Block */}
        <View style={styles.signatureSection}>
          <Text style={styles.signatureTitle}>AUTHORIZATION</Text>
          <View style={styles.signatureGrid}>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>P.O. #</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Name (Print)</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Title & Date</Text>
            </View>
            <View style={styles.signatureField}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {[co.companyName, co.address, co.phone].filter(Boolean).join(" | ")}
        </Text>
      </Page>
    </Document>
  );
}
