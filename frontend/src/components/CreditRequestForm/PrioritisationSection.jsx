import React from 'react';
import { useTheme } from '@mui/material/styles';
import FormField from '../common/FormField';

// Prioritisation & Business Sponsorship section component
const PrioritisationSection = ({
  priority,
  setPriority,
  requiredByDate,
  setRequiredByDate,
  accountExecutive,
  setAccountExecutive,
  relationshipManager,
  setRelationshipManager,
  relationshipManagersList,
  loadingRelationshipManagers,
  relationshipManagerError,
  businessSponsors,
  loadingBusinessSponsors,
  businessSponsorError,
  selectedBusinessSponsor,
  setSelectedBusinessSponsor,
  selectedSecondBusinessSponsor,
  setSelectedSecondBusinessSponsor,
  justificationForHighPriority,
  setJustificationForHighPriority
}) => {
  const theme = useTheme();
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <FormField
          label="Priority"
          type="select"
          options={[
            { value: '', label: 'Select priority' },
            { value: 'High', label: 'High' },
            { value: 'Medium', label: 'Medium' },
            { value: 'Low', label: 'Low' }
          ]}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
        <FormField 
          label="Required by date" 
          type="date" 
          placeholder="Select required by date" 
          value={requiredByDate}
          onChange={(e) => setRequiredByDate(e.target.value)}
        />

        <FormField 
          label="Account Executive" 
          placeholder="Enter account executive" 
          value={accountExecutive}
          onChange={(e) => setAccountExecutive(e.target.value)}
        />
        {loadingRelationshipManagers ? (
          <div style={{ color: theme.palette.text.secondary, fontSize: '0.95rem' }}>Loading relationship managers...</div>
        ) : relationshipManagerError ? (
          <div style={{ color: theme.palette.error.main, fontSize: '0.95rem' }}>Error: {relationshipManagerError}</div>
        ) : (
          <FormField
            label="Relationship Manager"
            type="select"
            value={relationshipManager} // This will be an ID
            onChange={(e) => setRelationshipManager(e.target.value)}
            options={[
              { value: '', label: relationshipManagersList.length === 0 ? 'No relationship managers found' : 'Select relationship manager' },
              ...relationshipManagersList.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))
            ]}
              required // Assuming this field should be required, adjust if not
          />
        )}
        
        {/* Senior Business Sponsor Dropdown */}
        {loadingBusinessSponsors ? (
          <div style={{ gridColumn: '1 / span 2', color: theme.palette.text.secondary, fontSize: '0.95rem' }}>Loading business sponsors...</div>
        ) : businessSponsorError ? (
          <div style={{ gridColumn: '1 / span 2', color: theme.palette.error.main, fontSize: '0.95rem' }}>Error loading business sponsors: {businessSponsorError}</div>
        ) : (
          <>
            <FormField
              label="Senior Business Sponsor"
              type="select"
              required={true}
              options={[
                { value: '', label: 'Select senior business sponsor' },
                ...businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))
              ]}
              value={selectedBusinessSponsor}
              onChange={(e) => setSelectedBusinessSponsor(e.target.value)}
                />
            <FormField
              label="Optional second Senior Business Sponsor"
              type="select"
              required={false}
              options={[
                { value: '', label: 'Select optional second sponsor' },
                ...businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))
              ]}
              value={selectedSecondBusinessSponsor}
              onChange={(e) => setSelectedSecondBusinessSponsor(e.target.value)}
                />
          </>
        )}
      </div>
      <FormField 
        label="Justification for high priority" 
        type="textarea" 
        placeholder="Enter justification for high priority" 
        value={justificationForHighPriority}
        onChange={(e) => setJustificationForHighPriority(e.target.value)}
      />
    </>
  );
};

export default PrioritisationSection;
