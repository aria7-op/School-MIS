import React from 'react';
import { useTranslation } from 'react-i18next';

const GradeManagement: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('teacherPortal.grades.title')}</h1>
        <p style={styles.subtitle}>
          {t('teacherPortal.grades.subtitle')}
        </p>
      </div>
      
      <div style={styles.content}>
        <span className="material-icons" style={{ fontSize: 64, color: '#9CA3AF' }}>
          grade
        </span>
        <h2 style={styles.message}>{t('teacherPortal.grades.comingSoonTitle')}</h2>
        <p style={styles.description}>
          {t('teacherPortal.grades.comingSoonDescription')}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    minHeight: '100vh',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    margin: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    margin: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 40,
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    margin: '16px 0 8px 0',
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    margin: 0,
  },
};

export default GradeManagement;