import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define CVData interface locally to avoid import issues
interface CVData {
  fullName: string;
  jobTitle: string;
  email: string;
  phoneNumber: string;
  address: string;
  professionalSummary: string;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationYear: string;
  }>;
  skills: string;
  projects: Array<{
    name: string;
    description: string;
    technologies: string;
    startDate: string;
    endDate?: string;
    url?: string;
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    url?: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  interests: Array<{
    category: string;
    items: string;
  }>;
  references: Array<{
    name: string;
    position: string;
    company: string;
    email: string;
    phone?: string;
  }>;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
  },
  contact: {
    fontSize: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1 solid #000',
    paddingBottom: 2,
  },
  experienceItem: {
    marginBottom: 10,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  company: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 10,
    color: '#666',
  },
  position: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  projectItem: {
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    margin: 2,
    fontSize: 9,
    borderRadius: 3,
  },
});

interface CVPDFDocumentProps {
  cvData: CVData;
}

const CVPDFDocument: React.FC<CVPDFDocumentProps> = ({ cvData }) => {
  console.log('CVPDFDocument rendering with data:', cvData);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{cvData.fullName || 'Your Name'}</Text>
          <Text style={styles.title}>{cvData.jobTitle || 'Your Title'}</Text>
          <View style={styles.contact}>
            <Text>{cvData.email || 'your.email@example.com'}</Text>
            <Text>{cvData.phoneNumber || 'Your Phone'}</Text>
            <Text>{cvData.address || 'Your Address'}</Text>
          </View>
        </View>

        {/* Summary */}
        {cvData.professionalSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.description}>{cvData.professionalSummary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {cvData.workExperience && cvData.workExperience.length > 0 && cvData.workExperience[0].company && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {cvData.workExperience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.company}>{exp.company}</Text>
                  <Text style={styles.date}>{exp.startDate} - {exp.endDate}</Text>
                </View>
                <Text style={styles.position}>{exp.jobTitle}</Text>
                <Text style={styles.description}>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {cvData.projects && cvData.projects.length > 0 && cvData.projects[0].name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {cvData.projects.map((project, index) => (
              <View key={index} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.name}</Text>
                <Text style={styles.projectDescription}>{project.description}</Text>
                {project.technologies && (
                  <Text style={styles.description}>Technologies: {project.technologies}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {cvData.skills && cvData.skills.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.description}>{cvData.skills}</Text>
          </View>
        )}

        {/* Education */}
        {cvData.education && cvData.education.length > 0 && cvData.education[0].institution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {cvData.education.map((edu, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.company}>{edu.institution}</Text>
                  <Text style={styles.date}>{edu.graduationYear}</Text>
                </View>
                <Text style={styles.position}>{edu.degree}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default CVPDFDocument;
