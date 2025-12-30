import React, { useState } from 'react';

const CreditAnalysisForm = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [financialYears, setFinancialYears] = useState(['2023', '2024', '2025']);
  
  // Brand colors
  const colors = {
    icbcRed: '#e31937',
    standardBankBlue: '#0c4da2',
    redLight: '#fde8eb',
    blueLight: '#e6edf7',
    neutral100: '#FFFFFF',
    neutral200: '#F5F7FA',
    neutral300: '#E4E7EB',
    neutral400: '#CBD2D9',
    neutral500: '#9AA5B1',
    neutral600: '#7B8794',
    neutral700: '#4A5568',
    neutral800: '#323F4B',
    neutral900: '#1F2933',
    success: '#38B2AC',
    warning: '#F6AD55',
    error: '#E53E3E'
  };
  
  // Tab options
  const tabOptions = [
    "Basic Details",
    "Executive Summary",
    "Financial Analysis",
    "Risk Assessment",
    "Climate Scorecard",
    "Supporting Documents"
  ];
  
  // Handler to add a new financial year column
  const handleAddYear = () => {
    const lastYear = parseInt(financialYears[financialYears.length - 1]);
    setFinancialYears([...financialYears, (lastYear + 1).toString()]);
  };
  
  // Handler to remove the last financial year column
  const handleRemoveYear = () => {
    if (financialYears.length > 1) {
      setFinancialYears(financialYears.slice(0, -1));
    }
  };
  
  // Workflow Status Component
  const WorkflowStatus = () => {
    const steps = [
      'Credit Request',
      'Credit Review',
      'Business Sponsorship',
      'Analysis',
      'Credit Paper',
      'Approval'
    ];
    const currentStep = 3;
    
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
  
  // Version Control Header Component
  const VersionControlHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center">
            <span className="font-medium mr-2">Version:</span>
            <span className="bg-gray-100 text-gray-800 rounded-full text-xs font-medium px-2.5 py-0.5">
              Draft - v0.3
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last saved: May 7, 2025, 11:45 AM
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium">
            <span className="mr-1">💾</span>
            Save Version
          </button>
          
          <button className="flex items-center px-2.5 py-1.5 border border-gray-300 rounded text-xs font-medium">
            <span className="mr-1">🕒</span>
            View History
          </button>
        </div>
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

  // Form Field Component
  const FormField = ({ label, type = "text", placeholder, required = false, value = "" }) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        )}
        
        {type === "textarea" ? (
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm"
            placeholder={placeholder}
            rows={3}
            defaultValue={value}
          />
        ) : type === "select" ? (
          <select
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-sm bg-white shadow-sm"
            defaultValue={value}
          >
            <option value="">{placeholder || "Select an option"}</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        ) : type === "checkbox" ? (
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              defaultChecked={value}
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
            defaultValue={value}
          />
        )}
      </div>
    );
  };
  
  // Credit Facility Item Component
  const CreditFacilityItem = ({ facility }) => {
    return (
      <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-base font-medium">{facility.type}</h4>
          <button className="text-red-600 hover:text-red-800">
            <span>❌</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Limit:</p>
            <p className="text-sm font-medium">${facility.currentLimit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Requested Limit:</p>
            <p className="text-sm font-medium">${facility.requestedLimit.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tenor:</p>
            <p className="text-sm font-medium">{facility.tenor} months</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Change:</p>
            <p className={`text-sm font-medium ${facility.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {facility.change > 0 ? '+' : ''}{facility.change.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Sample data
  const facilities = [
    { 
      type: 'Term Loan', 
      currentLimit: 3000000, 
      requestedLimit: 5000000, 
      tenor: 24,
      change: 2000000 
    },
    { 
      type: 'Trading Line', 
      currentLimit: 1500000, 
      requestedLimit: 2500000, 
      tenor: 12,
      change: 1000000 
    }
  ];
  
  // Financial data
  const financialData = {
    totalAssets: { '2023': '165000000', '2024': '178500000', '2025': '' },
    totalLiabilities: { '2023': '98000000', '2024': '103400000', '2025': '' },
    totalEquity: { '2023': '67000000', '2024': '75100000', '2025': '' },
    revenue: { '2023': '85000000', '2024': '95500000', '2025': '' },
    ebitda: { '2023': '15300000', '2024': '17840000', '2025': '' },
    netIncome: { '2023': '7100000', '2024': '9085000', '2025': '' },
    debtToEbitda: { '2023': '2.8', '2024': '2.3', '2025': '' },
    interestCoverage: { '2023': '4.7', '2024': '5.8', '2025': '' },
    roe: { '2023': '10.6', '2024': '12.1', '2025': '' },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with basic information */}
      <div className="bg-blue-700 p-6 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              Credit Analysis
              <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                CR-2025-0123
              </span>
            </h1>
            <p className="text-blue-100 mt-1">ABC Corporation - Analysis Phase</p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white text-blue-700 font-medium rounded hover:bg-blue-50">
              Save Draft
            </button>
            <button className="px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700">
              Submit Analysis
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Workflow Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <WorkflowStatus />
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <VersionControlHeader />
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar">
            {tabOptions.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === index 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          {/* Basic Details Tab */}
          {activeTab === 0 && (
            <>
              <FormSection 
                title="Basic Information" 
                description="Provide basic details about the counterparty."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField 
                    label="Counterparty Name" 
                    value="ABC Corporation"
                    required={true}
                  />
                  <FormField 
                    label="Counterparty CIF ID" 
                    value="CIF78921035"
                  />
                  <FormField 
                    label="Country of Risk" 
                    value="Singapore"
                    required={true}
                  />
                  <FormField 
                    label="Request Number" 
                    value="CR-2025-0123"
                  />
                  <FormField 
                    label="Revenue (Last 12 Months)" 
                    type="number" 
                    value="95500000"
                    placeholder="Enter amount in USD" 
                    required={true}
                  />
                  <FormField 
                    label="Projected Revenue (Next 12 Months)" 
                    type="number" 
                    value="105000000"
                    placeholder="Enter projected amount in USD" 
                    required={true}
                  />
                  <FormField 
                    label="Business Activity" 
                    type="textarea" 
                    value="ABC Corporation is a diversified industrial manufacturing company with operations across Southeast Asia. The company specializes in precision engineering components for automotive, aerospace, and consumer electronics industries. Primary manufacturing facilities are located in Singapore, Malaysia, and Vietnam."
                    placeholder="Describe the main business activities"
                    required={true}
                  />
                </div>
              </FormSection>
              
              <FormSection 
                title="Credit Facilities" 
                description="Current and requested credit facilities."
              >
                <div className="space-y-2 mb-4">
                  {facilities.map((facility, index) => (
                    <CreditFacilityItem 
                      key={index} 
                      facility={facility}
                    />
                  ))}
                </div>
                
                <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded border border-blue-200 text-sm font-medium">
                  <span className="mr-2">➕</span>
                  Add Facility
                </button>
              </FormSection>
            </>
          )}
          
          {/* Financial Analysis Tab */}
          {activeTab === 2 && (
            <>
              <FormSection 
                title="Financial Data" 
                description="Key financial figures and ratios."
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold">Financial Years</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddYear}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded border border-blue-200"
                    >
                      <span className="inline mr-1">➕</span>
                      Add Year
                    </button>
                    <button
                      onClick={handleRemoveYear}
                      disabled={financialYears.length <= 1}
                      className={`px-3 py-1 text-xs rounded border ${
                        financialYears.length <= 1
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}
                    >
                      <span className="inline mr-1">❌</span>
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Item</th>
                        {financialYears.map(year => (
                          <th key={year} className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {year}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-gray-50">
                        <td colSpan={financialYears.length + 1} className="px-4 py-2 text-sm font-semibold">
                          Balance Sheet
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Total Assets</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.totalAssets[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Total Liabilities</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.totalLiabilities[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Total Equity</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.totalEquity[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={financialYears.length + 1} className="px-4 py-2 text-sm font-semibold">
                          Income Statement
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Revenue</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.revenue[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">EBITDA</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.ebitda[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Net Income</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.netIncome[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={financialYears.length + 1} className="px-4 py-2 text-sm font-semibold">
                          Key Ratios
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Debt-to-EBITDA</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.debtToEbitda[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Interest Coverage Ratio</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.interestCoverage[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm">Return on Equity (%)</td>
                        {financialYears.map(year => (
                          <td key={year} className="px-4 py-2">
                            <input
                              type="text"
                              className="w-full text-right p-1 text-sm border border-gray-300 rounded"
                              defaultValue={financialData.roe[year] || ''}
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <button className="flex items-center text-sm text-blue-600 font-medium mb-4">
                  <span className="mr-1">➕</span>
                  Add Custom Financial Item
                </button>
                
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Financial Analysis Comments</h4>
                  <FormField 
                    type="textarea" 
                    placeholder="Provide your analysis of the financial data..."
                    value="ABC Corporation has shown consistent financial improvement over the past two years. Revenue growth of 12.5% year-over-year has been complemented by improved operational efficiency, resulting in EBITDA margin expansion from 18.0% to 18.7%. Key improvements include debt reduction, with Debt-to-EBITDA improving from 2.8x to 2.3x, and stronger interest coverage at 5.8x (up from 4.7x). These improvements reflect management's focus on operational efficiency and prudent financial management. Cash flow generation remains strong, with adequate coverage for the proposed increased facilities."
                  />
                </div>
              </FormSection>
            </>
          )}
          
          {/* Display placeholder for other tabs */}
          {(activeTab === 1 || activeTab === 3 || activeTab === 4 || activeTab === 5) && (
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {tabOptions[activeTab]} Content
              </h3>
              <p className="text-gray-500">
                This tab's content would be displayed here. The implementation follows the same pattern as the other tabs.
              </p>
            </div>
          )}
          
          {/* Bottom Action Buttons */}
          <div className="flex justify-between mt-8">
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded text-sm font-medium">
              <span className="mr-2">←</span>
              Back to Dashboard
            </button>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded text-sm font-medium">
                Save as Draft
              </button>
              
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium">
                Submit Analysis
                <span className="ml-2">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditAnalysisForm;