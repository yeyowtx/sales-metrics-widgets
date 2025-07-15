// Replace your current dashboard function with this fixed version

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
        
        // FIXED: Check if data exists and has the right structure
        if (!data) {
            throw new Error('No data received from worker');
        }
        
        // FIXED: Handle the actual response structure from your worker
        let opportunities = [];
        
        if (data.success && data.opportunities && Array.isArray(data.opportunities)) {
            opportunities = data.opportunities;
            console.log(`🎯 Found ${opportunities.length} opportunities`);
        } else if (data.opportunities && Array.isArray(data.opportunities)) {
            opportunities = data.opportunities;
            console.log(`🎯 Found ${opportunities.length} opportunities (no success flag)`);
        } else {
            console.error('❌ Unexpected response structure:', data);
            throw new Error('Opportunities not found in response');
        }
        
        // Update your dashboard with the opportunities
        updateDashboard(opportunities);
        
        return opportunities;
        
    } catch (error) {
        console.error('❌ Error fetching opportunities:', error);
        showError(error.message);
        return [];
    }
}

function updateDashboard(opportunities) {
    console.log('🎨 Updating dashboard with', opportunities.length, 'opportunities');
    
    try {
        // Update total count
        const totalElement = document.querySelector('#total-count, .total-opportunities, [data-total]');
        if (totalElement) {
            totalElement.textContent = opportunities.length;
        }
        
        // Calculate status breakdown
        const statusCounts = {};
        opportunities.forEach(opp => {
            const status = opp.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        console.log('📊 Status breakdown:', statusCounts);
        
        // Update status display
        updateStatusDisplay(statusCounts);
        
        // Hide any error messages
        const errorElements = document.querySelectorAll('.error, .dashboard-error');
        errorElements.forEach(el => el.style.display = 'none');
        
        console.log('✅ Dashboard updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating dashboard:', error);
    }
}

function updateStatusDisplay(statusCounts) {
    // Try to find a status display element
    const statusElement = document.querySelector('#status-breakdown, .status-chart, .status-display');
    
    if (statusElement) {
        let html = '<h3>Status Breakdown</h3>';
        
        for (const [status, count] of Object.entries(statusCounts)) {
            const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
            const percentage = ((count / total) * 100).toFixed(1);
            
            html += `
                <div class="status-item" style="margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                    <strong>${status.toUpperCase()}</strong>: ${count} (${percentage}%)
                </div>
            `;
        }
        
        statusElement.innerHTML = html;
    }
}

function showError(message) {
    console.error('🚨 Showing error:', message);
    
    // Find or create error display
    let errorElement = document.querySelector('.error-display, #error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-display';
        errorElement.style.cssText = `
            background: #ffebee; 
            border: 1px solid #f44336; 
            color: #c62828; 
            padding: 15px; 
            margin: 10px; 
            border-radius: 4px;
        `;
        document.body.insertBefore(errorElement, document.body.firstChild);
    }
    
    errorElement.innerHTML = `<strong>Error:</strong> ${message}`;
    errorElement.style.display = 'block';
}

// Auto-load when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', getAllOpportunities);
} else {
    getAllOpportunities();
}

// Connect refresh button if it exists
document.addEventListener('DOMContentLoaded', function() {
    const refreshBtn = document.querySelector('#refresh-button, .refresh-btn, [onclick*="refresh"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', getAllOpportunities);
        console.log('🔄 Refresh button connected');
    }
});
