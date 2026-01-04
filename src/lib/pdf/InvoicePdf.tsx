import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoicePdfModel } from "./types";

// A4: 595.28 x 841.89 points
// 24mm top ≈ 68pt, 18mm sides ≈ 51pt, 20mm bottom ≈ 57pt
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 68,
    paddingBottom: 57,
    paddingHorizontal: 51,
    color: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 4,
    color: "#000000",
  },
  companyInfo: {
    fontSize: 8,
    color: "#000000",
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    marginBottom: 8,
  },
  invoiceMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  invoiceMetaLabel: {
    fontSize: 8,
    color: "#000000",
    width: 70,
    textAlign: "right",
  },
  invoiceMetaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
    color: "#000000",
  },
  reissueBadge: {
    backgroundColor: "#fef3c7",
    color: "#000000",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#cccccc",
    marginVertical: 16,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 7,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#000000",
  },
  cardText: {
    fontSize: 9,
    color: "#000000",
    lineHeight: 1.4,
  },
  summaryRow: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
    gap: 20,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
  colRef: { width: 60 },
  colDate: { width: 70 },
  colDesc: { flex: 1, paddingRight: 8 },
  colNet: { width: 65, textAlign: "right" },
  colVat: { width: 55, textAlign: "right" },
  colGross: { width: 65, textAlign: "right" },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCellText: {
    fontSize: 9,
    color: "#000000",
  },
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 200,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    marginTop: 4,
  },
  totalsLabel: {
    fontSize: 9,
    color: "#000000",
  },
  totalsValue: {
    fontSize: 9,
    textAlign: "right",
    color: "#000000",
  },
  totalsLabelBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  totalsValueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#000000",
  },
  paymentBox: {
    backgroundColor: "#f0f0f0",
    padding: 14,
    borderRadius: 4,
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#000000",
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 8,
    color: "#000000",
    width: 90,
  },
  paymentValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 51,
    right: 51,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#000000",
    textAlign: "center",
  },
});

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface InvoicePdfProps {
  model: InvoicePdfModel;
}

export function InvoicePdf({ model }: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{model.companyName}</Text>
            <Text style={styles.companyInfo}>
              Company No {model.companyNo} • VAT No {model.vatNo}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice No</Text>
              <Text style={styles.invoiceMetaValue}>{model.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice Date</Text>
              <Text style={styles.invoiceMetaValue}>
                {formatDate(model.invoiceDate)}
              </Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Due Date</Text>
              <Text style={styles.invoiceMetaValue}>
                {formatDate(model.dueDate)}
              </Text>
            </View>
            {model.poNumber && (
              <View style={styles.invoiceMetaRow}>
                <Text style={styles.invoiceMetaLabel}>PO Number</Text>
                <Text style={styles.invoiceMetaValue}>{model.poNumber}</Text>
              </View>
            )}
            {model.isReissue && <Text style={styles.reissueBadge}>REISSUE</Text>}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To / From */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.cardLabel}>Bill To</Text>
            <Text style={styles.cardTitle}>{model.billTo.name}</Text>
            {model.billTo.address.map((line, i) => (
              <Text key={i} style={styles.cardText}>
                {line}
              </Text>
            ))}
            {model.billTo.vatNumber && (
              <Text style={[styles.cardText, { marginTop: 4 }]}>
                VAT: {model.billTo.vatNumber}
              </Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.cardLabel}>From</Text>
            <Text style={styles.cardTitle}>{model.billFrom.name}</Text>
            {model.billFrom.address.map((line, i) => (
              <Text key={i} style={styles.cardText}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Artist</Text>
            <Text style={styles.summaryValue}>{model.summary.artist}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Job No</Text>
            <Text style={styles.summaryValue}>{model.summary.jobNo}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Venue</Text>
            <Text style={styles.summaryValue}>{model.summary.venue}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colRef}>
              <Text style={styles.tableHeaderText}>Ref</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.tableHeaderText}>Date</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.colNet}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
                Net
              </Text>
            </View>
            <View style={styles.colVat}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
                VAT
              </Text>
            </View>
            <View style={styles.colGross}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
                Gross
              </Text>
            </View>
          </View>
          {model.lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colRef}>
                <Text style={styles.tableCellText}>{item.ref}</Text>
              </View>
              <View style={styles.colDate}>
                <Text style={styles.tableCellText}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.colDesc}>
                <Text style={styles.tableCellText}>{item.description}</Text>
              </View>
              <View style={styles.colNet}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  {formatNumber(item.net)}
                </Text>
              </View>
              <View style={styles.colVat}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  {formatNumber(item.vat)}
                </Text>
              </View>
              <View style={styles.colGross}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  {formatNumber(item.gross)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals Box */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatNumber(model.subtotal)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                VAT @ {(model.vatRate * 100).toFixed(0)}%
              </Text>
              <Text style={styles.totalsValue}>
                {formatNumber(model.vatAmount)}
              </Text>
            </View>
            <View style={styles.totalsRowBold}>
              <Text style={styles.totalsLabelBold}>TOTAL DUE</Text>
              <Text style={styles.totalsValueBold}>
                £{formatNumber(model.totalDue)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Box */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Payment by BACS</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Sort Code</Text>
            <Text style={styles.paymentValue}>{model.bankSortCode}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Number</Text>
            <Text style={styles.paymentValue}>{model.bankAccountNo}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Name</Text>
            <Text style={styles.paymentValue}>{model.bankAccountName}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Reference</Text>
            <Text style={styles.paymentValue}>{model.invoiceNumber}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {model.companyName} • {model.companyAddress.join(" • ")} • Company
            No {model.companyNo} • VAT No {model.vatNo}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePdf;
