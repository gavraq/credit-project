import React from 'react';
import TopNavBar from '../TopNavBar'; // Assuming TopNavBar is in components/
import WorkflowStatus from './WorkflowStatus';
import WorkflowActions from './WorkflowActions';

const FormPageWrapper = ({
  title,
  workflowStatusProps,
  workflowActionsProps,
  children,
}) => {
  // Destructure key from props to apply it directly, avoiding React's spread warning.
  const { key, ...restActionsProps } = workflowActionsProps || {};
  return (
    <div className="flex flex-col min-h-screen bg-gray-100"> {/* Ensure full page background */}
      <TopNavBar />
      <main className="flex-grow p-6"> {/* Removed bg-gray-100 from here as it's on parent */}
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg">
          {workflowStatusProps && (
            <div style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingTop: '2rem' }}>
              <WorkflowStatus {...workflowStatusProps} />
            </div>
          )}
          
          {title && (
            <div style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
              <h1 className="text-3xl font-bold text-gray-800 mb-6 mt-4">
                {title}
              </h1>
            </div>
          )}
          
          <div className="form-content" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            {children}
          </div>
          
          {workflowActionsProps && (
            <div className="mt-8 pt-6 border-t border-gray-200" style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingBottom: '2rem' }}>
              <WorkflowActions key={key} {...restActionsProps} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FormPageWrapper;
