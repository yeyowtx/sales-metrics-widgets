// widget.js - Unified Sales Metrics Widget Engine
// Handles all metric calculations with designer filtering and manual goal input

(async () => {
    console.log('🚀 Sales Widget Loading...');
    
    // CloudFlare Worker URL
    const WORKER_URL = 'https://raspy-firefly-102f.laurencio.workers.dev';
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const pageUrl = new URL(window.location.href);
    const pathParts = pageUrl.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Extract metric from filename
    let metric = urlParams.get('metric');
    if (!metric && fileName) {
        if (fileName.includes('ytd-sales-total')) metric = 'ytd_sales_total';
        else if (fileName.includes('monthly-sales')) metric = 'monthly_sales';
        else if (fileName.includes('goal-progress')) metric = 'goal_progress';
        else if (fileName.includes('dig-performance')) metric = 'dig_performance';
        else if (fileName.includes('unit-sales')) metric = 'unit_sales';
        else if (fileName.includes('average-project-sale')) metric = 'average_project_sale';
        else if (fileName.includes('lead-generation')) metric = 'lead_generation';
    }
    
    const designerId = urlParams.get('designer');
    const isTeam = urlParams.get('team') === 'true';
    const yearlyGoal = parseFloat(urlParams.get('yearlyGoal')) || 800000;
    const monthlyGoal = parseFloat(urlParams.get('monthlyGoal')) || 66667;
    const dateRange = urlParams.get('range') || 'current_month'; // current_month, ytd
    
    // Designer mapping
    const designers = {
        '1avdHsezyj8F13jdoajF': 'Bradley Marquez',
        'yWDJbBcBXvPf1nY4Isma': 'Christian Thomas', 
        '0esj2698VuyUgwigmnoL': 'Dylan Ervin',
        'ENkWUp8rRf6YF3iqR9qv': 'Erick Gavaldon',
        'kfm1oYty788FPfk1Odko': 'Laurencio Montes Jr',
        'EM8YRRRMePDUiaRxjXoI': 'Tara Yeager',
        'x5JTU601PUdVdpH2B9R9': 'Zach Rodriguez'
    };
    
    try {
        // Show loading state
        showLoading();
        
        // Fetch data from CloudFlare Worker
        const response = await fetch(WORKER_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data.success || !data.opportunities) {
            throw new Error('Invalid data format');
        }
        
        let opportunities = data.opportunities;
        console.log(`📊 Loaded ${opportunities.length} total opportunities`);
        
        // Filter by designer if specified
        if (designerId && !isTeam) {
            opportunities = opportunities.filter(opp => opp.assignedTo === designerId);
            console.log(`👤 Filtered to ${opportunities.length} opportunities for ${designers[designerId]}`);
        }
        
        // Filter by date range
        opportunities = filterByDateRange(opportunities, dateRange);
        console.log(`📅 Date filtered to ${opportunities.length} opportunities`);
        
        // Calculate metric based on type
        const result = calculateMetric(opportunities, metric, yearlyGoal, monthlyGoal);
        
        // Display result
        displayResult(result, metric, designerId, isTeam);
        
        console.log('✅ Widget loaded successfully');
        
    } catch (error) {
        console.error('❌ Widget error:', error);
        showError(error.message);
    }
})();

// Filter opportunities by date range
function filterByDateRange(opportunities, range) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    return opportunities.filter(opp => {
        const wonDate = new Date(opp.lastStatusChangeAt);
        
        switch (range) {
            case 'current_month':
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth &&
                       opp.status === 'won';
                       
            case 'ytd':
                return wonDate.getFullYear() === currentYear &&
                       opp.status === 'won';
                       
            default:
                return opp.status === 'won';
        }
    });
}

// Calculate specific metric
function calculateMetric(opportunities, metric, yearlyGoal, monthlyGoal) {
    const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
    const completedJobs = wonOpportunities.filter(opp => 
        opp.contact?.tags?.includes('job completed')
    );
    
    switch (metric) {
        case 'ytd_sales_total':
            return {
                value: wonOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0),
                format: 'currency',
                label: 'YTD Sales Total'
            };
            
        case 'monthly_sales':
            return {
                value: wonOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0),
                format: 'currency',
                label: 'Monthly Sales'
            };
            
        case 'goal_progress':
            const totalSales = wonOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
            const goal = urlParams.get('range') === 'ytd' ? yearlyGoal : monthlyGoal;
            return {
                value: (totalSales / goal) * 100,
                format: 'percentage',
                label: 'Goal Progress',
                additional: `$${totalSales.toLocaleString()} / $${goal.toLocaleString()}`
            };
            
        case 'dig_performance':
            const digPercentage = wonOpportunities.length > 0 
                ? (completedJobs.length / wonOpportunities.length) * 100 
                : 0;
            return {
                value: digPercentage,
                format: 'percentage',
                label: 'Dig Performance',
                additional: `${completedJobs.length} completed / ${wonOpportunities.length} won`
            };
            
        case 'unit_sales':
            return {
                value: wonOpportunities.length,
                format: 'number',
                label: 'Unit Sales'
            };
            
        case 'average_project_sale':
            const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
            const avgSale = wonOpportunities.length > 0 ? totalRevenue / wonOpportunities.length : 0;
            return {
                value: avgSale,
                format: 'currency',
                label: 'Average Project Sale'
            };
            
        case 'lead_generation':
            return {
                value: opportunities.length,
                format: 'number',
                label: 'Lead Generation'
            };
            
        default:
            return {
                value: 0,
                format: 'number',
                label: 'Unknown Metric'
            };
    }
}

// Format value based on type
function formatValue(value, format) {
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
            
        case 'percentage':
            return `${value.toFixed(1)}%`;
            
        case 'number':
            return new Intl.NumberFormat('en-US').format(value);
            
        default:
            return value.toString();
    }
}

// Display the result
function displayResult(result, metric, designerId, isTeam) {
    const valueElement = document.querySelector('.value');
    const labelElement = document.querySelector('.label');
    const additionalElement = document.querySelector('.additional');
    const designerElement = document.querySelector('.designer-name');
    
    if (valueElement) {
        valueElement.textContent = formatValue(result.value, result.format);
    }
    
    if (labelElement) {
        labelElement.textContent = result.label;
    }
    
    if (additionalElement && result.additional) {
        additionalElement.textContent = result.additional;
        additionalElement.style.display = 'block';
    }
    
    if (designerElement) {
        if (isTeam) {
            designerElement.textContent = 'Team Performance';
        } else if (designerId) {
            const designers = {
                '1avdHsezyj8F13jdoajF': 'Bradley Marquez',
                'yWDJbBcBXvPf1nY4Isma': 'Christian Thomas', 
                '0esj2698VuyUgwigmnoL': 'Dylan Ervin',
                'ENkWUp8rRf6YF3iqR9qv': 'Erick Gavaldon',
                'kfm1oYty788FPfk1Odko': 'Laurencio Montes Jr',
                'EM8YRRRMePDUiaRxjXoI': 'Tara Yeager',
                'x5JTU601PUdVdpH2B9R9': 'Zach Rodriguez'
            };
            designerElement.textContent = designers[designerId] || 'Unknown Designer';
        }
    }
    
    // Update last updated time
    const lastUpdatedElement = document.querySelector('.last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
}

// Show loading state
function showLoading() {
    const valueElement = document.querySelector('.value');
    if (valueElement) {
        valueElement.textContent = '...';
        valueElement.classList.add('loading');
    }
}

// Show error state
function showError(message) {
    const valueElement = document.querySelector('.value');
    const errorElement = document.querySelector('.error');
    
    if (valueElement) {
        valueElement.textContent = 'Error';
        valueElement.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    console.error('Widget Error:', message);
}
