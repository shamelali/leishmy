import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register fonts if needed, but we'll use standard ones for now
const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  container: {
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#e11d48",
    padding: 24,
    borderRadius: 8,
    marginBottom: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  metaSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  metaGroup: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: 12,
    color: "#374151",
  },
  table: {
    width: "100%",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    padding: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    padding: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    padding: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  badge: {
    padding: "2 8",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 4,
  },
});

interface InvoicePDFProps {
  invoice: any;
  booking: any;
  issuer: any;
  recipient: any;
}

export const InvoicePDF = ({ invoice, booking, issuer, recipient }: InvoicePDFProps) => {
  const formatRM = (v: number) => `RM ${v.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Leish!</Text>
            <Text style={styles.subtitle}>Beauty Booking Platform &mdash; Malaysia</Text>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Invoice</Text>
              <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
              <View style={[styles.badge, { backgroundColor: invoice.status === "paid" ? "#16a34a" : "#1d4ed8" }]}>
                <Text style={{ color: "#fff", fontSize: 9 }}>{invoice.status === "paid" ? "Paid" : "Issued"}</Text>
              </View>
            </View>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Date Issued</Text>
              <Text style={styles.metaValue}>{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" }) : "—"}</Text>
              <Text style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                <Text style={{ fontWeight: "bold" }}>Service Date: </Text>
                {booking?.date ? new Date(booking.date).toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>From</Text>
              <Text style={styles.metaValue}>{issuer?.name || "Leish!"}</Text>
              <Text style={styles.metaValue}>{issuer?.email || ""}</Text>
            </View>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>To</Text>
              <Text style={styles.metaValue}>{recipient?.name || "Customer"}</Text>
              <Text style={styles.metaValue}>{recipient?.email || ""}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Description</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: "center" }]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>Amount</Text>
            </View>
            {(invoice.lineItems as any[])?.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.description}</Text>
                <Text style={[styles.tableCell, { textAlign: "center" }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { textAlign: "right" }]}>{formatRM(item.unitPrice / 100)}</Text>
                <Text style={[styles.tableCell, { textAlign: "right", fontWeight: "bold" }]}>{formatRM(item.amount / 100)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{formatRM(Number(invoice.subtotal))}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text>Platform Commission ({(Number(invoice.commissionRate) * 100).toFixed(0)}%)</Text>
              <Text>-{formatRM(Number(invoice.commissionAmount))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Total</Text>
              <Text>{formatRM(Number(invoice.total))}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>Duta Integra Solutions (TR0325441-K) &bull; Leish! Beauty Booking Platform</Text>
            <Text style={{ marginTop: 4 }}>Questions? Contact us at support@leish.my</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
