import React, { useState } from 'react';

const CreditQuestionnaireForm = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7'
  };

  // Workflow Status Component
  const WorkflowStatus = ({ currentStep = 3 }) => {
    const steps = [
      'Credit Request',
      'Credit Review',
      'Business Sponsorship',
      'Analysis',
      'Credit Paper',
      'Approval'
    ];
    
    return (
      <div className="py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  index < currentStep 
                    ? 'bg-teal-500' 
                    : index === currentStep 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300'
                } ${index <= currentStep ? 'text-white' : 'text-gray-500'}`}>
                  {index < currentStep ? (
                    '✓'
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs ${
                  index === currentStep ? 'font-medium text-gray-800' : 'text-gray-500'
                }`}>
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-grow h-1 ${
                  index < currentStep ? 'bg-teal-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Form Field Component
  const FormField = ({ label, type = "text", placeholder, required = false }) => {
    return (
      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        
        {type === "textarea" ? (
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
            placeholder={placeholder}
            rows={3}
          />
        ) : type === "select" ? (
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm bg-white shadow-sm"
          >
            <option value="">{placeholder || "Select an option"}</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
          </select>
        ) : type === "checkbox" ? (
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label className="ml-2 text-sm text-gray-700">
              {placeholder}
            </label>
          </div>
        ) : (
          <input
            type={type}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  // Form Section Component
  const FormSection = ({ title, description, children }) => {
    return (
      <div className="border border-gray-300 rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-gray-500 mb-4">
            {description}
          </p>
        )}
        
        {children}
      </div>
    );
  };

  // Version Control Header Component
  const VersionControlHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <span className="font-medium mr-2">Version:</span>
            <span className="bg-gray-100 text-gray-800 rounded-full text-xs font-medium px-2.5 py-0.5">
              Draft - v0.2
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last saved: May 6, 2025, 09:30 AM
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium">
            <span className="mr-1">↓</span>
            Save Version
          </button>
          
          <button className="flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium">
            <span className="mr-1">👁</span>
            View History
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold mr-4">Credit Questionnaire</h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            CR-2025-0124
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          ABC Corporation - Analysis Phase
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <WorkflowStatus currentStep={3} />
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <VersionControlHeader />
        
        {/* Tabs for Questionnaire Sections */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'general', label: 'Business Model' },
            { id: 'trading', label: 'Trading Activities' },
            { id: 'risk', label: 'Risk Management' },
            { id: 'funding', label: 'Funding & Liquidity' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-5 border-b-2 text-sm font-medium ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Business Model Tab Content */}
        {activeTab === 'general' && (
          <FormSection 
            title="Business Model Overview" 
            description="Provide details on the counterparty's business model and operations."
          >
            <FormField 
              label="Business Model Details" 
              type="textarea" 
              placeholder="Describe the counterparty's core business model, key products/services, and market position"
              required={true}
            />
            
            <FormField 
              label="Key Suppliers and Customers" 
              type="textarea" 
              placeholder="List major suppliers and customers, including concentration percentages if available"
              required={true}
            />
          </FormSection>
        )}
        
        {/* Trading Activities Tab Content */}
        {activeTab === 'trading' && (
          <FormSection 
            title="Trading Activities" 
            description="Provide details on the counterparty's trading activities and rationale."
          >
            <FormField 
              label="Trading Activity Rationale" 
              type="textarea" 
              placeholder="Explain the business rationale behind the counterparty's trading activities"
              required={true}
            />
            
            <FormField 
              label="Trading Flow Drivers" 
              type="textarea" 
              placeholder="Describe the key drivers of trading flows and volumes"
              required={true}
            />
            
            <FormField 
              label="Position Size Determinants" 
              type="textarea" 
              placeholder="Explain how position sizes are determined and what limits are in place"
              required={true}
            />
            
            <FormField 
              label="Trading Policy & Governance" 
              type="textarea" 
              placeholder="Describe the governance structure and oversight of trading activities"
              required={true}
            />
          </FormSection>
        )}
        
        {/* Risk Management Tab Content */}
        {activeTab === 'risk' && (
          <FormSection 
            title="Risk Management" 
            description="Provide details on the counterparty's risk management approach."
          >
            <FormField 
              label="Hedge Effectiveness" 
              type="textarea" 
              placeholder="Describe how the effectiveness of hedges is measured and monitored"
              required={true}
            />
            
            <FormField 
              label="Hedge Accounting Approach" 
              type="textarea" 
              placeholder="Explain the accounting treatment for hedging activities"
              required={true}
            />
            
            <FormField 
              label="Stress Testing Methodology" 
              type="textarea" 
              placeholder="Detail the stress testing approaches used to assess risk exposures"
              required={true}
            />
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <FormField 
                label="Value at Risk (VaR) Methodology" 
                type="select" 
                placeholder="Select methodology"
              />
              
              <FormField 
                label="Risk Management System" 
                type="select" 
                placeholder="Select system"
              />
            </div>
          </FormSection>
        )}
        
        {/* Funding & Liquidity Tab Content */}
        {activeTab === 'funding' && (
          <>
            <FormSection 
              title="Funding & Liquidity" 
              description="Provide details on the counterparty's funding sources and liquidity management."
            >
              <FormField 
                label="Cash Management Approach" 
                type="textarea" 
                placeholder="Describe how cash positions are managed across the organization"
                required={true}
              />
              
              <FormField 
                label="Notional Position Details" 
                type="textarea" 
                placeholder="Provide details on typical notional position sizes and distribution"
                required={true}
              />
              
              <FormField 
                label="Liquidity Management" 
                type="textarea" 
                placeholder="Explain liquidity management strategies and contingency planning"
                required={true}
              />
              
              <FormField 
                label="Banking Relationships" 
                type="textarea" 
                placeholder="List key banking relationships and credit facilities"
                required={true}
              />
            </FormSection>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
              <div className="text-blue-600 mr-3 flex-shrink-0 mt-0.5">ℹ️</div>
              <p className="text-sm text-blue-800">
                Please attach the latest liquidity reports and covenant compliance certificates if available. Supporting documentation can be uploaded by clicking the "Attach Document" button below.
              </p>
            </div>
            
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium mb-6">
              <span className="mr-2">📎</span>
              Attach Document
            </button>
          </>
        )}
        
        <div className="flex justify-between mt-8">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium">
            <span className="mr-2">←</span>
            Back
          </button>
          
          <div className="flex gap-4">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium">
              Save as Draft
            </button>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
              Submit Questionnaire
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditQuestionnaireForm;