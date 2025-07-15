// dashboard.js - This file goes in your website, NOT in CloudFlare Worker
// This runs in the browser and calls your CloudFlare Worker

const WORKER_URL = 'https://raspy-firefly-102f.laurencio.workers.dev';
const LOCATION_ID = 'zGb4qzUMN6KTFiW4WArQ';
const API_TOKEN = 'pit-30f24e77-d624-4226-92d7-2e1232a94a8e';

// Call your CloudFlare Worker to get opportunities
async function getAllOpportunities() {
    try {
        console.log('🔄 Fetching opportunities via CloudFlare Worker...');
        
        const workerUrl = `${WORKER_URL}?endpoint=opportunities&location_id=${LOCATION_ID}`;
        
        const response = await fetch(workerUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Worker responded with ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Worker Response:', data);
        
        return data.data.opportunities || [];
    } catch (error) {
        console.error('❌ Error calling CloudFlare Worker:', error);
        throw error;
    }
}

// Calculate metrics
function calculateMetrics(opportunities) {
    const metrics = {
        total: opportunities.length,
        totalValue: 0,
        open: 0,
        won: 0,
        lost: 0,
        avgValue: 0,
        pipelines: new Set()
    };

    opportunities.forEach(opp => {
        metrics.totalValue += (opp.monetaryValue || 0);
        
        if (opp.pipelineId) {
            metrics.pipelines.add(opp.pipelineId);
        }
        
        switch(opp.status?.toLowerCase()) {
            case 'open':
                metrics.open++;
                break;
            case 'won':
                metrics.won++;
                break;
            case 'lost':
                metrics.lost++;
                break;
        }
    });

    const opportunitiesWithValue = opportunities.filter(opp => (opp.monetaryValue || 0) > 0);
    if (opportunitiesWithValue.length > 0) {
        metrics.avgValue = metrics.totalValue / opportunitiesWithValue.length;
    }

    return metrics;
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get status class
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'open': return 'status-open';
        case 'won': return 'status-closed';
        case 'lost': return 'status-lost';
        default: return 'detail-value';
    }
}

// Render opportunities
function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    
    if (opportunities.length === 0) {
        container.innerHTML = '<p>No opportunities found.</p>';
        return;
    }

    const sortedOpportunities = opportunities.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    const displayOpportunities = sortedOpportunities.slice(0, 25);

    container.innerHTML = displayOpportunities.map(opp => `
        <div class="opportunity-card">
            <div class="opportunity-name">${opp.name || 'Unnamed Opportunity'}</div>
            <div class="opportunity-details">
                <div class="detail-item">
                    <span class="detail-label">Value:</span>
                    <span class="detail-value">${formatCurrency(opp.monetaryValue || 0)}</span>
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
                    <span class="detail-value">${opp.contact?.name || opp.name || 'No contact'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pipeline:</span>
                    <span class="detail-value">${opp.pipelineId?.slice(-6) || 'Unknown'}</span>
                </div>
            </div>
        </div>
    `).join('');

    if (opportunities.length > 25) {
        container.innerHTML += `
            <div style="text-align: center; padding: 20px; color: #666; background: #f8fafc; border-radius: 8px; margin-top: 20px;">
                📋 Showing 25 of <strong>${opportunities.length}</strong> total opportunities<br>
                💰 All ${opportunities.length} opportunities included in metrics above
            </div>
        `;
    }
}

// Update dashboard
function updateDashboard(opportunities) {
    const metrics = calculateMetrics(opportunities);

    document.getElementById('totalOpportunities').textContent = metrics.total;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue);
    document.getElementById('openOpportunities').textContent = metrics.open;
    document.getElementById('avgValue').textContent = formatCurrency(metrics.avgValue);

    renderOpportunities(opportunities);

    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleString()} | ${metrics.pipelines.size} Pipelines | ${opportunities.length} Total`;

    console.log('📊 Dashboard Updated:', metrics);
}

// Show error
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').innerHTML = `
        <strong>Error:</strong> ${message}<br><br>
        <small>Worker: ${WORKER_URL}<br>Location: ${LOCATION_ID}</small>
    `;
}

// Main load function
async function loadDashboard() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        console.log('🚀 Loading dashboard via CloudFlare Worker...');

        const opportunities = await getAllOpportunities();
        
        console.log(`✅ Received ${opportunities.length} opportunities`);

        updateDashboard(opportunities);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

    } catch (error) {
        console.error('❌ Dashboard load failed:', error);
        showError(error.message);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', loadDashboard);

// Auto-refresh every 5 minutes
setInterval(loadDashboard, 5 * 60 * 1000);

// Global function for refresh button
window.loadDashboard = loadDashboard;
