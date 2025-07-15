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

    // Debug: Log the first opportunity to see the data structure
    console.log('First opportunity data:', opportunities[0]);

    // For now, show ALL opportunities (we'll add pipeline filtering once we see the data structure)
    const pipelineOpportunities = opportunities;

    // Calculate stats
    const totalOpportunities = pipelineOpportunities.length;
    const wonOpportunities = pipelineOpportunities.filter(opp => 
        opp.status && opp.status.toLowerCase() === 'won'
    ).length;
    const openOpportunities = pipelineOpportunities.filter(opp => 
        opp.status && opp.status.toLowerCase() === 'open'
    ).length;
    const lostOpportunities = pipelineOpportunities.filter(opp => 
        opp.status && (opp.status.toLowerCase() === 'lost' || opp.status.toLowerCase() === 'abandon')
    ).length;
    
    // Calculate values
    const pipelineValue = pipelineOpportunities
        .filter(opp => opp.status && opp.status.toLowerCase() === 'open')
        .reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
    
    const wonRevenue = pipelineOpportunities
        .filter(opp => opp.status && opp.status.toLowerCase() === 'won')
        .reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
        
    const winRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

    // Update stats
    document.getElementById('totalOpportunities').textContent = totalOpportunities;
    document.getElementById('totalValue').textContent = formatCurrency(pipelineValue);
    document.getElementById('openOpportunities').textContent = wonOpportunities;
    document.getElementById('avgValue').textContent = `${winRate.toFixed(1)}%`;

    // Display opportunities (show all for now)
    displayOpportunities(pipelineOpportunities);

    // Update timestamp with debug info
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleString()} | Total: ${totalOpportunities}, Won: ${wonOpportunities}, Open: ${openOpportunities}`;
}

function displayOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    
    console.log('Displaying opportunities:', opportunities.length, 'opportunities');
    console.log('First opportunity structure:', opportunities[0]);
    
    if (opportunities.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No opportunities found</p>';
        return;
    }

    container.innerHTML = opportunities.slice(0, 10).map(opp => {
        // Handle different possible data structures
        const name = opp.name || 'Unnamed Opportunity';
        const value = opp.monetaryValue || 0;
        const status = opp.status || 'unknown';
        const contactName = opp.contact?.name || opp.contactName || 'No contact';
        const email = opp.contact?.email || opp.email || 'No email';
        const created = opp.createdAt || opp.created || '';
        const updated = opp.updatedAt || opp.updated || '';
        
        return `
            <div class="opportunity-card">
                <div class="opportunity-name">${name}</div>
                <div class="opportunity-details">
                    <div class="detail-item">
                        <span class="detail-label">Value:</span>
                        <span class="detail-value">${formatCurrency(value)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value status-${status.toLowerCase()}">${status}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Contact:</span>
                        <span class="detail-value">${contactName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${formatDate(created)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Updated:</span>
                        <span class="detail-value">${formatDate(updated)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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
