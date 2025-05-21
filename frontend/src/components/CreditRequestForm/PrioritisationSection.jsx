import React from 'react';
import FormField from './FormField';

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
  businessSponsors,
  loadingBusinessSponsors,
  businessSponsorError,
  selectedBusinessSponsor,
  setSelectedBusinessSponsor,
  selectedSecondBusinessSponsor,
  setSelectedSecondBusinessSponsor,
  justificationForHighPriority,
  setJustificationForHighPriority,
  colors
}) => {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <FormField
          label="Priority"
          type="select"
          options={[
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ]}
          placeholder="Select priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          colors={colors}
        />
        <FormField 
          label="Required by date" 
          type="date" 
          placeholder="Select required by date" 
          value={requiredByDate}
          onChange={(e) => setRequiredByDate(e.target.value)}
          colors={colors}
        />

        <FormField 
          label="Account Executive" 
          placeholder="Enter account executive" 
          value={accountExecutive}
          onChange={(e) => setAccountExecutive(e.target.value)}
          colors={colors}
        />
        <FormField 
          label="Relationship Manager" 
          placeholder="Enter relationship manager" 
          value={relationshipManager}
          onChange={(e) => setRelationshipManager(e.target.value)}
          colors={colors}
        />
        
        {/* Senior Business Sponsor Dropdown */}
        {loadingBusinessSponsors ? (
          <div style={{ gridColumn: '1 / span 2', color: '#888', fontSize: '0.95rem' }}>Loading business sponsors...</div>
        ) : businessSponsorError ? (
          <div style={{ gridColumn: '1 / span 2', color: 'red', fontSize: '0.95rem' }}>Error loading business sponsors: {businessSponsorError}</div>
        ) : (
          <>
            <FormField
              label="Senior Business Sponsor"
              type="select"
              required={true}
              options={businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))}
              value={selectedBusinessSponsor}
              placeholder="Select senior business sponsor"
              onChange={(e) => setSelectedBusinessSponsor(e.target.value)}
              colors={colors}
            />
            <FormField
              label="Optional second Senior Business Sponsor"
              type="select"
              required={false}
              options={businessSponsors.map(u => ({ value: u.id, label: `${u.first_name} ${u.last_name} (${u.username})` }))}
              value={selectedSecondBusinessSponsor}
              placeholder="Select optional second sponsor"
              onChange={(e) => setSelectedSecondBusinessSponsor(e.target.value)}
              colors={colors}
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
        colors={colors}
      />
    </>
  );
};

export default PrioritisationSection;
