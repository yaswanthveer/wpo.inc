import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf 
} from '@react-pdf/renderer';
import type { 
  WorkingPaper, 
  Document as WpoDoc, 
  Procedure, 
  Engagement, 
  Client, 
  Firm, 
  User 
} from '../db/schema';

// Styles matching a professional print-worthy CA audit paper (very thin borders, structured columns, serif headers)
const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1714',
  },
  // Firm Header
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A1714',
    paddingBottom: 10,
    marginBottom: 15,
  },
  firmName: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    color: '#1A1714',
    textTransform: 'uppercase',
  },
  firmDetails: {
    fontSize: 8,
    color: '#48433D',
    marginTop: 2,
  },
  
  // Title Bar
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  wpTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    color: '#1A1714',
    maxWidth: '70%',
  },
  wpRef: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#C49A20',
  },

  // Metadata Card Table
  metaTable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 0.5,
    borderColor: '#E2DCD2',
    backgroundColor: '#FBF6E8', // Light gold tint
    padding: 8,
    marginBottom: 15,
  },
  metaCol: {
    width: '50%',
    padding: 4,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#8C8880',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1A1714',
    marginTop: 1,
  },

  // Section Headers
  sectionHeader: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2DCD2',
    paddingBottom: 3,
    marginTop: 15,
    marginBottom: 8,
    color: '#C49A20',
  },

  // Paragraph Text
  bodyText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#1A1714',
    marginBottom: 10,
  },
  objectiveBox: {
    borderWidth: 0.5,
    borderColor: '#E2DCD2',
    padding: 8,
    backgroundColor: '#FBF6E8',
    marginBottom: 15,
  },

  // Tables
  table: {
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: '#E2DCD2',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2DCD2',
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1714',
    backgroundColor: '#EDE9E0',
    minHeight: 22,
    alignItems: 'center',
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#48433D',
    textTransform: 'uppercase',
    padding: 4,
  },
  td: {
    fontSize: 8,
    padding: 4,
    color: '#1A1714',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#E2DCD2',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#8C8880',
  },
});

interface PdfDocumentProps {
  firm: Firm;
  client: Client;
  engagement: Engagement;
  wp: WorkingPaper;
  docs: WpoDoc[];
  procs: Procedure[];
  preparedBy?: User;
  reviewedBy?: User;
}

const WpPdfDocument: React.FC<PdfDocumentProps> = ({
  firm,
  client,
  engagement,
  wp,
  docs,
  procs,
  preparedBy,
  reviewedBy,
}) => {
  const getDocStatusLabel = (status: WpoDoc['status']) => {
    switch (status) {
      case 'obtained': return 'Obtained';
      case 'alternative': return 'Alt Procedure';
      case 'not-available': return 'Not Available';
      case 'skip-justified': return 'Skip Justified';
      default: return 'Pending';
    }
  };

  const getProcStatusLabel = (status: Procedure['status']) => {
    switch (status) {
      case 'done': return 'Completed';
      case 'skipped': return 'Skipped';
      default: return 'Pending';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Firm Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.firmName}>{firm.name}</Text>
          <Text style={styles.firmDetails}>
            Chartered Accountants | FRN: {firm.registration_number || 'N/A'} | {firm.city || ''}, {firm.state || ''}
          </Text>
        </View>

        {/* Working Paper Reference & Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.wpTitle}>{wp.title}</Text>
          <Text style={styles.wpRef}>{wp.reference_code}</Text>
        </View>

        {/* Engagement Details Card */}
        <View style={styles.metaTable}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Client Name</Text>
            <Text style={styles.metaVal}>{client.name}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Audit Engagement / Period</Text>
            <Text style={styles.metaVal}>{engagement.engagement_type} ({engagement.financial_year})</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Prepared By (Sign-off)</Text>
            <Text style={styles.metaVal}>
              {preparedBy ? `${preparedBy.full_name} (${preparedBy.initials})` : 'Draft'}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Reviewed By (Sign-off)</Text>
            <Text style={styles.metaVal}>
              {reviewedBy ? `${reviewedBy.full_name} (${reviewedBy.initials})` : 'Not yet reviewed'}
            </Text>
          </View>
        </View>

        {/* Objective */}
        {wp.objective && (
          <View>
            <Text style={styles.sectionHeader}>Audit Objective</Text>
            <View style={styles.objectiveBox}>
              <Text style={[styles.bodyText, { marginBottom: 0 }]}>{wp.objective}</Text>
            </View>
          </View>
        )}

        {/* Documents Table */}
        <View>
          <Text style={styles.sectionHeader}>1. Audit Evidence & Documentation Checklist</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: '15%' }]}>Reference</Text>
              <Text style={[styles.th, { width: '45%' }]}>Expected Document Name</Text>
              <Text style={[styles.th, { width: '15%' }]}>Status</Text>
              <Text style={[styles.th, { width: '25%' }]}>Audit Note / Attachment</Text>
            </View>
            {docs.map((doc, index) => (
              <View key={doc.id || index} style={styles.tableRow}>
                <Text style={[styles.td, { width: '15%', fontFamily: 'Helvetica-Bold' }]}>{doc.reference_code || '-'}</Text>
                <Text style={[styles.td, { width: '45%' }]}>{doc.name}</Text>
                <Text style={[styles.td, { width: '15%' }]}>{getDocStatusLabel(doc.status)}</Text>
                <Text style={[styles.td, { width: '25%', fontSize: 7, color: '#48433D' }]}>
                  {doc.status === 'obtained' ? (doc.file_name || 'Obtained') : (doc.note || '-')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Procedures Table */}
        <View>
          <Text style={styles.sectionHeader}>2. Audit Procedures & Substantiations</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: '8%' }]}>No.</Text>
              <Text style={[styles.th, { width: '57%' }]}>Procedure Description</Text>
              <Text style={[styles.th, { width: '15%' }]}>Status</Text>
              <Text style={[styles.th, { width: '20%' }]}>Sign-off & Date</Text>
            </View>
            {procs.map((proc, index) => (
              <View key={proc.id || index} style={styles.tableRow}>
                <Text style={[styles.td, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[styles.td, { width: '57%' }]}>{proc.description}</Text>
                <Text style={[styles.td, { width: '15%' }]}>{getProcStatusLabel(proc.status)}</Text>
                <Text style={[styles.td, { width: '20%', fontSize: 7 }]}>
                  {proc.status === 'done' ? `Done (${proc.performed_at})` : (proc.status === 'skipped' ? 'Skipped' : '-')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Observations */}
        {wp.observations && (
          <View>
            <Text style={styles.sectionHeader}>3. Observations & Findings</Text>
            <Text style={styles.bodyText}>{wp.observations}</Text>
          </View>
        )}

        {/* Conclusion */}
        <View wrap={false}>
          <Text style={styles.sectionHeader}>4. Audit Conclusion & Judgment</Text>
          <View style={{ borderWidth: 0.5, borderColor: '#1A1714', padding: 10, minHeight: 60 }}>
            <Text style={[styles.bodyText, { fontFamily: 'Times-Roman', fontStyle: 'italic', marginBottom: 0 }]}>
              {wp.conclusion || 'No audit conclusion recorded by the preparing auditor.'}
            </Text>
          </View>
          <Text style={{ fontSize: 6, color: '#8C8880', marginTop: 4 }}>
            * Note: This conclusion represents the auditor's professional judgment on sufficiency and appropriateness of evidence obtained.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>WPO.inc — Audit Documentation Operating System. July 1, 1949 Mandate.</Text>
          <Text>Prepared under Standard on Auditing (SA) 230.</Text>
        </View>
      </Page>
    </Document>
  );
};

// Exporter function to download the pdf
export const exportWorkingPaperPdf = async (
  firm: Firm,
  client: Client,
  engagement: Engagement,
  wp: WorkingPaper,
  docs: WpoDoc[],
  procs: Procedure[],
  preparedBy?: User,
  reviewedBy?: User
) => {
  const doc = (
    <WpPdfDocument
      firm={firm}
      client={client}
      engagement={engagement}
      wp={wp}
      docs={docs}
      procs={procs}
      preparedBy={preparedBy}
      reviewedBy={reviewedBy}
    />
  );
  
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${wp.reference_code}_${client.name.replace(/\s+/g, '_')}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
