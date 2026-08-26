import React from 'react';
import FormField from '../common/FormField';

// Relationship information section component
const RelationshipSection = ({
  revenueLast12Months,
  setRevenueLast12Months,
  revenueProjected12Months,
  setRevenueProjected12Months,
  projectedRorwa,
  setProjectedRorwa,
  mostSeniorContact,
  setMostSeniorContact,
  lastClientVisitDate,
  setLastClientVisitDate,
  relationshipComments,
  setRelationshipComments
}) => {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <FormField 
          label="Revenue last 12 months" 
          type="number"
          placeholder="Enter revenue last 12 months" 
          value={revenueLast12Months}
          onChange={(e) => setRevenueLast12Months(e.target.value)}
        />
        <FormField 
          label="Projected revenue next 12 months" 
          type="number"
          placeholder="Enter projected revenue next 12 months" 
          value={revenueProjected12Months}
          onChange={(e) => setRevenueProjected12Months(e.target.value)}
        />
        <FormField 
          label="Projected RoRWA/RoC" 
          type="number"
          placeholder="Enter projected RoRWA/RoC" 
          value={projectedRorwa}
          onChange={(e) => setProjectedRorwa(e.target.value)}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <FormField 
          label="Most senior contact" 
          placeholder="Enter most senior contact" 
          value={mostSeniorContact}
          onChange={(e) => setMostSeniorContact(e.target.value)}
        />
        <FormField 
          label="Date of last client visit" 
          type="date" 
          placeholder="Select date of last client visit" 
          value={lastClientVisitDate}
          onChange={(e) => setLastClientVisitDate(e.target.value)}
        />
      </div>
      <FormField 
        label="Relationship comments" 
        type="textarea" 
        placeholder="Enter relationship comments" 
        value={relationshipComments}
        onChange={(e) => setRelationshipComments(e.target.value)}
      />
    </>
  );
};

export default RelationshipSection;
