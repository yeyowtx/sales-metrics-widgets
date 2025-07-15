// Fixed Dashboard JavaScript - Replace your current dashboard code with this

async function loadDashboard() {
    console.log('🚀 Starting dashboard load process...');
    
    try {
        // Show loading state
        console.log('📡 Fetching ALL opportunities via CloudFlare Worker...');
        
        const workerUrl = 'https://raspy-firefly-102f.laurencio.workers.dev';
        console.log(`🔗 Worker URL: ${workerUrl}`);
        
        // Fetch data from your CloudFlare Worker
        const response = await fetch(workerUrl);
        console.log('📥 Response status:', response.status);
        console.log('📋 Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Raw Worker Response:', data);
        
        // Check if the response has the expected structure
        if (!data) {
            throw new Error('No data received from worker');
        }
        
        // Handle both success and error responses
        if (data.success === false) {
            throw new Error(data.message || 'Worker returned error');
        }
        
        // Extract opportunities - handle different response formats
        let opportunities = [];
        
        if (data.opportunities && Array.isArray(data.opportunities)) {
            opportunities = data.opportunities;
        } else if (data.data && Array.isArray(data.data)) {
            opportunities = data.data;
        } else if (Array.isArray(data)) {
            opportunities = data;
        } else {
            console.warn('⚠️ Unexpected data format:', data);
            throw new Error('Opportunities data not found in expected format');
        }
        
        console.log(`🎯 Found ${opportunities.length} opportunities`);
        console.log('📊 Sample opportunity:', opportunities[0]);
        
        // Get metrics from response or calculate them
        let metrics = data.metrics || calculateMetrics(opportunities);
        
        console.log('📈 Metrics:', metrics);
        
        // Update dashboard with the data
        updateDashboard(opportunities, metrics);
        
    } catch (error) {
        console.error('❌ Error calling CloudFlare Worker:', error);
        showError(error.message);
    }
}

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

function updateDashboard(opportunities, metrics) {
    console.log('🎨 Updating dashboard with data...');
    
    // Update total count
    const totalElement = document.getElementById('total-opportunities');
    if (totalElement) {
        totalElement.textContent = metrics.total;
    }
    
    // Update status breakdown
    updateStatusChart(metrics.statuses);
    
    // Update pipeline breakdown
    updatePipelineChart(metrics.pipelines);
    
    // Update opportunities table/list
    updateOpportunitiesTable(opportunities);
    
    console.log('✅ Dashboard updated successfully!');
}

function updateStatusChart(statuses) {
    console.log('📊 Updating status chart:', statuses);
    
    // Update your status chart here
    // Example for Chart.js or your charting library
    const statusContainer = document.getElementById('status-chart');
    if (statusContainer) {
        let html = '<h3>By Status</h3>';
        for (const [status, count] of Object.entries(statuses)) {
            const percentage = ((count / Object.values(statuses).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            html += `<div class="status-item">
                <span class="status-label">${status}</span>
                <span class="status-count">${count} (${percentage}%)</span>
            </div>`;
        }
        statusContainer.innerHTML = html;
    }
}

function updatePipelineChart(pipelines) {
    console.log('📈 Updating pipeline chart:', pipelines);
    
    // Update your pipeline chart here
    const pipelineContainer = document.getElementById('pipeline-chart');
    if (pipelineContainer) {
        let html = '<h3>By Pipeline</h3>';
        for (const [pipelineId, count] of Object.entries(pipelines)) {
            html += `<div class="pipeline-item">
                <span class="pipeline-label">Pipeline ${pipelineId.substring(0, 8)}...</span>
                <span class="pipeline-count">${count}</span>
            </div>`;
        }
        pipelineContainer.innerHTML = html;
    }
}

function updateOpportunitiesTable(opportunities) {
    console.log('📋 Updating opportunities table...');
    
    const tableContainer = document.getElementById('opportunities-table');
    if (tableContainer) {
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
        
        // Show first 20 opportunities
        opportunities.slice(0, 20).forEach(opp => {
            const value = opp.monetaryValue ? `$${opp.monetaryValue}` : 'N/A';
            const contactName = opp.contact?.name || 'Unknown';
            const createdDate = opp.createdAt ? new Date(opp.createdAt).toLocaleDateString() : 'N/A';
            
            html += `
                <tr>
                    <td>${opp.name || 'Untitled'}</td>
                    <td>${value}</td>
                    <td><span class="status-badge status-${opp.status}">${opp.status}</span></td>
                    <td>${contactName}</td>
                    <td>${createdDate}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <p class="table-footer">Showing first 20 of ${opportunities.length} opportunities</p>
        `;
        
        tableContainer.innerHTML = html;
    }
}

function showError(message) {
    console.error('🚨 Showing error to user:', message);
    
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Dashboard script loaded, initializing...');
    loadDashboard();
});

// Add refresh button functionality
document.getElementById('refresh-button')?.addEventListener('click', function() {
    console.log('🔄 Manual refresh triggered');
    loadDashboard();
});
