import React from 'react';

// Document uploads section component
const DocumentsSection = ({ colors, documents, setDocuments }) => {
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
      <div style={{ padding: '1.5rem', border: `1px dashed ${colors.neutral400}`, borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: colors.neutral500 }}>📄</div>
        <p style={{ fontSize: '0.875rem', color: colors.neutral700, marginBottom: '1rem' }}>Drag and drop files here, or click to browse</p>
        <input
          type="file"
          id="document-upload"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="document-upload">
          <button 
            style={{ backgroundColor: 'white', border: `1px solid ${colors.neutral400}`, color: colors.neutral800, padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}
            onClick={() => document.getElementById('document-upload').click()}
            type="button"
          >
            Browse Files
          </button>
        </label>
      </div>

      {documents.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Selected Documents</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {documents.map((doc, index) => (
              <li 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderBottom: `1px solid ${colors.neutral300}`,
                  backgroundColor: index % 2 === 0 ? colors.neutral200 : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '0.5rem' }}>📄</span>
                  <span>{doc.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  style={{ background: 'none', border: 'none', color: colors.icbcRed, cursor: 'pointer', fontSize: '1rem' }}
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
