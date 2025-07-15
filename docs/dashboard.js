// FIXED Dashboard.js - This will show ALL your opportunities
// Replace your current dashboard.js file with this code

const API_BASE_URL = 'https://services.leadconnectorhq.com';
const LOCATION_ID = 'zGb4qzUMN6KTFiW4WArQ'; // Your location ID
const API_TOKEN = 'YOUR_API_TOKEN_HERE'; // Replace with your actual token

// FIXED: Get ALL opportunities (no pipeline filtering)
async function getAllOpportunities() {
    try {
        console.log('🔄 Fetching ALL opportunities...');
        
        const response = await fetch(`${API_BASE_URL}/opportunities/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            body: JSON.stringify({
                locationId: LOCATION_ID,
                // REMOVED: pipeline filter (this was causing missing opportunities)
                status: ['open', 'won', 'lost', 'abandoned'], // FIXED: All statuses
                limit: 250, // FIXED: Increased from 100
                // REMOVED: Any date filtering
                // REMOVED: Any assignee filtering
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ API Response:', data);
        
        return data.opportunities || [];
    } catch (error) {
        console.error('❌ Error fetching opportunities:', error);
        throw error;
    }
}

// Calculate metrics from ALL opportunities
function calculateMetrics(opportunities) {
    const metrics = {
        total: opportunities.length,
        totalValue: 0,
        open: 0,
        won: 0,
        lost: 0,
        avgValue: 0
    };

    opportunities.forEach(opp => {
        // Add to total value
        metrics.totalValue += (opp.monetaryValue || 0);
        
        // Count by status
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

    // Calculate average (only count opportunities with value > 0)
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

// Get status badge class
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'open':
            return 'status-open';
        case 'won':
            return 'status-closed';
        case 'lost':
            return 'status-lost';
        default:
            return 'detail-value';
    }
}

// Render opportunities list
function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    
    if (opportunities.length === 0) {
        container.innerHTML = '<p>No opportunities found.</p>';
        return;
    }

    // Sort by creation date (newest first)
    const sortedOpportunities = opportunities.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Show first 20 for performance
    const displayOpportunities = sortedOpportunities.slice(0, 20);

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
                    <span class="detail-value">${opp.contact?.name || 'No contact'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pipeline:</span>
                    <span class="detail-value">${opp.pipelineId?.slice(-8) || 'Unknown'}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add summary if showing partial results
    if (opportunities.length > 20) {
        container.innerHTML += `
            <div style="text-align: center; padding: 20px; color: #666;">
                Showing 20 of ${opportunities.length} total opportunities
            </div>
        `;
    }
}

// Update dashboard with metrics
function updateDashboard(opportunities) {
    const metrics = calculateMetrics(opportunities);

    // Update stat cards
    document.getElementById('totalOpportunities').textContent = metrics.total;
    document.getElementById('totalValue').textContent = formatCurrency(metrics.totalValue);
    document.getElementById('openOpportunities').textContent = metrics.open;
    document.getElementById('avgValue').textContent = formatCurrency(metrics.avgValue);

    // Render opportunities list
    renderOpportunities(opportunities);

    // Update last updated time
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleString()}`;

    console.log('📊 Dashboard Updated:', metrics);
}

// Show error message
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = message;
}

// Main dashboard loading function
async function loadDashboard() {
    try {
        // Show loading
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('error').style.display = 'none';

        // Check if API token is set
        if (API_TOKEN === 'YOUR_API_TOKEN_HERE') {
            throw new Error('Please update API_TOKEN in dashboard.js with your actual GHL API token');
        }

        // Fetch all opportunities
        const opportunities = await getAllOpportunities();
        
        // Update dashboard
        updateDashboard(opportunities);

        // Show dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        console.log(`✅ Successfully loaded ${opportunities.length} opportunities`);

    } catch (error) {
        console.error('❌ Dashboard load failed:', error);
        showError(`Failed to load dashboard: ${error.message}`);
    }
}

// Load dashboard when page loads
document.addEventListener('DOMContentLoaded', loadDashboard);

// Auto-refresh every 5 minutes
setInterval(loadDashboard, 5 * 60 * 1000);
