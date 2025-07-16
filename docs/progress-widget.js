// progress-widget.js - Sales Progress Dashboard

(async () => {
    console.log('🚀 Progress Dashboard Loading...');
    
    // CloudFlare Worker URL
    const WORKER_URL = 'https://raspy-firefly-102f.laurencio.workers.dev';
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const designerId = urlParams.get('designer');
    const isTeam = urlParams.get('team') === 'true';
    const yearlyGoal = parseFloat(urlParams.get('yearlyGoal')) || 800000;
    const monthlyGoal = parseFloat(urlParams.get('monthlyGoal')) || 66667;
    
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
        // Set designer name
        const designerNameElement = document.getElementById('designer-name');
        if (isTeam) {
            designerNameElement.textContent = 'Team Performance';
        } else if (designerId) {
            designerNameElement.textContent = designers[designerId] || 'Unknown Designer';
        } else {
            designerNameElement.textContent = 'All Sales';
        }
        
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
        
        // Calculate YTD and Monthly metrics
        const ytdMetrics = calculatePeriodMetrics(opportunities, 'ytd');
        const monthlyMetrics = calculatePeriodMetrics(opportunities, 'current_month');
        const allTimeMetrics = calculateSummaryMetrics(opportunities, data);
        
        // Update YTD Progress
        updateProgressSection('ytd', ytdMetrics, yearlyGoal);
        
        // Update Monthly Progress  
        updateProgressSection('monthly', monthlyMetrics, monthlyGoal);
        
        // Update Summary Stats
        updateSummaryStats(allTimeMetrics);
        
        // Update last updated time
        document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        
        console.log('✅ Progress Dashboard loaded successfully');
        
    } catch (error) {
        console.error('❌ Dashboard error:', error);
        showError(error.message);
    }
})();

// Calculate metrics for a specific period
function calculatePeriodMetrics(opportunities, period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const filteredOpps = opportunities.filter(opp => {
        if (opp.status !== 'won') return false;
        
        const wonDate = new Date(opp.lastStatusChangeAt);
        
        switch (period) {
            case 'current_month':
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth;
            case 'ytd':
                return wonDate.getFullYear() === currentYear;
            default:
                return true;
        }
    });
    
    const totalSales = filteredOpps.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
    const dealsWon = filteredOpps.length;
    const avgSale = dealsWon > 0 ? totalSales / dealsWon : 0;
    
    return {
        totalSales,
        dealsWon,
        avgSale
    };
}

// Calculate summary metrics
function calculateSummaryMetrics(opportunities, data) {
    const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
    const completedJobs = wonOpportunities.filter(opp => 
        opp.contact?.tags?.includes('job completed')
    );
    
    const totalSales = wonOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
    const dealsWon = wonOpportunities.length;
    const avgSale = dealsWon > 0 ? totalSales / dealsWon : 0;
    const digRate = dealsWon > 0 ? (completedJobs.length / dealsWon) * 100 : 0;
    
    // Total leads for this designer
    const urlParams = new URLSearchParams(window.location.search);
    const designerId = urlParams.get('designer');
    const isTeam = urlParams.get('team') === 'true';
    const allOpps = data.opportunities || [];
    const totalLeads = designerId && !isTeam 
        ? allOpps.filter(opp => opp.assignedTo === designerId).length
        : allOpps.length;
    
    return {
        dealsWon,
        avgSale,
        digRate,
        totalLeads
    };
}

// Update progress section
function updateProgressSection(type, metrics, goal) {
    const percentage = Math.min((metrics.totalSales / goal) * 100, 100);
    const remaining = Math.max(goal - metrics.totalSales, 0);
    
    // Update progress bar
    const progressFill = document.getElementById(`${type}-progress`);
    const progressPercentage = document.getElementById(`${type}-percentage`);
    
    setTimeout(() => {
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${percentage.toFixed(1)}%`;
        
        // Hide percentage text if progress is too low
        if (percentage < 15) {
            progressPercentage.style.display = 'none';
        }
    }, 500);
    
    // Update stats
    document.getElementById(`${type}-actual`).textContent = formatCurrency(metrics.totalSales);
    document.getElementById(`${type}-goal`).textContent = formatCurrency(goal);
    document.getElementById(`${type}-remaining`).textContent = formatCurrency(remaining);
}

// Update summary stats
function updateSummaryStats(metrics) {
    document.getElementById('deals-won').textContent = metrics.dealsWon.toLocaleString();
    document.getElementById('avg-sale').textContent = formatCurrency(metrics.avgSale);
    document.getElementById('dig-rate').textContent = `${metrics.digRate.toFixed(1)}%`;
    document.getElementById('total-leads').textContent = metrics.totalLeads.toLocaleString();
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

// Show error
function showError(message) {
    document.getElementById('designer-name').textContent = 'Error loading data';
    console.error('Progress Dashboard Error:', message);
}
