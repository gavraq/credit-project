# Credit Risk Dashboard Implementation

This document details the implementation of the Dashboard component in the Credit Risk Workflow application, which provides users with an overview of credit requests and analytics.

## Table of Contents
1. [Overview](#1-overview)
2. [Backend Implementation](#2-backend-implementation)
3. [Frontend Implementation](#3-frontend-implementation)
4. [API Endpoints](#4-api-endpoints)
5. [Integration with Other Components](#5-integration-with-other-components)

## 1. Overview

The Dashboard serves as the main landing page after authentication, providing:
- A summary of credit applications by status
- Quick access to applications requiring attention
- Analytics on credit application processing
- Recent activity and notifications

## 2. Backend Implementation

### 2.1 Dashboard API Views

```python
# credit_applications/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q
from .models import CreditApplication
from workflow.models import WorkflowInstance

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Provides dashboard statistics for the authenticated user based on their role.
        """
        user = request.user
        user_department = user.department
        
        # Base queryset
        applications = CreditApplication.objects.all()
        
        # Filter by department/role if needed
        if not user.is_superuser and user.role != 'admin':
            if user.role == 'credit_officer':
                applications = applications.filter(
                    Q(assigned_to=user) | 
                    Q(workflow_instance__current_state__role_permissions__contains=[user.role])
                )
            elif user.role == 'relationship_manager':
                applications = applications.filter(created_by=user)
            elif user.department:
                applications = applications.filter(
                    workflow_instance__current_state__department_permissions__contains=[user_department]
                )
        
        # Get counts by status
        status_counts = applications.values(
            'workflow_instance__current_state__name'
        ).annotate(
            count=Count('id')
        ).order_by('workflow_instance__current_state__name')
        
        # Get counts by application type
        type_counts = applications.values(
            'application_type'
        ).annotate(
            count=Count('id')
        ).order_by('application_type')
        
        # Get recent applications
        recent_applications = applications.order_by('-created_at')[:5].values(
            'id', 'reference_number', 'counterparty_name', 
            'workflow_instance__current_state__name', 'created_at'
        )
        
        # Get applications requiring action
        action_required = applications.filter(
            workflow_instance__current_state__role_permissions__contains=[user.role]
        ).order_by('-updated_at')[:5].values(
            'id', 'reference_number', 'counterparty_name', 
            'workflow_instance__current_state__name', 'updated_at'
        )
        
        return Response({
            'status_counts': status_counts,
            'type_counts': type_counts,
            'recent_applications': recent_applications,
            'action_required': action_required
        })

class UserActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Provides activity statistics for the authenticated user.
        """
        user = request.user
        
        # Applications created by user
        created_count = CreditApplication.objects.filter(created_by=user).count()
        
        # Applications assigned to user
        assigned_count = CreditApplication.objects.filter(assigned_to=user).count()
        
        # Recent transitions performed by user
        recent_transitions = WorkflowInstance.objects.filter(
            transitions__performed_by=user
        ).order_by('-transitions__timestamp')[:5].values(
            'credit_application__id', 
            'credit_application__reference_number',
            'transitions__from_state__name',
            'transitions__to_state__name',
            'transitions__timestamp'
        )
        
        return Response({
            'created_count': created_count,
            'assigned_count': assigned_count,
            'recent_transitions': recent_transitions
        })
```

### 2.2 URL Configuration

```python
# credit_applications/urls.py
from django.urls import path
from .views import DashboardStatsView, UserActivityView

urlpatterns = [
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/dashboard/user-activity/', UserActivityView.as_view(), name='user-activity'),
]
```

## 3. Frontend Implementation

### 3.1 Dashboard Component

```jsx
// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table } from 'react-bootstrap';
import { apiService } from '../../services/apiService';
import StatusChart from './StatusChart';
import TypeChart from './TypeChart';
import ActivityFeed from './ActivityFeed';
import ActionItems from './ActionItems';
import { formatDate } from '../../utils/dateUtils';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getUserActivity()
        ]);
        
        setStats(statsResponse.data);
        setUserActivity(activityResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh dashboard data every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleCreateApplication = () => {
    navigate('/credit-request/new');
  };

  const handleViewApplication = (id) => {
    navigate(`/credit-request/${id}`);
  };

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;

  return (
    <Container fluid className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <h1>Credit Risk Dashboard</h1>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={handleCreateApplication}
            className="create-application-btn"
          >
            Create New Application
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6} lg={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Applications Created</Card.Title>
              <Card.Text className="dashboard-stat">
                {userActivity?.created_count || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Assigned to You</Card.Title>
              <Card.Text className="dashboard-stat">
                {userActivity?.assigned_count || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Pending Review</Card.Title>
              <Card.Text className="dashboard-stat">
                {stats?.status_counts?.find(s => s.workflow_instance__current_state__name === 'Pending Review')?.count || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="dashboard-card">
            <Card.Body>
              <Card.Title>Approved</Card.Title>
              <Card.Text className="dashboard-stat">
                {stats?.status_counts?.find(s => s.workflow_instance__current_state__name === 'Approved')?.count || 0}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header>Applications by Status</Card.Header>
            <Card.Body>
              <StatusChart data={stats?.status_counts || []} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header>Applications by Type</Card.Header>
            <Card.Body>
              <TypeChart data={stats?.type_counts || []} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header>Action Required</Card.Header>
            <Card.Body>
              <ActionItems 
                items={stats?.action_required || []} 
                onViewItem={handleViewApplication}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="dashboard-card">
            <Card.Header>Recent Activity</Card.Header>
            <Card.Body>
              <ActivityFeed 
                activities={userActivity?.recent_transitions || []} 
                onViewItem={handleViewApplication}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
```

### 3.2 Chart Components

```jsx
// src/components/Dashboard/StatusChart.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const StatusChart = ({ data }) => {
  // Define colors for different statuses
  const statusColors = {
    'Draft': 'rgba(108, 117, 125, 0.7)',
    'Submitted': 'rgba(0, 123, 255, 0.7)',
    'Pending Review': 'rgba(255, 193, 7, 0.7)',
    'Under Review': 'rgba(23, 162, 184, 0.7)',
    'Approved': 'rgba(40, 167, 69, 0.7)',
    'Rejected': 'rgba(220, 53, 69, 0.7)',
    'Returned': 'rgba(253, 126, 20, 0.7)'
  };

  const chartData = {
    labels: data.map(item => item.workflow_instance__current_state__name),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => 
          statusColors[item.workflow_instance__current_state__name] || 'rgba(128, 128, 128, 0.7)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      {data.length > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="text-center mt-5">No data available</div>
      )}
    </div>
  );
};

export default StatusChart;

// src/components/Dashboard/TypeChart.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const TypeChart = ({ data }) => {
  // Define colors for different application types
  const typeColors = {
    'New Credit': 'rgba(54, 162, 235, 0.7)',
    'Credit Review': 'rgba(255, 99, 132, 0.7)',
    'Limit Increase': 'rgba(75, 192, 192, 0.7)',
    'Limit Extension': 'rgba(153, 102, 255, 0.7)',
    'Limit Reduction': 'rgba(255, 159, 64, 0.7)'
  };

  const chartData = {
    labels: data.map(item => item.application_type),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: data.map(item => 
          typeColors[item.application_type] || 'rgba(128, 128, 128, 0.7)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      {data.length > 0 ? (
        <Doughnut data={chartData} options={options} />
      ) : (
        <div className="text-center mt-5">No data available</div>
      )}
    </div>
  );
};

export default TypeChart;
```

### 3.3 Action Items and Activity Feed Components

```jsx
// src/components/Dashboard/ActionItems.jsx
import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { formatDate } from '../../utils/dateUtils';

const ActionItems = ({ items, onViewItem }) => {
  if (!items || items.length === 0) {
    return <p className="text-center">No items requiring action</p>;
  }

  return (
    <Table responsive hover className="action-items-table">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Counterparty</th>
          <th>Status</th>
          <th>Updated</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.reference_number}</td>
            <td>{item.counterparty_name}</td>
            <td>
              <span className={`status-badge status-${item.workflow_instance__current_state__name.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.workflow_instance__current_state__name}
              </span>
            </td>
            <td>{formatDate(item.updated_at)}</td>
            <td>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => onViewItem(item.id)}
              >
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ActionItems;

// src/components/Dashboard/ActivityFeed.jsx
import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { formatDate } from '../../utils/dateUtils';

const ActivityFeed = ({ activities, onViewItem }) => {
  if (!activities || activities.length === 0) {
    return <p className="text-center">No recent activity</p>;
  }

  return (
    <ListGroup className="activity-feed">
      {activities.map((activity, index) => (
        <ListGroup.Item 
          key={`${activity.credit_application__id}-${index}`}
          action
          onClick={() => onViewItem(activity.credit_application__id)}
          className="activity-item"
        >
          <div className="activity-content">
            <div className="activity-header">
              <span className="activity-ref">{activity.credit_application__reference_number}</span>
              <span className="activity-time">{formatDate(activity.transitions__timestamp)}</span>
            </div>
            <div className="activity-transition">
              <span className="transition-from">{activity.transitions__from_state__name}</span>
              <span className="transition-arrow">→</span>
              <span className="transition-to">{activity.transitions__to_state__name}</span>
            </div>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default ActivityFeed;
```

### 3.4 Dashboard Styling

```css
/* src/components/Dashboard/Dashboard.css */
.dashboard-container {
  padding: 20px;
}

.dashboard-card {
  height: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: none;
}

.dashboard-card .card-header {
  background-color: #f8f9fa;
  font-weight: 600;
  border-bottom: 1px solid #e9ecef;
}

.dashboard-stat {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #0d6efd;
}

.create-application-btn {
  margin-top: 10px;
}

.dashboard-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: #6c757d;
}

.dashboard-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 1.2rem;
  color: #dc3545;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.75em;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.25rem;
}

.status-draft {
  background-color: #6c757d;
  color: white;
}

.status-submitted {
  background-color: #0d6efd;
  color: white;
}

.status-pending-review {
  background-color: #ffc107;
  color: black;
}

.status-under-review {
  background-color: #17a2b8;
  color: white;
}

.status-approved {
  background-color: #28a745;
  color: white;
}

.status-rejected {
  background-color: #dc3545;
  color: white;
}

.status-returned {
  background-color: #fd7e14;
  color: white;
}

.action-items-table th,
.action-items-table td {
  vertical-align: middle;
}

.activity-feed {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  padding: 10px 15px;
  border-left: none;
  border-right: none;
}

.activity-content {
  display: flex;
  flex-direction: column;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.activity-ref {
  font-weight: 600;
}

.activity-time {
  font-size: 0.85rem;
  color: #6c757d;
}

.activity-transition {
  display: flex;
  align-items: center;
}

.transition-from {
  color: #6c757d;
}

.transition-arrow {
  margin: 0 8px;
  color: #6c757d;
}

.transition-to {
  font-weight: 600;
  color: #0d6efd;
}
```

## 4. API Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|---------------|
| `/api/dashboard/stats/` | GET | Retrieves dashboard statistics including application counts by status and type, recent applications, and items requiring action | Required |
| `/api/dashboard/user-activity/` | GET | Retrieves user-specific activity data including created applications, assigned applications, and recent transitions | Required |

## 5. Integration with Other Components

### 5.1 API Service Integration

```javascript
// src/services/apiService.js
// Add these methods to the existing apiService

const apiService = {
  // ... existing methods
  
  // Dashboard endpoints
  getDashboardStats: () => {
    return axiosInstance.get('/api/dashboard/stats/');
  },
  
  getUserActivity: () => {
    return axiosInstance.get('/api/dashboard/user-activity/');
  }
};
```

### 5.2 Router Integration

```jsx
// src/App.jsx or src/routes.jsx
import Dashboard from './components/Dashboard/Dashboard';

// Add this to your routes configuration
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### 5.3 Navigation Integration

```jsx
// src/components/Navigation/Sidebar.jsx
// Add this to your sidebar navigation items

<Nav.Item>
  <Nav.Link as={NavLink} to="/dashboard" className="sidebar-link">
    <i className="bi bi-speedometer2 me-2"></i>
    Dashboard
  </Nav.Link>
</Nav.Item>
```

### 5.4 Date Utility Function

```javascript
// src/utils/dateUtils.js
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Format the date as "MMM DD, YYYY" (e.g., "May 12, 2023")
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
```

This implementation provides a comprehensive dashboard for the Credit Risk Workflow application, with statistics, visualizations, and action items tailored to the user's role and permissions.
