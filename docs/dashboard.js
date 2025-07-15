// Add this to your dashboard JavaScript to fix the loading screen

function updateDashboard(opportunities, metrics) {
    console.log('🎨 Updating dashboard with', opportunities.length, 'opportunities');
    
    try {
        // FIRST: Hide the loading screen
        hideLoadingScreen();
        
        // Show the main dashboard content
        showDashboardContent();
        
        // Update total count in multiple possible locations
        updateTotalCount(opportunities.length);
        
        // Update status breakdown
        updateStatusDisplay(metrics.statuses);
        
        // Update pipeline display
        updatePipelineDisplay(metrics.pipelines);
        
        // Create or update opportunities table
        createOpportunitiesTable(opportunities.slice(0, 20));
        
        console.log('✅ Dashboard updated successfully!');
        
    } catch (error) {
        console.error('❌ Error updating dashboard:', error);
        showError(error.message);
    }
}

function hideLoadingScreen() {
    // Hide loading messages
    const loadingElements = document.querySelectorAll(
        '.loading, [class*="loading"], ' +
        'h2:contains("Loading"), h3:contains("Loading"), ' +
        'div:contains("Loading your sales data"), ' +
        'p:contains("Loading")'
    );
    
    // Also try text-based search
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.textContent && el.textContent.includes('Loading your sales data')) {
            el.style.display = 'none';
            console.log('🫥 Hid loading element:', el.textContent);
        }
    });
    
    loadingElements.forEach(el => {
        el.style.display = 'none';
        console.log('🫥 Hid loading element');
    });
}

function showDashboardContent() {
    // Show any hidden dashboard content
    const contentElements = document.querySelectorAll(
        '.dashboard-content, .main-content, .content, ' +
        '#dashboard, #main, #content, .dashboard'
    );
    
    contentElements.forEach(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
    });
    
    console.log('👀 Showed dashboard content');
}

function updateTotalCount(total) {
    const totalSelectors = [
        '#total-opportunities', '#total-count', '.total-opportunities',
        '.total-count', '[data-total]', '.opportunity-count'
    ];
    
    let updated = false;
    totalSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = total;
            updated = true;
            console.log(`✅ Updated ${selector} with total: ${total}`);
        }
    });
    
    if (!updated) {
        // Create a total display if none exists
        createTotalDisplay(total);
    }
}

function createTotalDisplay(total) {
    // Create a prominent total display
    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            margin: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
            <h1 style="margin: 0; font-size: 3em;">${total}</h1>
            <p style="margin: 10px 0 0 0; font-size: 1.2em;">Total Opportunities</p>
        </div>
    `;
    
    // Insert at the top of the page
    const body = document.body;
    const firstChild = body.children[0];
    body.insertBefore(totalDiv, firstChild);
    
    console.log('🎯 Created total display:', total);
}

function updateStatusDisplay(statuses) {
    let statusElement = document.querySelector('#status-chart, .status-chart, #status-breakdown');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'status-breakdown';
        statusElement.style.cssText = `
            background: white;
            padding: 20px;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(statusElement);
    }
    
    let html = '<h2>Status Breakdown</h2>';
    
    for (const [status, count] of Object.entries(statuses)) {
        const total = Object.values(statuses).reduce((a, b) => a + b, 0);
        const percentage = ((count / total) * 100).toFixed(1);
        
        // Color-code statuses
        let color = '#6c757d'; // default gray
        if (status === 'open') color = '#28a745';
        if (status === 'won') color = '#007bff';
        if (status === 'lost') color = '#dc3545';
        
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin: 8px 0;
                background: ${color}15;
                border-left: 4px solid ${color};
                border-radius: 4px;
            ">
                <span style="font-weight: bold; text-transform: capitalize;">${status}</span>
                <span style="color: ${color}; font-weight: bold;">${count} (${percentage}%)</span>
            </div>
        `;
    }
    
    statusElement.innerHTML = html;
    console.log('📊 Updated status display');
}

function updatePipelineDisplay(pipelines) {
    let pipelineElement = document.querySelector('#pipeline-chart, .pipeline-chart, #pipeline-breakdown');
    
    if (!pipelineElement) {
        pipelineElement = document.createElement('div');
        pipelineElement.id = 'pipeline-breakdown';
        pipelineElement.style.cssText = `
            background: white;
            padding: 20px;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(pipelineElement);
    }
    
    let html = '<h2>Pipeline Breakdown</h2>';
    
    for (const [pipelineId, count] of Object.entries(pipelines)) {
        html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                margin: 6px 0;
                background: #f8f9fa;
                border-radius: 4px;
            ">
                <span>Pipeline ${pipelineId.substring(0, 8)}...</span>
                <strong>${count} opportunities</strong>
            </div>
        `;
    }
    
    pipelineElement.innerHTML = html;
    console.log('📈 Updated pipeline display');
}

function createOpportunitiesTable(opportunities) {
    let tableElement = document.querySelector('#opportunities-table, .opportunities-table');
    
    if (!tableElement) {
        tableElement = document.createElement('div');
        tableElement.id = 'opportunities-table';
        tableElement.style.cssText = `
            background: white;
            padding: 20px;
            margin: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(tableElement);
    }
    
    let html = '<h2>Recent Opportunities</h2>';
    html += '<div style="overflow-x: auto;">';
    html += `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Name</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Value</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Contact</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    opportunities.forEach(opp => {
        const value = opp.monetaryValue ? `$${opp.monetaryValue.toLocaleString()}` : 'N/A';
        const contact = opp.contact?.name || 'Unknown';
        
        html += `
            <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 12px;">${opp.name || 'Untitled'}</td>
                <td style="padding: 12px;">${value}</td>
                <td style="padding: 12px;">
                    <span style="
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        color: white;
                        background: ${opp.status === 'open' ? '#28a745' : opp.status === 'won' ? '#007bff' : '#dc3545'};
                    ">${opp.status}</span>
                </td>
                <td style="padding: 12px;">${contact}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    html += `<p style="color: #6c757d; margin-top: 15px;">Showing first ${opportunities.length} opportunities</p>`;
    
    tableElement.innerHTML = html;
    console.log('📋 Created opportunities table');
}

function showError(message) {
    hideLoadingScreen();
    
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            margin: 20px;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
        ">
            <h3>⚠️ Error Loading Dashboard</h3>
            <p>${message}</p>
        </div>
    `;
    
    document.body.insertBefore(errorDiv, document.body.firstChild);
}

// Override the existing getAllOpportunities to use this new updateDashboard
async function getAllOpportunities() {
    console.log('🚀 Starting to fetch opportunities...');
    
    try {
        const workerUrl = 'https://raspy-firefly-102f.laurencio.workers.dev';
        console.log('📡 Calling worker:', workerUrl);
        
        const response = await fetch(workerUrl);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Worker response:', data);
        
        if (!data || !data.success || !data.opportunities) {
            throw new Error('Invalid response format');
        }
        
        const opportunities = data.opportunities;
        const metrics = data.metrics || calculateMetrics(opportunities);
        
        console.log(`🎯 Found ${opportunities.length} opportunities`);
        
        // Use the new updateDashboard function
        updateDashboard(opportunities, metrics);
        
        return opportunities;
        
    } catch (error) {
        console.error('❌ Error fetching opportunities:', error);
        showError(error.message);
        return [];
    }
}

function calculateMetrics(opportunities) {
    const metrics = {
        total: opportunities.length,
        statuses: {},
        pipelines: {}
    };
    
    opportunities.forEach(opp => {
        if (opp.status) {
            metrics.statuses[opp.status] = (metrics.statuses[opp.status] || 0) + 1;
        }
        if (opp.pipelineId) {
            metrics.pipelines[opp.pipelineId] = (metrics.pipelines[opp.pipelineId] || 0) + 1;
        }
    });
    
    return metrics;
}

// Auto-start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', getAllOpportunities);
} else {
    getAllOpportunities();
}
