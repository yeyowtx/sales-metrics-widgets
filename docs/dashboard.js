// dashboard.js - Complete Dashboard JavaScript

console.log('🚀 Dashboard script loading...');

// Global variables
let allOpportunities = [];
let dashboardMetrics = {};

// Main function to load dashboard
async function loadDashboard() {
    console.log('📡 Starting dashboard load...');
    
    try {
        // Update API status
        updateAPIStatus('worker-status', 'loading');
        updateAPIStatus('api-status', 'loading');
        updateAPIStatus('pagination-status', 'loading');
        
        // Fetch data from CloudFlare Worker
        const workerUrl = 'https://raspy-firefly-102f.laurencio.workers.dev';
        console.log('🔗 Calling worker:', workerUrl);
        
        const response = await fetch(workerUrl);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Worker response received:', data);
        
        // Validate response structure
        if (!data || !data.success || !data.opportunities) {
            throw new Error('Invalid response format from worker');
        }
        
        // Store the data
        allOpportunities = data.opportunities;
        dashboardMetrics = data.metrics || calculateMetrics(allOpportunities);
        
        console.log(`🎯 Found ${allOpportunities.length} opportunities`);
        console.log('📊 Metrics:', dashboardMetrics);
        
        // Update API status to success
        updateAPIStatus('worker-status', 'success');
        updateAPIStatus('api-status', 'success');
        updateAPIStatus('pagination-status', 'success');
        
        // Hide loading screen and show dashboard
        hideLoadingScreen();
        showDashboard();
        
        // Populate dashboard with data
        updateDashboardContent();
        
        console.log('✅ Dashboard loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        
        // Update API status to error
        updateAPIStatus('worker-status', 'error');
        updateAPIStatus('api-status', 'error');
        updateAPIStatus('pagination-status', 'error');
        
        // Show error
        showError(error.message);
    }
}

// Calculate metrics from opportunities
function calculateMetrics(opportunities) {
    const metrics = {
        total: opportunities.length,
        statuses: {},
        pipelines: {},
        assignedTo: {}
    };
    
    opportunities.forEach(opp => {
        // Count by status
        if (opp.status) {
            metrics.statuses[opp.status] = (metrics.statuses[opp.status] || 0) + 1;
        }
        
        // Count by pipeline
        if (opp.pipelineId) {
            metrics.pipelines[opp.pipelineId] = (metrics.pipelines[opp.pipelineId] || 0) + 1;
        }
        
        // Count by assigned person
        if (opp.assignedTo) {
            metrics.assignedTo[opp.assignedTo] = (metrics.assignedTo[opp.assignedTo] || 0) + 1;
        }
    });
    
    return metrics;
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('🫥 Loading screen hidden');
    }
}

// Show dashboard content
function showDashboard() {
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
        console.log('👀 Dashboard content shown');
    }
}

// Update dashboard content with data
function updateDashboardContent() {
    console.log('🎨 Updating dashboard content...');
    
    // Update total opportunities
    updateTotalOpportunities();
    
    // Update status breakdown
    updateStatusBreakdown();
    
    // Update pipeline breakdown
    updatePipelineBreakdown();
    
    // Update opportunities table
    updateOpportunitiesTable();
    
    // Update last updated time
    updateLastUpdated();
}

// Update total opportunities display
function updateTotalOpportunities() {
    const totalElement = document.getElementById('total-opportunities');
    if (totalElement) {
        totalElement.textContent = dashboardMetrics.total;
        console.log(`✅ Updated total: ${dashboardMetrics.total}`);
    }
}

// Update status breakdown
function updateStatusBreakdown() {
    const statuses = dashboardMetrics.statuses;
    const total = dashboardMetrics.total;
    
    // Update each status
    Object.keys(statuses).forEach(status => {
        const count = statuses[status];
        const percentage = ((count / total) * 100).toFixed(1);
        
        // Update count
        const countElement = document.getElementById(`${status}-count`);
        if (countElement) {
            countElement.textContent = count;
        }
        
        // Update percentage
        const percentageElement = document.getElementById(`${status}-percentage`);
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }
    });
    
    console.log('📊 Status breakdown updated');
}

// Update pipeline breakdown
function updatePipelineBreakdown() {
    const pipelineList = document.getElementById('pipeline-list');
    if (!pipelineList) return;
    
    const pipelines = dashboardMetrics.pipelines;
    let html = '';
    
    Object.entries(pipelines).forEach(([pipelineId, count]) => {
        html += `
            <div class="pipeline-item">
                <span class="pipeline-name">Pipeline ${pipelineId.substring(0, 8)}...</span>
                <span class="pipeline-count">${count}</span>
            </div>
        `;
    });
    
    pipelineList.innerHTML = html;
    console.log('📈 Pipeline breakdown updated');
}

// Update opportunities table
function updateOpportunitiesTable() {
    const tableContainer = document.getElementById('opportunities-table');
    if (!tableContainer) return;
    
    // Show first 20 opportunities
    const recentOpportunities = allOpportunities.slice(0, 20);
    
    let html = `
        <table class="opportunities-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    recentOpportunities.forEach(opp => {
        const value = opp.monetaryValue ? `$${opp.monetaryValue.toLocaleString()}` : 'N/A';
        const contact = opp.contact?.name || 'Unknown';
        const created = opp.createdAt ? new Date(opp.createdAt).toLocaleDateString() : 'N/A';
        
        html += `
            <tr>
                <td>${opp.name || 'Untitled'}</td>
                <td>${value}</td>
                <td><span class="status-badge ${opp.status}">${opp.status}</span></td>
                <td>${contact}</td>
                <td>${created}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <p class="table-info">Showing ${recentOpportunities.length} of ${allOpportunities.length} opportunities</p>
    `;
    
    tableContainer.innerHTML = html;
    console.log('📋 Opportunities table updated');
}

// Update last updated time
function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        const now = new Date().toLocaleTimeString();
        lastUpdatedElement.textContent = `Last updated: ${now}`;
    }
}

// Update API status indicators
function updateAPIStatus(statusId, status) {
    const statusElement = document.getElementById(statusId);
    if (!statusElement) return;
    
    switch (status) {
        case 'loading':
            statusElement.textContent = '🟡';
            break;
        case 'success':
            statusElement.textContent = '🟢';
            break;
        case 'error':
            statusElement.textContent = '🔴';
            break;
    }
}

// Show error message
function showError(message) {
    console.error('🚨 Showing error:', message);
    
    // Hide loading screen
    hideLoadingScreen();
    
    // Show error container
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
    }
}

// Hide error message
function hideError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

// Refresh button handler
function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            console.log('🔄 Manual refresh triggered');
            hideError();
            loadDashboard();
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing dashboard...');
    
    // Setup event listeners
    setupRefreshButton();
    
    // Load dashboard data
    loadDashboard();
});

// Auto-refresh every 5 minutes
setInterval(() => {
    console.log('⏰ Auto-refresh triggered');
    loadDashboard();
}, 5 * 60 * 1000);

console.log('✅ Dashboard script loaded and ready!');
