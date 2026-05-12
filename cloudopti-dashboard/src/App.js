import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [metrics, setMetrics] = useState({
    cpu: 0,
    ram: 0,
    cost: 0,
    ramUsedGb: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [ledStatus, setLedStatus] = useState('green');
  const [stoppedResources, setStoppedResources] = useState([]);
  const [showStopConfirm, setShowStopConfirm] = useState(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [anomalies, setAnomalies] = useState([]);
  const [trends, setTrends] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [healthScore, setHealthScore] = useState(0);
  const [patterns, setPatterns] = useState(null);

  // Firebase URL - استبدل برابط قاعدة البيانات الخاصة بك
  const FIREBASE_URL = 'https://cloudopti-project-6c2d9-default-rtdb.firebaseio.com';

  // ============================================================
  // INTELLIGENCE ENGINE - محرك الذكاء
  // ============================================================

  // 1. كشف الشذوذ
  const detectAnomalies = (data) => {
    if (data.length < 5) return [];
    const anomalies = [];
    const lastData = data.slice(-20);

    const avgCpu = lastData.reduce((sum, d) => sum + d.cpu, 0) / lastData.length;
    const avgRam = lastData.reduce((sum, d) => sum + d.ram, 0) / lastData.length;
    const avgCost = lastData.reduce((sum, d) => sum + d.cost, 0) / lastData.length;

    const stdDevCpu = Math.sqrt(
      lastData.reduce((sum, d) => sum + Math.pow(d.cpu - avgCpu, 2), 0) / lastData.length
    );
    const stdDevCost = Math.sqrt(
      lastData.reduce((sum, d) => sum + Math.pow(d.cost - avgCost, 2), 0) / lastData.length
    );

    const latest = lastData[lastData.length - 1];

    if (Math.abs(latest.cpu - avgCpu) > 2 * stdDevCpu) {
      anomalies.push({
        type: 'cpu_spike',
        severity: 'high',
        message: `🔴 CPU spike detected: ${latest.cpu.toFixed(1)}% (avg: ${avgCpu.toFixed(1)}%)`,
        value: latest.cpu,
        expected: avgCpu,
      });
    }

    if (Math.abs(latest.cost - avgCost) > 2 * stdDevCost) {
      anomalies.push({
        type: 'cost_spike',
        severity: 'critical',
        message: `🔥 Cost spike detected: $${latest.cost.toFixed(6)} (avg: $${avgCost.toFixed(6)})`,
        value: latest.cost,
        expected: avgCost,
      });
    }

    return anomalies;
  };

  // 2. تحليل الاتجاهات
  const analyzeTrends = (data) => {
    if (data.length < 10) return null;

    const lastData = data.slice(-30);
    const firstHalf = lastData.slice(0, 15);
    const secondHalf = lastData.slice(15);

    const avgCpuFirst = firstHalf.reduce((sum, d) => sum + d.cpu, 0) / firstHalf.length;
    const avgCpuSecond = secondHalf.reduce((sum, d) => sum + d.cpu, 0) / secondHalf.length;

    const avgCostFirst = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
    const avgCostSecond = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

    const cpuTrend = avgCpuSecond > avgCpuFirst ? 'increasing' : 'decreasing';
    const costTrend = avgCostSecond > avgCostFirst ? 'increasing' : 'decreasing';

    const cpuChangePercent = ((avgCpuSecond - avgCpuFirst) / avgCpuFirst) * 100;
    const costChangePercent = ((avgCostSecond - avgCostFirst) / avgCostFirst) * 100;

    return {
      cpuTrend,
      costTrend,
      cpuChangePercent: cpuChangePercent.toFixed(2),
      costChangePercent: costChangePercent.toFixed(2),
      avgCpuCurrent: avgCpuSecond.toFixed(2),
      avgCostCurrent: avgCostSecond.toFixed(6),
    };
  };

  // 3. توقع التكاليف
  const forecastCosts = (data) => {
    if (data.length < 5) return null;

    const lastData = data.slice(-24);
    const avgCost = lastData.reduce((sum, d) => sum + d.cost, 0) / lastData.length;

    const estimatedMonthlyCost = avgCost * 3600 * 730;
    const estimatedYearlyCost = estimatedMonthlyCost * 12;

    const minCost = Math.min(...lastData.map(d => d.cost));
    const maxCost = Math.max(...lastData.map(d => d.cost));

    const minMonthlyCost = minCost * 3600 * 730;
    const maxMonthlyCost = maxCost * 3600 * 730;

    return {
      estimatedMonthlyCost: estimatedMonthlyCost.toFixed(2),
      estimatedYearlyCost: estimatedYearlyCost.toFixed(2),
      minMonthlyCost: minMonthlyCost.toFixed(2),
      maxMonthlyCost: maxMonthlyCost.toFixed(2),
    };
  };

  // 4. تحليل الأنماط
  const analyzePatterns = (data) => {
    if (data.length < 10) return null;

    const lastData = data.slice(-20);

    const cpuValues = lastData.map(d => d.cpu);
    const ramValues = lastData.map(d => d.ram);

    const avgCpu = cpuValues.reduce((a, b) => a + b) / cpuValues.length;
    const avgRam = ramValues.reduce((a, b) => a + b) / ramValues.length;

    const maxCpu = Math.max(...cpuValues);
    const minCpu = Math.min(...cpuValues);
    const maxRam = Math.max(...ramValues);
    const minRam = Math.min(...ramValues);

    const cpuVariance = maxCpu - minCpu;
    const ramVariance = maxRam - minRam;

    const isStable = cpuVariance < 10 && ramVariance < 10;
    const isZombie = avgCpu < 15 && cpuVariance < 5;
    const isUnderUtilized = avgCpu < 30 && avgRam < 30;
    const isBursty = cpuVariance > 60;
    const isHighLoad = avgCpu > 70 || avgRam > 70;

    return {
      avgCpu: avgCpu.toFixed(2),
      avgRam: avgRam.toFixed(2),
      cpuVariance: cpuVariance.toFixed(2),
      ramVariance: ramVariance.toFixed(2),
      isStable,
      isZombie,
      isUnderUtilized,
      isBursty,
      isHighLoad,
      pattern: isZombie ? 'zombie' : isUnderUtilized ? 'underutilized' : isBursty ? 'bursty' : isHighLoad ? 'high-load' : 'stable',
    };
  };

  // 5. حساب درجة الصحة
  const calculateHealthScore = (data, anomalies) => {
    let score = 100;

    if (data.length === 0) return { score: 0, status: '🔴 Poor', avgCpu: 0, avgRam: 0 };

    const lastData = data.slice(-20);
    const avgCpu = lastData.reduce((sum, d) => sum + d.cpu, 0) / lastData.length;
    const avgRam = lastData.reduce((sum, d) => sum + d.ram, 0) / lastData.length;

    if (avgCpu > 80) score -= 20;
    else if (avgCpu > 60) score -= 10;

    if (avgRam > 80) score -= 20;
    else if (avgRam > 60) score -= 10;

    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'critical') score -= 15;
      else if (anomaly.severity === 'high') score -= 10;
    });

    score = Math.max(0, Math.min(100, score));

    let status;
    if (score >= 80) status = '🟢 Excellent';
    else if (score >= 60) status = '🟡 Good';
    else if (score >= 40) status = '🟠 Fair';
    else status = '🔴 Poor';

    return {
      score: Math.round(score),
      status,
      avgCpu: avgCpu.toFixed(2),
      avgRam: avgRam.toFixed(2),
    };
  };

  // 6. توليد التوصيات
  const generateRecommendations = (data, patterns, anomalies) => {
    const recs = [];
    let savings = 0;

    if (!patterns) return { recs: [], savings: 0 };

    // 1. موارد خاملة
    if (patterns.isZombie) {
      recs.push({
        id: 1,
        type: 'critical',
        title: '🧟 موارد خاملة (Zombie)',
        description: 'هذا المورد لا يعمل بشكل فعلي - CPU ثابت جداً',
        savings: '$150/month',
        savingsValue: 150,
        action: 'stop',
        resourceId: 'zombie-1',
      });
      savings += 150;
    }

    // 2. موارد غير مستخدمة
    if (patterns.isUnderUtilized) {
      recs.push({
        id: 2,
        type: 'warning',
        title: '📉 موارد غير مستخدمة',
        description: `CPU: ${patterns.avgCpu}% | RAM: ${patterns.avgRam}% - يمكن تقليل الحجم`,
        savings: '$75/month',
        savingsValue: 75,
        action: 'downsize',
        resourceId: 'underutilized-1',
      });
      savings += 75;
    }

    // 3. استخدام متقطع
    if (patterns.isBursty) {
      recs.push({
        id: 3,
        type: 'info',
        title: '⚡ استخدام متقطع',
        description: 'هذا المورد يستخدم بشكل متقطع - يمكن استخدام Auto-scaling',
        savings: '$50/month',
        savingsValue: 50,
        action: 'autoscale',
        resourceId: 'bursty-1',
      });
      savings += 50;
    }

    // 4. CPU مرتفع
    if (patterns.isHighLoad) {
      recs.push({
        id: 4,
        type: 'critical',
        title: '🔴 CPU/RAM مرتفع جداً',
        description: `الاستخدام أعلى من 70% - قد تحتاج إلى ترقية`,
        savings: '-$200/month',
        savingsValue: -200,
        action: 'upgrade',
        resourceId: 'high-load-1',
      });
      savings -= 200;
    }

    // 5. شذوذ في التكاليف
    if (anomalies.length > 0) {
      recs.push({
        id: 5,
        type: 'warning',
        title: '💰 تكاليف غير متوقعة',
        description: 'تم اكتشاف شذوذ في التكاليف - يرجى التحقق',
        savings: '$100/month',
        savingsValue: 100,
        action: 'investigate',
        resourceId: 'cost-spike-1',
      });
      savings += 100;
    }

    return { recs, savings };
  };

  // ============================================================
  // MAIN DATA FETCHING
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${FIREBASE_URL}/cloud_metrics.json`);
        const data = await response.json();

        if (data) {
          const entries = Object.entries(data)
            .map(([key, value]) => ({
              timestamp: key,
              cpu: value.cpu_percent || 0,
              ram: value.ram_percent || 0,
              cost: value.simulated_cost_interval || 0,
              ramUsedGb: value.ram_used_gb || 0,
            }))
            .slice(-60);

          setChartData(entries);

          if (entries.length > 0) {
            const latest = entries[entries.length - 1];
            setMetrics({
              cpu: latest.cpu,
              ram: latest.ram,
              cost: latest.cost,
              ramUsedGb: latest.ramUsedGb,
            });

            // تحليل البيانات
            const detectedAnomalies = detectAnomalies(entries);
            setAnomalies(detectedAnomalies);

            const trendAnalysis = analyzeTrends(entries);
            setTrends(trendAnalysis);

            const costForecast = forecastCosts(entries);
            setForecast(costForecast);

            const patternAnalysis = analyzePatterns(entries);
            setPatterns(patternAnalysis);

            const health = calculateHealthScore(entries, detectedAnomalies);
            setHealthScore(health);

            // توليد التوصيات
            const { recs, savings } = generateRecommendations(entries, patternAnalysis, detectedAnomalies);
            setRecommendations(recs);
            setTotalSavings(savings);

            // تحديد LED
            if (latest.cpu > 80 || latest.ram > 80) {
              setLedStatus('red');
            } else if (latest.cpu > 60 || latest.ram > 60) {
              setLedStatus('yellow');
            } else {
              setLedStatus('green');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStopResource = (resourceId, title) => {
    setShowStopConfirm({ resourceId, title });
  };

  const confirmStop = (resourceId, title) => {
    setStoppedResources([
      ...stoppedResources,
      {
        id: resourceId,
        title,
        stoppedAt: new Date().toLocaleTimeString(),
      },
    ]);

    setRecommendations(recommendations.filter(r => r.resourceId !== resourceId));
    setShowStopConfirm(null);

    alert(`✅ تم إيقاف: ${title}\nتم توفير موارد بنجاح!`);
  };

  const getMonthlyCost = () => {
    return (metrics.cost * 3600 * 730).toFixed(2);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>☁️ CloudOpti Dashboard</h1>
        <p>Real-time Cloud Resource Monitoring & Advanced Cost Optimization</p>
      </header>

      {/* Metrics Cards */}
      <div className="metrics-container">
        <div className="metric-card cpu-card">
          <div className="metric-label">CPU Usage</div>
          <div className="metric-value">{metrics.cpu.toFixed(1)}%</div>
          <div className="metric-status">
            {metrics.cpu > 80 ? '🔴 Critical' : metrics.cpu > 60 ? '🟡 High' : '🟢 Optimal'}
          </div>
        </div>

        <div className="metric-card ram-card">
          <div className="metric-label">RAM Usage</div>
          <div className="metric-value">{metrics.ram.toFixed(1)}%</div>
          <div className="metric-sub">{metrics.ramUsedGb.toFixed(2)} GB used</div>
          <div className="metric-status">
            {metrics.ram > 80 ? '🔴 Critical' : metrics.ram > 60 ? '🟡 High' : '🟢 Optimal'}
          </div>
        </div>

        <div className="metric-card cost-card">
          <div className="metric-label">Hourly Cost</div>
          <div className="metric-value">${metrics.cost.toFixed(6)}</div>
          <div className="metric-sub">Est. Monthly: ${getMonthlyCost()}</div>
          <div className="metric-status">📊 Real-time</div>
        </div>

        <div className="metric-card savings-card">
          <div className="metric-label">Potential Savings</div>
          <div className="metric-value" style={{ color: totalSavings > 0 ? '#10b981' : '#ef4444' }}>
            ${Math.abs(totalSavings)}/month
          </div>
          <div className="metric-status">
            {totalSavings > 0 ? '💰 Save Money' : '⚠️ Upgrade Needed'}
          </div>
        </div>

        {healthScore && (
          <div className="metric-card health-card">
            <div className="metric-label">System Health</div>
            <div className="metric-value">{healthScore.score}%</div>
            <div className="metric-status">{healthScore.status}</div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="charts-container">
        <div className="chart-box">
          <h3>📈 Resource Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" name="CPU %" />
              <Line type="monotone" dataKey="ram" stroke="#8b5cf6" name="RAM %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>💵 Cost Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cost" fill="#10b981" stroke="#059669" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ESP32 Simulator */}
      <div className="hardware-simulator">
        <div className="esp32-device">
          <div className="device-label">ESP32 IoT Monitor v1.0</div>
          <div className="oled-screen">
            <div className="oled-content">
              <div className="oled-line">CPU: {metrics.cpu.toFixed(1)}%</div>
              <div className="oled-line">RAM: {metrics.ram.toFixed(1)}%</div>
              <div className="oled-line">Cost: ${metrics.cost.toFixed(6)}</div>
            </div>
          </div>
          <div className="led-indicators">
            <div className={`led ${ledStatus === 'green' ? 'led-green' : ''}`}></div>
            <div className={`led ${ledStatus === 'yellow' ? 'led-yellow' : ''}`}></div>
            <div className={`led ${ledStatus === 'red' ? 'led-red' : ''}`}></div>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="anomalies-container">
          <h3>⚠️ Detected Anomalies</h3>
          <div className="anomalies-list">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className={`anomaly-item ${anomaly.severity}`}>
                <div className="anomaly-message">{anomaly.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast */}
      {forecast && (
        <div className="forecast-container">
          <h3>📊 Cost Forecast</h3>
          <div className="forecast-grid">
            <div className="forecast-item">
              <span className="forecast-label">Monthly Estimate</span>
              <span className="forecast-value">${forecast.estimatedMonthlyCost}</span>
            </div>
            <div className="forecast-item">
              <span className="forecast-label">Yearly Estimate</span>
              <span className="forecast-value">${forecast.estimatedYearlyCost}</span>
            </div>
            <div className="forecast-item">
              <span className="forecast-label">Min Monthly</span>
              <span className="forecast-value">${forecast.minMonthlyCost}</span>
            </div>
            <div className="forecast-item">
              <span className="forecast-label">Max Monthly</span>
              <span className="forecast-value">${forecast.maxMonthlyCost}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="recommendations-container">
        <h3>🎯 Advanced Alerts & Recommendations</h3>
        <div className="recommendations-list">
          {recommendations.length === 0 ? (
            <div className="no-alerts">✓ All systems optimal - No alerts</div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.id} className={`recommendation ${rec.type}`}>
                <div className="rec-title">{rec.title}</div>
                <div className="rec-description">{rec.description}</div>
                <div className="rec-footer">
                  <span className="rec-savings">Potential Savings: {rec.savings}</span>
                  {rec.action === 'stop' && (
                    <button
                      className="btn-stop"
                      onClick={() => handleStopResource(rec.resourceId, rec.title)}
                    >
                      🛑 Stop Now
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stopped Resources */}
      {stoppedResources.length > 0 && (
        <div className="stopped-resources-container">
          <h3>✅ Stopped Resources</h3>
          <div className="stopped-list">
            {stoppedResources.map((resource) => (
              <div key={resource.id} className="stopped-item">
                <span>{resource.title}</span>
                <span className="stopped-time">{resource.stoppedAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ تأكيد الإيقاف</h3>
            <p>هل أنت متأكد من إيقاف: <strong>{showStopConfirm.title}</strong>؟</p>
            <p className="warning-text">هذا الإجراء سيوقف المورد وقد لا يمكن استرجاعه فوراً.</p>
            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={() => confirmStop(showStopConfirm.resourceId, showStopConfirm.title)}
              >
                ✅ نعم، أوقف الآن
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowStopConfirm(null)}
              >
                ❌ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>CloudOpti © 2026 | Advanced Cloud Optimization with AI Detection</p>
      </footer>
    </div>
  );
}

export default App;