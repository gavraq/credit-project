import React from 'react';
import { useTheme } from '@mui/material/styles';

// Document uploads section component
const DocumentsSection = ({ documents = [], setDocuments }) => {
  const theme = useTheme();
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const removeDocument = (index) => {
    const updatedDocuments = [...documents];
    updatedDocuments.splice(index, 1);
    setDocuments(updatedDocuments);
  };

  return (
    <>
      <div style={{ padding: '1.5rem', border: `1px dashed ${theme.palette.grey[300]}`, borderRadius: '6px', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: theme.palette.grey[400] }}>📄</div>
        <p style={{ fontSize: '0.875rem', color: theme.palette.grey[600], marginBottom: '1rem', fontFamily: theme.typography.fontFamily }}>Drag and drop files here, or click to browse</p>
        <input
          type="file"
          id="document-upload"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="document-upload">
          <button 
            style={{ backgroundColor: 'white', border: `1px solid ${theme.palette.grey[300]}`, color: theme.palette.grey[700], padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', fontFamily: theme.typography.fontFamily }}
            onClick={() => document.getElementById('document-upload').click()}
            type="button"
          >
            Browse Files
          </button>
        </label>
      </div>

      {documents.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', fontFamily: theme.typography.fontFamily, color: theme.palette.grey[700] }}>Selected Documents</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {documents.map((doc, index) => (
              <li 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderBottom: `1px solid ${theme.palette.grey[200]}`,
                  backgroundColor: index % 2 === 0 ? theme.palette.grey[100] : 'white',
                  fontFamily: theme.typography.fontFamily
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>📄</span>
                  <span>{doc.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  style={{ background: 'none', border: 'none', color: theme.palette.secondary.main, cursor: 'pointer', fontSize: '1rem', fontFamily: theme.typography.fontFamily }}
                  title="Remove document"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default DocumentsSection;
