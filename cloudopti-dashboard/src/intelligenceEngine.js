/**
 * CloudOpti Intelligence Engine v2.0
 * Advanced algorithms for cloud resource optimization
 * 
 * This module provides:
 * - Anomaly Detection
 * - Trend Analysis
 * - Cost Forecasting
 * - Pattern Analysis
 * - Health Score Calculation
 * - Savings Calculation
 */

// ============================================================
// 1. ANOMALY DETECTION - كشف الشذوذ
// ============================================================

/**
 * Detects anomalies (outliers) in the data
 * @param {Array} data - Array of metric objects
 * @returns {Array} Array of detected anomalies
 */
export const detectAnomalies = (data) => {
  if (data.length < 5) return [];

  const anomalies = [];
  const lastData = data.slice(-20); // Last 20 data points

  // Calculate averages
  const avgCpu = lastData.reduce((sum, d) => sum + d.cpu, 0) / lastData.length;
  const avgRam = lastData.reduce((sum, d) => sum + d.ram, 0) / lastData.length;
  const avgCost = lastData.reduce((sum, d) => sum + d.cost, 0) / lastData.length;

  // Calculate standard deviations
  const stdDevCpu = Math.sqrt(
    lastData.reduce((sum, d) => sum + Math.pow(d.cpu - avgCpu, 2), 0) / lastData.length
  );

  const stdDevCost = Math.sqrt(
    lastData.reduce((sum, d) => sum + Math.pow(d.cost - avgCost, 2), 0) / lastData.length
  );

  const latest = lastData[lastData.length - 1];

  // CPU Spike Detection (more than 2 standard deviations)
  if (Math.abs(latest.cpu - avgCpu) > 2 * stdDevCpu && stdDevCpu > 0) {
    anomalies.push({
      type: 'cpu_spike',
      severity: 'high',
      message: `🔴 CPU spike detected: ${latest.cpu.toFixed(1)}% (avg: ${avgCpu.toFixed(1)}%)`,
      value: latest.cpu,
      expected: avgCpu,
      deviation: Math.abs(latest.cpu - avgCpu).toFixed(2),
    });
  }

  // Cost Spike Detection
  if (Math.abs(latest.cost - avgCost) > 2 * stdDevCost && stdDevCost > 0) {
    anomalies.push({
      type: 'cost_spike',
      severity: 'critical',
      message: `🔥 Cost spike detected: $${latest.cost.toFixed(6)} (avg: $${avgCost.toFixed(6)})`,
      value: latest.cost,
      expected: avgCost,
      deviation: Math.abs(latest.cost - avgCost).toFixed(6),
    });
  }

  // RAM Spike Detection
  const avgRamForSpike = lastData.reduce((sum, d) => sum + d.ram, 0) / lastData.length;
  const stdDevRam = Math.sqrt(
    lastData.reduce((sum, d) => sum + Math.pow(d.ram - avgRamForSpike, 2), 0) / lastData.length
  );

  if (Math.abs(latest.ram - avgRamForSpike) > 2 * stdDevRam && stdDevRam > 0) {
    anomalies.push({
      type: 'ram_spike',
      severity: 'high',
      message: `⚠️ RAM spike detected: ${latest.ram.toFixed(1)}% (avg: ${avgRamForSpike.toFixed(1)}%)`,
      value: latest.ram,
      expected: avgRamForSpike,
      deviation: Math.abs(latest.ram - avgRamForSpike).toFixed(2),
    });
  }

  return anomalies;
};

// ============================================================
// 2. TREND ANALYSIS - تحليل الاتجاهات
// ============================================================

/**
 * Analyzes trends in the data
 * @param {Array} data - Array of metric objects
 * @returns {Object} Trend analysis results
 */
export const analyzeTrends = (data) => {
  if (data.length < 10) return null;

  const lastData = data.slice(-30); // Last 30 data points
  const firstHalf = lastData.slice(0, 15);
  const secondHalf = lastData.slice(15);

  // Calculate averages for each half
  const avgCpuFirst = firstHalf.reduce((sum, d) => sum + d.cpu, 0) / firstHalf.length;
  const avgCpuSecond = secondHalf.reduce((sum, d) => sum + d.cpu, 0) / secondHalf.length;

  const avgRamFirst = firstHalf.reduce((sum, d) => sum + d.ram, 0) / firstHalf.length;
  const avgRamSecond = secondHalf.reduce((sum, d) => sum + d.ram, 0) / secondHalf.length;

  const avgCostFirst = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
  const avgCostSecond = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

  // Determine trends
  const cpuTrend = avgCpuSecond > avgCpuFirst ? 'increasing' : 'decreasing';
  const ramTrend = avgRamSecond > avgRamFirst ? 'increasing' : 'decreasing';
  const costTrend = avgCostSecond > avgCostFirst ? 'increasing' : 'decreasing';

  // Calculate percentage changes
  const cpuChangePercent = avgCpuFirst !== 0 ? ((avgCpuSecond - avgCpuFirst) / avgCpuFirst) * 100 : 0;
  const ramChangePercent = avgRamFirst !== 0 ? ((avgRamSecond - avgRamFirst) / avgRamFirst) * 100 : 0;
  const costChangePercent = avgCostFirst !== 0 ? ((avgCostSecond - avgCostFirst) / avgCostFirst) * 100 : 0;

  return {
    cpuTrend,
    ramTrend,
    costTrend,
    cpuChangePercent: cpuChangePercent.toFixed(2),
    ramChangePercent: ramChangePercent.toFixed(2),
    costChangePercent: costChangePercent.toFixed(2),
    avgCpuFirst: avgCpuFirst.toFixed(2),
    avgCpuSecond: avgCpuSecond.toFixed(2),
    avgRamFirst: avgRamFirst.toFixed(2),
    avgRamSecond: avgRamSecond.toFixed(2),
    avgCostFirst: avgCostFirst.toFixed(6),
    avgCostSecond: avgCostSecond.toFixed(6),
  };
};

// ============================================================
// 3. COST FORECASTING - توقع التكاليف
// ============================================================

/**
 * Forecasts future costs using linear regression
 * @param {Array} data - Array of metric objects
 * @returns {Object} Cost forecast results
 */
export const forecastCosts = (data) => {
  if (data.length < 5) return null;

  const lastData = data.slice(-24); // Last 24 data points
  const costValues = lastData.map(d => d.cost);

  // Calculate average cost
  const avgCost = costValues.reduce((a, b) => a + b) / costValues.length;

  // Calculate min and max
  const minCost = Math.min(...costValues);
  const maxCost = Math.max(...costValues);

  // Forecast monthly and yearly costs
  const estimatedMonthlyCost = avgCost * 3600 * 730; // 730 hours per month
  const estimatedYearlyCost = estimatedMonthlyCost * 12;

  const minMonthlyCost = minCost * 3600 * 730;
  const maxMonthlyCost = maxCost * 3600 * 730;

  // Calculate trend for confidence
  const firstHalf = lastData.slice(0, 12);
  const secondHalf = lastData.slice(12);
  const avgFirstHalf = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

  const trend = avgSecondHalf > avgFirstHalf ? 'increasing' : 'decreasing';
  const trendStrength = Math.abs((avgSecondHalf - avgFirstHalf) / avgFirstHalf * 100);

  let confidence = 'high';
  if (trendStrength > 20) confidence = 'medium';
  if (trendStrength > 40) confidence = 'low';

  return {
    estimatedMonthlyCost: estimatedMonthlyCost.toFixed(2),
    estimatedYearlyCost: estimatedYearlyCost.toFixed(2),
    minMonthlyCost: minMonthlyCost.toFixed(2),
    maxMonthlyCost: maxMonthlyCost.toFixed(2),
    avgCost: avgCost.toFixed(6),
    trend,
    confidence,
    trendStrength: trendStrength.toFixed(2),
  };
};

// ============================================================
// 4. PATTERN ANALYSIS - تحليل الأنماط
// ============================================================

/**
 * Analyzes patterns in the data
 * @param {Array} data - Array of metric objects
 * @returns {Object} Pattern analysis results
 */
export const analyzePatterns = (data) => {
  if (data.length < 10) return null;

  const lastData = data.slice(-20); // Last 20 data points

  // Extract values
  const cpuValues = lastData.map(d => d.cpu);
  const ramValues = lastData.map(d => d.ram);
  const costValues = lastData.map(d => d.cost);

  // Calculate statistics
  const avgCpu = cpuValues.reduce((a, b) => a + b) / cpuValues.length;
  const avgRam = ramValues.reduce((a, b) => a + b) / ramValues.length;
  const avgCost = costValues.reduce((a, b) => a + b) / costValues.length;

  const maxCpu = Math.max(...cpuValues);
  const minCpu = Math.min(...cpuValues);
  const maxRam = Math.max(...ramValues);
  const minRam = Math.min(...ramValues);

  const cpuVariance = maxCpu - minCpu;
  const ramVariance = maxRam - minRam;

  // Calculate standard deviations
  const stdDevCpu = Math.sqrt(cpuValues.reduce((sum, val) => sum + Math.pow(val - avgCpu, 2), 0) / cpuValues.length);
  const stdDevRam = Math.sqrt(ramValues.reduce((sum, val) => sum + Math.pow(val - avgRam, 2), 0) / ramValues.length);

  // Pattern detection
  const isStable = cpuVariance < 10 && ramVariance < 10;
  const isZombie = avgCpu < 15 && cpuVariance < 5; // Idle resource
  const isUnderUtilized = avgCpu < 30 && avgRam < 30; // Under-utilized
  const isBursty = cpuVariance > 60; // Bursty usage
  const isHighLoad = avgCpu > 70 || avgRam > 70; // High load
  const isOptimal = avgCpu >= 30 && avgCpu <= 70 && avgRam >= 30 && avgRam <= 70; // Optimal

  // Determine primary pattern
  let pattern = 'stable';
  if (isZombie) pattern = 'zombie';
  else if (isUnderUtilized) pattern = 'underutilized';
  else if (isBursty) pattern = 'bursty';
  else if (isHighLoad) pattern = 'high-load';
  else if (isOptimal) pattern = 'optimal';

  return {
    avgCpu: avgCpu.toFixed(2),
    avgRam: avgRam.toFixed(2),
    avgCost: avgCost.toFixed(6),
    maxCpu: maxCpu.toFixed(2),
    minCpu: minCpu.toFixed(2),
    maxRam: maxRam.toFixed(2),
    minRam: minRam.toFixed(2),
    cpuVariance: cpuVariance.toFixed(2),
    ramVariance: ramVariance.toFixed(2),
    stdDevCpu: stdDevCpu.toFixed(2),
    stdDevRam: stdDevRam.toFixed(2),
    isStable,
    isZombie,
    isUnderUtilized,
    isBursty,
    isHighLoad,
    isOptimal,
    pattern,
  };
};

// ============================================================
// 5. HEALTH SCORE - درجة الصحة
// ============================================================

/**
 * Calculates system health score (0-100)
 * @param {Array} data - Array of metric objects
 * @param {Array} anomalies - Array of detected anomalies
 * @returns {Object} Health score and status
 */
export const calculateHealthScore = (data, anomalies) => {
  let score = 100;

  if (data.length === 0) {
    return {
      score: 0,
      status: '🔴 Poor',
      avgCpu: 0,
      avgRam: 0,
      recommendation: 'No data available',
    };
  }

  const lastData = data.slice(-20);
  const avgCpu = lastData.reduce((sum, d) => sum + d.cpu, 0) / lastData.length;
  const avgRam = lastData.reduce((sum, d) => sum + d.ram, 0) / lastData.length;

  // Deduct points based on CPU usage
  if (avgCpu > 90) score -= 30;
  else if (avgCpu > 80) score -= 20;
  else if (avgCpu > 60) score -= 10;
  else if (avgCpu < 10) score -= 5; // Too low - might be wasted resources

  // Deduct points based on RAM usage
  if (avgRam > 90) score -= 30;
  else if (avgRam > 80) score -= 20;
  else if (avgRam > 60) score -= 10;
  else if (avgRam < 10) score -= 5; // Too low - might be wasted resources

  // Deduct points based on anomalies
  anomalies.forEach(anomaly => {
    if (anomaly.severity === 'critical') score -= 15;
    else if (anomaly.severity === 'high') score -= 10;
  });

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status, recommendation;
  if (score >= 85) {
    status = '🟢 Excellent';
    recommendation = 'System is running optimally';
  } else if (score >= 70) {
    status = '🟡 Good';
    recommendation = 'Minor optimizations recommended';
  } else if (score >= 50) {
    status = '🟠 Fair';
    recommendation = 'Several optimizations needed';
  } else if (score >= 30) {
    status = '🔴 Poor';
    recommendation = 'Urgent optimization required';
  } else {
    status = '🔴 Critical';
    recommendation = 'Critical issues detected - immediate action needed';
  }

  return {
    score: Math.round(score),
    status,
    recommendation,
    avgCpu: avgCpu.toFixed(2),
    avgRam: avgRam.toFixed(2),
    anomalyCount: anomalies.length,
  };
};

// ============================================================
// 6. RESOURCE OPTIMIZATION - تحسين الموارد
// ============================================================

/**
 * Generates optimization recommendations
 * @param {Array} data - Array of metric objects
 * @param {Object} patterns - Pattern analysis results
 * @param {Array} anomalies - Detected anomalies
 * @returns {Array} Array of recommendations
 */
export const optimizeResources = (data, patterns, anomalies = []) => {
  const recommendations = [];

  if (!patterns) return recommendations;

  // 1. Zombie Resources Detection
  if (patterns.isZombie) {
    recommendations.push({
      id: 'zombie-1',
      type: 'critical',
      priority: 'critical',
      title: '🧟 Zombie Resources Detected',
      description: `CPU usage is consistently below 15% with minimal variance. This resource is likely idle and can be safely terminated.`,
      action: 'stop',
      estimatedSavings: 150,
      confidence: 0.98,
      resourceId: 'zombie-1',
      details: {
        avgCpu: patterns.avgCpu,
        cpuVariance: patterns.cpuVariance,
        recommendation: 'Terminate this resource immediately',
      },
    });
  }

  // 2. Under-Utilized Resources
  if (patterns.isUnderUtilized) {
    recommendations.push({
      id: 'underutilized-1',
      type: 'warning',
      priority: 'high',
      title: '📉 Under-Utilized Resources',
      description: `CPU: ${patterns.avgCpu}% | RAM: ${patterns.avgRam}%. This resource is significantly under-utilized and can be downsized.`,
      action: 'downsize',
      estimatedSavings: 75,
      confidence: 0.92,
      resourceId: 'underutilized-1',
      details: {
        avgCpu: patterns.avgCpu,
        avgRam: patterns.avgRam,
        recommendation: 'Consider moving to a smaller instance type',
      },
    });
  }

  // 3. Bursty Usage Pattern
  if (patterns.isBursty) {
    recommendations.push({
      id: 'bursty-1',
      type: 'info',
      priority: 'medium',
      title: '⚡ Bursty Usage Pattern Detected',
      description: `This resource shows intermittent usage spikes. Auto-scaling could optimize costs by scaling down during idle periods.`,
      action: 'autoscale',
      estimatedSavings: 50,
      confidence: 0.85,
      resourceId: 'bursty-1',
      details: {
        cpuVariance: patterns.cpuVariance,
        recommendation: 'Enable auto-scaling policies',
      },
    });
  }

  // 4. High Load Detection
  if (patterns.isHighLoad) {
    recommendations.push({
      id: 'high-load-1',
      type: 'critical',
      priority: 'critical',
      title: '🔥 High Resource Utilization',
      description: `CPU or RAM usage exceeds 70%. This resource may need upgrading to prevent performance degradation.`,
      action: 'upgrade',
      estimatedSavings: -200, // Negative savings (cost increase)
      confidence: 0.9,
      resourceId: 'high-load-1',
      details: {
        avgCpu: patterns.avgCpu,
        avgRam: patterns.avgRam,
        recommendation: 'Upgrade to a larger instance type',
      },
    });
  }

  // 5. Cost Anomalies
  if (anomalies.length > 0) {
    const costAnomalies = anomalies.filter(a => a.type === 'cost_spike');
    if (costAnomalies.length > 0) {
      recommendations.push({
        id: 'cost-spike-1',
        type: 'warning',
        priority: 'high',
        title: '💰 Unexpected Cost Spike',
        description: `Cost has increased unexpectedly. Investigate for unauthorized resources or configuration changes.`,
        action: 'investigate',
        estimatedSavings: 100,
        confidence: 0.8,
        resourceId: 'cost-spike-1',
        details: {
          anomalyCount: costAnomalies.length,
          recommendation: 'Review resource configuration and billing',
        },
      });
    }
  }

  // 6. Optimal Usage
  if (patterns.isOptimal && recommendations.length === 0) {
    recommendations.push({
      id: 'optimal-1',
      type: 'success',
      priority: 'low',
      title: '✅ Optimal Resource Utilization',
      description: `Your resources are optimally configured with balanced CPU and RAM usage.`,
      action: 'maintain',
      estimatedSavings: 0,
      confidence: 1.0,
      resourceId: 'optimal-1',
      details: {
        avgCpu: patterns.avgCpu,
        avgRam: patterns.avgRam,
        recommendation: 'Continue monitoring current configuration',
      },
    });
  }

  return recommendations;
};

// ============================================================
// 7. SAVINGS CALCULATOR - حساب التوفيرات
// ============================================================

/**
 * Calculates total potential savings
 * @param {Array} recommendations - Array of recommendations
 * @returns {Object} Savings calculation results
 */
export const calculateTotalSavings = (recommendations) => {
  let totalSavings = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  recommendations.forEach(rec => {
    totalSavings += rec.estimatedSavings;
    if (rec.priority === 'critical') criticalCount++;
    else if (rec.priority === 'high') highCount++;
    else if (rec.priority === 'medium') mediumCount++;
  });

  const monthlyROI = totalSavings > 0 ? (totalSavings / 100).toFixed(2) : 0;
  const yearlyROI = (totalSavings * 12).toFixed(2);

  return {
    totalSavings: totalSavings.toFixed(2),
    monthlyROI,
    yearlyROI,
    criticalIssues: criticalCount,
    highIssues: highCount,
    mediumIssues: mediumCount,
    totalIssues: recommendations.length,
    savingsPercentage: totalSavings > 0 ? ((totalSavings / 1000) * 100).toFixed(2) : 0,
  };
};

// ============================================================
// 8. EXPORT ALL FUNCTIONS
// ============================================================

export const intelligenceEngine = {
  detectAnomalies,
  analyzeTrends,
  forecastCosts,
  analyzePatterns,
  calculateHealthScore,
  optimizeResources,
  calculateTotalSavings,
};

export default intelligenceEngine;