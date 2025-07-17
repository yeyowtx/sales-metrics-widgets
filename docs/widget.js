// widget.js - Complete Sales Metrics Widget Engine
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
        if (fileName.includes('ytd-sales')) metric = 'ytd_sales_total';
        else if (fileName.includes('monthly-sales')) metric = 'monthly_sales';
        else if (fileName.includes('goal-progress')) metric = 'goal_progress';
        else if (fileName.includes('dig-performance')) metric = 'dig_performance';
        else if (fileName.includes('unit-sales')) metric = 'unit_sales';
        else if (fileName.includes('average-project-sale')) metric = 'average_project_sale';
        else if (fileName.includes('lead-generation')) metric = 'lead_generation';
    }
    
    console.log(`🎯 Detected metric: ${metric} from filename: ${fileName}`);
    
    const designerId = urlParams.get('designer');
    const isTeam = urlParams.get('team') === 'true';
    const yearlyGoal = parseFloat(urlParams.get('yearlyGoal')) || 800000;
    const monthlyGoal = parseFloat(urlParams.get('monthlyGoal')) || 66667;
    const dateRange = urlParams.get('range') || 'ytd'; // Changed default to ytd
    
    // Designer mapping - CORRECTED IDs
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
        
        // Calculate metric based on type (NO date filtering here - handled per metric)
        const result = calculateMetric(opportunities, metric, yearlyGoal, monthlyGoal, data, designerId, isTeam);
        
        // Display result
        displayResult(result, metric, designerId, isTeam);
        
        console.log('✅ Widget loaded successfully');
        
    } catch (error) {
        console.error('❌ Widget error:', error);
        showError(error.message);
    }
})();

// Calculate specific metric - FIXED with proper date filtering per metric
function calculateMetric(opportunities, metric, yearlyGoal, monthlyGoal, data, designerId, isTeam) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (metric) {
        case 'ytd_sales_total':
            // YTD: All won opportunities from January 1st through today
            const ytdOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear;
            });
            return {
                value: ytdOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0),
                format: 'currency',
                label: 'YTD Sales Total'
            };
            
        case 'monthly_sales':
            // MTD: Only won opportunities from 1st of current month through today
            const monthlyOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth;
            });
            return {
                value: monthlyOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0),
                format: 'currency',
                label: 'Monthly Sales'
            };
            
        case 'dig_performance':
            // Use YTD for dig performance
            const digOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear;
            });
            const completedJobs = digOpportunities.filter(opp => 
                opp.contact?.tags?.includes('job completed')
            );
            const digPercentage = digOpportunities.length > 0 
                ? (completedJobs.length / digOpportunities.length) * 100 
                : 0;
            return {
                value: digPercentage,
                format: 'percentage',
                label: 'Dig Performance',
                additional: `${completedJobs.length} completed / ${digOpportunities.length} won`
            };
            
        case 'unit_sales':
            // Use CURRENT MONTH for unit sales
            const unitOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth;
            });
            return {
                value: unitOpportunities.length,
                format: 'number',
                label: 'Unit Sales'
            };
            
        case 'average_project_sale':
            // Use YTD for average project sale
            const avgOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear;
            });
            const totalRevenue = avgOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
            const avgSale = avgOpportunities.length > 0 ? totalRevenue / avgOpportunities.length : 0;
            return {
                value: avgSale,
                format: 'currency',
                label: 'Average Project Sale'
            };
            
        case 'lead_generation':
            // For lead generation, use ALL opportunities for this designer (no date filter)
            const allOpps = data.opportunities || [];
            const filteredLeads = designerId && !isTeam 
                ? allOpps.filter(opp => opp.assignedTo === designerId)
                : allOpps;
            return {
                value: filteredLeads.length,
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
