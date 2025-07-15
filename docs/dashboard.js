// Complete Fixed dashboard.js - Calls CloudFlare Worker to Get ALL Opportunities
// This file goes in your website folder alongside ytd-sales.html

const WORKER_URL = 'https://raspy-firefly-102f.laurencio.workers.dev';
const LOCATION_ID = 'zGb4qzUMN6KTFiW4WArQ';
const API_TOKEN = 'pit-30f24e77-d624-4226-92d7-2e1232a94a8e';

// Call your CloudFlare Worker to get ALL opportunities
async function getAllOpportunities() {
    try {
        console.log('🔄 Fetching ALL opportunities via CloudFlare Worker...');
        console.log('🔗 Worker URL:', WORKER_URL);
        console.log('📍 Location ID:', LOCATION_ID);
        
        const workerUrl = `${WORKER_URL}?endpoint=opportunities&location_id=${LOCATION_ID}`;
        console.log('📞 Full URL being called:', workerUrl);
        
        const response = await fetch(workerUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Worker error response:', errorText);
            throw new Error(`CloudFlare Worker responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Raw Worker Response:', data);
        
        if (!data.success) {
            console.error('❌ Worker returned unsuccessful response:', data);
            throw new Error(`Worker returned error: ${data.error || 'Unknown error'}`);
        }
        
        const opportunities = data.data.opportunities || [];
        console.log(`🎯 Successfully received ${opportunities.length} opportunities from worker`);
        
        return opportunities;
    } catch (error) {
        console.error('❌ Error calling CloudFlare Worker:', error);
        console.error('🔍 Error details:', {
            message: error.message,
            stack: error.stack,
            workerUrl: `${WORKER_URL}?endpoint=opportunities&location_id=${LOCATION_ID}`
        });
        throw error;
    }
}

// Calculate comprehensive metrics from ALL opportunities
function calculateMetrics(opportunities) {
    console.log('📊 Calculating metrics for', opportunities.length, 'opportunities');
    
    const metrics = {
        total: opportunities.length,
        totalValue: 0,
        open: 0,
        won: 0,
        lost: 0,
        abandoned: 0,
        avgValue: 0,
        pipelines: new Set(),
        pipelineBreakdown: {},
        statusBreakdown: {},
        assigneeBreakdown: {},
        recentOpportunities: 0
    };

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    opportunities.forEach(opp => {
        // Add to total value
        const value = opp.monetaryValue || 0;
        metrics.totalValue += value;
        
        // Track unique pipelines
        if (opp.pipelineId) {
            metrics.pipelines.add(opp.pipelineId);
            
            // Pipeline breakdown
            if (!metrics.pipelineBreakdown[opp.pipelineId]) {
                metrics.pipelineBreakdown[opp.pipelineId] = { count: 0, value: 0 };
            }
            metrics.pipelineBreakdown[opp.pipelineId].count++;
            metrics.pipelineBreakdown[opp.pipelineId].value += value;
        }
        
        // Count by status
        const status = opp.status?.toLowerCase() || 'unknown';
        switch(status) {
            case 'open':
                metrics.open++;
                break;
            case 'won':
                metrics.won++;
                break;
            case 'lost':
                metrics.lost++;
                break;
            case 'abandoned':
                metrics.abandoned++;
                break;
        }
        
        // Status breakdown
        if (!metrics.statusBreakdown[status]) {
            metrics.statusBreakdown[status] = { count: 0, value: 0 };
        }
        metrics.statusBreakdown[status].count++;
        metrics.statusBreakdown[status].value += value;
        
        // Assignee breakdown
        if (opp.assignedTo) {
            if (!metrics.assigneeBreakdown[opp.assignedTo]) {
                metrics.assigneeBreakdown[opp.assignedTo] = { count: 0, value: 0 };
            }
            metrics.assigneeBreakdown[opp.assignedTo].count++;
            metrics.assigneeBreakdown[opp.assignedTo].value += value;
        }
        
        // Recent opportunities (last month)
        if (opp.createdAt && new Date(opp.createdAt) > oneMonthAgo) {
            metrics.recentOpportunities++;
        }
    });

    // Calculate average (only count opportunities with value > 0)
    const opportunitiesWithValue = opportunities.filter(opp => (opp.monetaryValue || 0) > 0);
    if (opportunitiesWithValue.length > 0) {
        metrics.avgValue = metrics.totalValue / opportunitiesWithValue.length;
    }

    console.log('📈 Metrics calculated:', {
        total: metrics.total,
        pipelines: metrics.pipelines.size,
        totalValue: metrics.totalValue,
        statusBreakdown: metrics.statusBreakdown
    });

    return metrics;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get status class for styling
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'open':
            return 'status-open';
        case 'won':
            return 'status-closed';
        case 'lost':
        case 'abandoned':
            return 'status-lost';
        default:
            return 'detail-value';
    }
}

// Get pipeline display name
function getPipelineName(pipelineId) {
    const pipelineNames = {
        'Mt462Xl0NCveZG3Qr6FD': 'Main Pipeline',
        'xCoOCXos199Bgp9b4u8L': 'Secondary Pipeline',
        'gPVIUrWTdb5VA2OWj0o1': 'Pipeline 3',
        'u88myo7NE81kWK5D9Wxu': 'Pipeline 4'
    };
    
    return pipelineNames[pipelineId] || `Pipeline ${pipelineId?.slice(-4) || 'Unknown'}`;
}

// Render opportunities list with enhanced details
function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    
    if (opportunities.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>No opportunities found</h3>
                <p>Check your CloudFlare Worker logs for any issues.</p>
            </div>
        `;
        return;
    }

    // Sort by creation date (newest first)
    const sortedOpportunities = opportunities.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    // Show first 30 for performance, but calculate metrics from all
    const displayOpportunities = sortedOpportunities.slice(0, 30);

    container.innerHTML = displayOpportunities.map(opp => `
        <div class="opportunity-card">
            <div class="opportunity-name">
                ${opp.name || opp.contact?.name || 'Unnamed Opportunity'}
            </div>
            <div class="opportunity-details">
                <div class="detail-item">
                    <span class="detail-label">Value:</span>
                    <span class="detail-value">${formatCurrency(opp.monetaryValue)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value ${getStatusClass(opp.status)}">${opp.status || 'Unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${formatDate(opp.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">${opp.contact?.name || opp.contact?.email || 'No contact'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pipeline:</span>
                    <span class="detail-value">${getPipelineName(opp.pipelineId)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Source:</span>
                    <span class="detail-value">${opp.source || 'Unknown'}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add summary if showing partial results
    if (opportunities.length > 30) {
        container.innerHTML += `
            <div style="text-align: center; padding: 20px; color: #666; background: #f8fafc; border-radius: 8px; margin-top: 20px; border: 2px solid #e2e8f0;">
                <h4 style="margin: 0 0 10px 0; color: #4a5568;">📋 Viewing Summary</h4>
                <p style="margin: 0; font-size: 14px;">
                    Showing <strong>30</strong> of <strong>${opportunities.length}</strong> total opportunities<br>
                    💰 All <strong>${opportunities.length}</strong> opportunities included in metrics above
                </p>
            </div>
        `;
    }
}

// Update dashboard with comprehensive metrics
function updateDashboard(opportunities) {
    console.log('🔄 Updating dashboard with', opportunities.length, 'opportunities');
    
    const metrics = calculateMetrics(opportunities);

    // Update main stat cards
    document.getElementById('totalOpportunities').textContent = metrics.total;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue);
    document.getElementById('openOpportunities').textContent = metrics.open;
    document.getElementById('avgValue').textContent = formatCurrency(metrics.avgValue);

    // Render opportunities list
    renderOpportunities(opportunities);

    // Update last updated time with detailed info
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleString()} | ${metrics.pipelines.size} Pipelines | ${opportunities.length} Total Opportunities | Won: ${metrics.won} | Lost: ${metrics.lost}`;

    console.log('✅ Dashboard updated successfully:', {
        total: metrics.total,
        pipelines: metrics.pipelines.size,
        totalValue: metrics.totalValue,
        open: metrics.open,
        won: metrics.won,
        lost: metrics.lost
    });
}

// Show detailed error message
function showError(message, details = null) {
    console.error('❌ Showing error to user:', message, details);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    
    document.getElementById('error').innerHTML = `
        <div style="text-align: left;">
            <h3 style="color: #c53030; margin-bottom: 15px;">🚨 Dashboard Error</h3>
            <p><strong>Error:</strong> ${message}</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #4299e1;">
                <h4 style="margin: 0 0 10px 0; color: #2d3748;">Debug Information:</h4>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Worker URL:</strong> ${WORKER_URL}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Location ID:</strong> ${LOCATION_ID}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Full Endpoint:</strong> ${WORKER_URL}?endpoint=opportunities&location_id=${LOCATION_ID}</p>
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background: #fffaf0; border-radius: 8px; border-left: 4px solid #ed8936;">
                <h4 style="margin: 0 0 10px 0; color: #2d3748;">Troubleshooting Steps:</h4>
                <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                    <li>Check if your CloudFlare Worker is deployed and running</li>
                    <li>Verify the worker URL is accessible: <a href="${WORKER_URL}" target="_blank" style="color: #3182ce;">${WORKER_URL}</a></li>
                    <li>Check browser console for detailed error messages</li>
                    <li>Verify your API token is valid and has proper permissions</li>
                </ol>
            </div>
        </div>
    `;
}

// Main dashboard loading function with comprehensive error handling
async function loadDashboard() {
    console.log('🚀 Starting dashboard load process...');
    
    try {
        // Show loading state
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        console.log('🔧 Configuration check:');
        console.log('  - Worker URL:', WORKER_URL);
        console.log('  - Location ID:', LOCATION_ID);
        console.log('  - API Token:', API_TOKEN ? `${API_TOKEN.slice(0, 10)}...` : 'NOT SET');

        // Fetch all opportunities via CloudFlare worker
        const opportunities = await getAllOpportunities();
        
        console.log(`✅ Successfully fetched ${opportunities.length} opportunities`);

        // Update dashboard with all data
        updateDashboard(opportunities);

        // Show dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        console.log(`🎯 Dashboard loaded successfully with ${opportunities.length} opportunities from CloudFlare Worker`);

    } catch (error) {
        console.error('❌ Dashboard load failed:', error);
        showError(error.message, {
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 Dashboard script loaded, initializing...');
    loadDashboard();
});

// Auto-refresh every 5 minutes
setInterval(function() {
    console.log('🔄 Auto-refreshing dashboard...');
    loadDashboard();
}, 5 * 60 * 1000);

// Global function for manual refresh button
window.loadDashboard = loadDashboard;

// Add some debugging helpers
window.debugDashboard = function() {
    console.log('🔍 Dashboard Debug Info:');
    console.log('  - Worker URL:', WORKER_URL);
    console.log('  - Location ID:', LOCATION_ID);
    console.log('  - API Token set:', !!API_TOKEN);
    console.log('  - Full endpoint:', `${WORKER_URL}?endpoint=opportunities&location_id=${LOCATION_ID}`);
};

console.log('📊 Dashboard script loaded successfully. Use debugDashboard() in console for debug info.');
