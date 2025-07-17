// Enhanced widget.js - Complete Sales Metrics Widget Engine with Goal-Based Colors
// Handles all metric calculations with designer filtering and performance color coding

(async () => {
    console.log('🚀 Enhanced Sales Widget Loading...');
    
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
        else if (fileName.includes('dig-performance')) metric = 'dig_performance';
        else if (fileName.includes('unit-sales')) metric = 'unit_sales';
        else if (fileName.includes('average-project-sale')) metric = 'average_project_sale';
        else if (fileName.includes('lead-generation')) metric = 'lead_generation';
        else if (fileName.includes('goal-progress')) metric = 'goal_progress';
    }
    
    console.log(`🎯 Detected metric: ${metric} from filename: ${fileName}`);
    
    const designerId = urlParams.get('designer');
    const isTeam = urlParams.get('team') === 'true';
    const yearlyGoal = parseFloat(urlParams.get('yearlyGoal')) || 800000;
    const monthlyGoal = parseFloat(urlParams.get('monthlyGoal')) || 66667;
    const dateRange = urlParams.get('range') || 'ytd';
    
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
        
        // Calculate metric based on type (each metric handles its own date filtering)
        const result = calculateMetric(opportunities, metric, yearlyGoal, monthlyGoal, data, designerId, isTeam);
        
        // Display result with enhanced styling and goal-based colors
        displayEnhancedResult(result, metric, designerId, isTeam, monthlyGoal, yearlyGoal);
        
        console.log('✅ Enhanced Widget loaded successfully');
        
    } catch (error) {
        console.error('❌ Widget error:', error);
        showError(error.message);
    }
})();

// Calculate specific metric with proper date filtering per metric
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
                label: 'YTD Sales Total',
                goal: yearlyGoal,
                dealsCount: ytdOpportunities.length
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
                label: 'Monthly Sales',
                goal: monthlyGoal,
                dealsCount: monthlyOpportunities.length
            };
            
        case 'dig_performance':
            // MONTHLY: Only current month won opportunities for dig performance
            const monthlyDigOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth;
            });
            const monthlyCompletedJobs = monthlyDigOpportunities.filter(opp => 
                opp.contact?.tags?.includes('job completed')
            );
            const digPercentage = monthlyDigOpportunities.length > 0 
                ? (monthlyCompletedJobs.length / monthlyDigOpportunities.length) * 100 
                : 0;
            return {
                value: digPercentage,
                format: 'percentage',
                label: 'Dig Performance',
                goal: 85, // 85% target for dig performance
                additional: `${monthlyCompletedJobs.length} completed / ${monthlyDigOpportunities.length} won`,
                dealsCount: monthlyDigOpportunities.length
            };
            
        case 'unit_sales':
            // MONTHLY: Only current month won opportunities
            const monthlyUnitOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear && 
                       wonDate.getMonth() === currentMonth;
            });
            return {
                value: monthlyUnitOpportunities.length,
                format: 'number',
                label: 'Unit Sales',
                goal: 8, // 8 deals per month target
                dealsCount: monthlyUnitOpportunities.length
            };
            
        case 'average_project_sale':
            // YTD: Use year-to-date data for stable average calculation
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
                label: 'Average Project Sale',
                goal: 15000, // $15k average target
                dealsCount: avgOpportunities.length
            };
            
        case 'lead_generation':
            // MONTHLY: All opportunities assigned to designer this month (regardless of status)
            const monthlyLeads = opportunities.filter(opp => {
                const assignedDate = new Date(opp.updatedAt);
                return assignedDate.getFullYear() === currentYear && 
                       assignedDate.getMonth() === currentMonth;
            });
            return {
                value: monthlyLeads.length,
                format: 'number',
                label: 'Lead Generation',
                goal: 25, // 25 leads per month target
                dealsCount: monthlyLeads.length
            };
            
        case 'goal_progress':
            // Goal Progress: Calculate YTD vs Annual Goal percentage
            const goalProgressOpportunities = opportunities.filter(opp => {
                if (opp.status !== 'won') return false;
                const wonDate = new Date(opp.lastStatusChangeAt);
                return wonDate.getFullYear() === currentYear;
            });
            const ytdSales = goalProgressOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || 0), 0);
            const goalPercentage = (ytdSales / yearlyGoal) * 100;
            return {
                value: goalPercentage,
                format: 'percentage',
                label: 'Goal Progress',
                goal: 100, // 100% is the target
                additional: `$${ytdSales.toLocaleString()} of $${yearlyGoal.toLocaleString()} annual goal`,
                dealsCount: goalProgressOpportunities.length,
                actualAmount: ytdSales,
                goalAmount: yearlyGoal
            };
            
        default:
            return {
                value: 0,
                format: 'number',
                label: 'Unknown Metric',
                goal: 100,
                dealsCount: 0
            };
    }
}

// Enhanced display function with goal-based coloring
function displayEnhancedResult(result, metric, designerId, isTeam, monthlyGoal, yearlyGoal) {
    const valueElement = document.querySelector('.value');
    const labelElement = document.querySelector('.label');
    const additionalElement = document.querySelector('.additional');
    const designerElement = document.querySelector('.designer-name');
    const widgetElement = document.querySelector('.widget');
    
    // Calculate performance level based on goal achievement
    const percentage = (result.value / result.goal) * 100;
    let performanceLevel;
    let performanceText;
    
    if (percentage >= 90) {
        performanceLevel = 'excellent';
        performanceText = 'Excellent';
    } else if (percentage >= 70) {
        performanceLevel = 'good';
        performanceText = 'Good';
    } else {
        performanceLevel = 'needs-improvement';
        performanceText = 'Needs Focus';
    }
    
    console.log(`📊 Performance: ${performanceText} (${percentage.toFixed(1)}% of goal)`);
    
    // Apply performance class to widget and value
    if (widgetElement) {
        widgetElement.className = `widget ${performanceLevel}`;
        widgetElement.setAttribute('data-metric', metric);
        if (isTeam) {
            widgetElement.setAttribute('data-team', 'true');
        }
    }
    
    if (valueElement) {
        valueElement.textContent = formatValue(result.value, result.format);
        valueElement.className = `value ${performanceLevel}`;
    }
    
    if (labelElement) {
        labelElement.textContent = result.label;
    }
    
    // Add performance badge
    addPerformanceBadge(widgetElement, performanceText, performanceLevel);
    
    // Add goal progress elements for metrics that benefit from it
    if (['monthly_sales', 'ytd_sales_total', 'goal_progress'].includes(metric)) {
        addGoalProgressBar(widgetElement, percentage, performanceLevel, result);
    }
    
    // Add stats grid for enhanced metrics display
    addStatsGrid(widgetElement, result, metric);
    
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
        } else {
            designerElement.textContent = 'All Designers';
        }
    }
    
    // Update last updated time
    const lastUpdatedElement = document.querySelector('.last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
}

// Add performance badge to widget
function addPerformanceBadge(widgetElement, performanceText, performanceLevel) {
    if (!widgetElement) return;
    
    // Remove existing badge
    const existingBadge = widgetElement.querySelector('.performance-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Create new badge
    const badge = document.createElement('div');
    badge.className = 'performance-badge';
    badge.textContent = performanceText;
    widgetElement.appendChild(badge);
}

// Add goal progress bar to widget
function addGoalProgressBar(widgetElement, percentage, performanceLevel, result) {
    if (!widgetElement) return;
    
    // Remove existing progress
    const existingProgress = widgetElement.querySelector('.goal-progress');
    if (existingProgress) {
        existingProgress.remove();
    }
    
    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'goal-progress';
    
    progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">
            <span>Progress: <strong>${Math.round(percentage)}%</strong></span>
            <span>Goal: <strong>${formatValue(result.goal, result.format)}</strong></span>
        </div>
    `;
    
    // Insert after value element
    const valueElement = widgetElement.querySelector('.value');
    if (valueElement) {
        valueElement.parentNode.insertBefore(progressContainer, valueElement.nextSibling);
        
        // Animate progress bar
        setTimeout(() => {
            const progressFill = progressContainer.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${Math.min(percentage, 100)}%`;
            }
        }, 500);
    }
}

// Add stats grid to widget
function addStatsGrid(widgetElement, result, metric) {
    if (!widgetElement) return;
    
    // Remove existing stats
    const existingStats = widgetElement.querySelector('.stats-grid');
    if (existingStats) {
        existingStats.remove();
    }
    
    // Create stats grid
    const statsContainer = document.createElement('div');
    statsContainer.className = 'stats-grid';
    
    let stat1Label, stat1Value, stat2Label, stat2Value;
    
    switch (metric) {
        case 'monthly_sales':
        case 'ytd_sales_total':
            stat1Label = 'Deals Won';
            stat1Value = result.dealsCount || 0;
            stat2Label = 'Remaining';
            stat2Value = formatValue(Math.max(result.goal - result.value, 0), result.format);
            break;
        case 'goal_progress':
            stat1Label = 'YTD Sales';
            stat1Value = formatValue(result.actualAmount || 0, 'currency');
            stat2Label = 'Remaining';
            stat2Value = formatValue(Math.max((result.goalAmount || 0) - (result.actualAmount || 0), 0), 'currency');
            break;
        case 'lead_generation':
            stat1Label = 'Total Leads';
            stat1Value = result.dealsCount || 0;
            stat2Label = 'Monthly Goal';
            stat2Value = result.goal;
            break;
        case 'unit_sales':
            stat1Label = 'Deals Closed';
            stat1Value = result.dealsCount || 0;
            stat2Label = 'Monthly Goal';
            stat2Value = result.goal;
            break;
        case 'dig_performance':
            stat1Label = 'Completed';
            stat1Value = result.additional ? result.additional.split(' ')[0] : '0';
            stat2Label = 'Total Won';
            stat2Value = result.dealsCount || 0;
            break;
        case 'average_project_sale':
            stat1Label = 'Total Deals';
            stat1Value = result.dealsCount || 0;
            stat2Label = 'Target Avg';
            stat2Value = formatValue(result.goal, result.format);
            break;
        default:
            stat1Label = 'Current';
            stat1Value = formatValue(result.value, result.format);
            stat2Label = 'Goal';
            stat2Value = formatValue(result.goal, result.format);
    }
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${stat1Value}</div>
            <div class="stat-label">${stat1Label}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${stat2Value}</div>
            <div class="stat-label">${stat2Label}</div>
        </div>
    `;
    
    // Insert before last-updated element
    const lastUpdatedElement = widgetElement.querySelector('.last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.parentNode.insertBefore(statsContainer, lastUpdatedElement);
    } else {
        widgetElement.appendChild(statsContainer);
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
    const widgetElement = document.querySelector('.widget');
    
    if (widgetElement) {
        widgetElement.className = 'widget needs-improvement';
    }
    
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
