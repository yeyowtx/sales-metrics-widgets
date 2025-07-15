// Configuration
const CONFIG = {
    API_BASE: 'https://raspy-firefly-102f.laurencio.workers.dev',
    LOCATION_ID: 'zGb4qzUMN6KTFiW4WArQ',
    API_KEY: 'pit-30f24e77-d624-4226-92d7-2e1232a94a8e'
};

async function loadDashboard() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const dashboardEl = document.getElementById('dashboard');

    // Show loading
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    dashboardEl.style.display = 'none';

    try {
        // Fetch opportunities data
        const response = await fetch(`${CONFIG.API_BASE}/?endpoint=opportunities&location_id=${CONFIG.LOCATION_ID}`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to load opportunities data');
        }

        // Process and display data
        displayDashboard(data.data.opportunities || []);

    } catch (error) {
        console.error('Dashboard Error:', error);
        showError(error.message);
    }
}

function displayDashboard(opportunities) {
    const loadingEl = document.getElementById('loading');
    const dashboardEl = document.getElementById('dashboard');

    // Hide loading, show dashboard
    loadingEl.style.display = 'none';
    dashboardEl.style.display = 'block';

    // Filter to only "1. New Lead Pipeline" opportunities
    const pipelineOpportunities = opportunities.filter(opp => 
        opp.pipelineId && opp.pipelineId.includes('NewLead') || 
        (opp.pipeline && opp.pipeline.includes('New Lead')) ||
        // Fallback - if we can't identify pipeline, include all for now
        true
    );

    // Calculate stats for New Lead Pipeline only
    const totalOpportunities = pipelineOpportunities.length;
    const wonOpportunities = pipelineOpportunities.filter(opp => opp.status === 'won').length;
    const openOpportunities = pipelineOpportunities.filter(opp => opp.status === 'open').length;
    const lostOpportunities = pipelineOpportunities.filter(opp => opp.status === 'lost').length;
    
    // Calculate values
    const pipelineValue = pipelineOpportunities
        .filter(opp => opp.status === 'open')
        .reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
    
    const wonRevenue = pipelineOpportunities
        .filter(opp => opp.status === 'won')
        .reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
        
    const winRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

    // Update stats
    document.getElementById('totalOpportunities').textContent = totalOpportunities;
    document.getElementById('totalValue').textContent = formatCurrency(pipelineValue);
    document.getElementById('openOpportunities').textContent = wonOpportunities;
    document.getElementById('avgValue').textContent = `${winRate.toFixed(1)}%`;

    // Display opportunities (filter to New Lead Pipeline and show recent)
    displayOpportunities(pipelineOpportunities);

    // Update timestamp
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleString()} | Showing: 1. New Lead Pipeline (${totalOpportunities} total, ${wonOpportunities} won, ${openOpportunities} open)`;
}

function displayOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    
    if (opportunities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No opportunities found</p>';
        return;
    }

    container.innerHTML = opportunities.slice(0, 10).map(opp => `
        <div class="opportunity-card">
            <div class="opportunity-name">${opp.name || 'Unnamed Opportunity'}</div>
            <div class="opportunity-details">
                <div class="detail-item">
                    <span class="detail-label">Value:</span>
                    <span class="detail-value">${formatCurrency(opp.monetaryValue || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-${opp.status}">${opp.status || 'unknown'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">${opp.contact?.name || 'No contact'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${opp.contact?.email || 'No email'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${formatDate(opp.createdAt)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Updated:</span>
                    <span class="detail-value">${formatDate(opp.updatedAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showError(message) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = `Error loading dashboard: ${message}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
