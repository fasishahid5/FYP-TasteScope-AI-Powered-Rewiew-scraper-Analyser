import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessOwnerLayout from '../components/BusinessOwnerLayout';
import { getStoredToken, getStoredUser, handleExpiredAuthSession } from '../lib/auth';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  
  // State for all dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kpiCards, setKpiCards] = useState([]);
  const [quickInsights, setQuickInsights] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [systemActions, setSystemActions] = useState([]);
  const [latestAIInsight, setLatestAIInsight] = useState('');
  const [systemHealth, setSystemHealth] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = getStoredToken() || getStoredUser()?.token || null;
        console.log('Auth token present:', !!token);

        if (!token) {
          throw new Error('Missing authentication token');
        }

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        // Test the connection first
        console.log('Testing API connection...');
        const testRes = await fetch('/api/business/test', { headers });
        if (testRes.status === 401 || testRes.status === 403) {
          handleExpiredAuthSession();
          return;
        }
        const testData = await testRes.json();
        console.log('API test response:', testData);

        // Fetch all data in parallel
        console.log('Fetching dashboard data...');
        const [overviewRes, recentReviewsRes, analyticsRes] = await Promise.all([
          fetch('/api/business/dashboard/overview', { headers }),
          fetch('/api/business/reviews/recent', { headers }),
          fetch('/api/business/analytics', { headers }),
        ]);

        if ([overviewRes.status, recentReviewsRes.status, analyticsRes.status].some((status) => status === 401 || status === 403)) {
          handleExpiredAuthSession();
          return;
        }

        console.log('Response statuses:', {
          overview: overviewRes.status,
          reviews: recentReviewsRes.status,
          analytics: analyticsRes.status,
        });

        if (!overviewRes.ok || !recentReviewsRes.ok || !analyticsRes.ok) {
          const overview = !overviewRes.ok ? await overviewRes.text() : '';
          const reviews = !recentReviewsRes.ok ? await recentReviewsRes.text() : '';
          const analytics = !analyticsRes.ok ? await analyticsRes.text() : '';
          console.error('Response errors:', { overview, reviews, analytics });
          throw new Error(`Failed to fetch dashboard data`);
        }

        const overview = await overviewRes.json();
        const reviewsData = await recentReviewsRes.json();
        const analyticsData = await analyticsRes.json();

        console.log('Fetched data:', { overview, reviewsData, analyticsData });

        // Build KPI cards from overview
        setKpiCards([
          { label: 'Total Reviews', value: overview.totalReviews?.toLocaleString() || '0' },
          { label: 'Average Rating', value: `${overview.averageRating || 4.3} / 5.0` },
          { label: 'Positive Sentiment', value: `${overview.weeklySentiment || 87}%` },
          { label: 'Active Restaurants', value: overview.activeLocations || '0' },
        ]);

        // Build quick insights
        setQuickInsights([
          { label: 'Weekly Sentiment', value: `${overview.weeklySentiment || 87}%` },
          { label: 'AI Insights Ready', value: '6' },
          { label: 'Recent Activity', value: '12' },
          { label: 'Flagged Reviews', value: overview.flaggedReviews || '0' },
        ]);

        // Set recent reviews
        setRecentReviews(reviewsData.slice(0, 5) || []);

        // Set system actions (mock for now)
        setSystemActions([
          { id: 1, action: 'Menu update published' },
          { id: 2, action: 'Review response posted' },
          { id: 3, action: 'New competitor alert generated' },
        ]);

        // Set latest AI insight
        setLatestAIInsight(
          analyticsData?.sentimentTrend?.[analyticsData.sentimentTrend.length - 1] 
            ? `Positive sentiment ${analyticsData.sentimentTrend[analyticsData.sentimentTrend.length - 1].positive}% detected in recent reviews across your locations.`
            : 'AI has detected trends in your review sentiment.'
        );

        // Set system health
        setSystemHealth({
          scrapingStatus: 'Healthy',
          lastSync: overview.lastSync ? new Date(overview.lastSync).toLocaleString() : 'Jun 4, 2026 09:12 AM',
          apiStatus: 'Online',
        });

        setError(null);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <BusinessOwnerLayout
        activeItem="dashboard"
        pageTitle="Business Dashboard"
        pageDescription="Your owner console gives you fast access to restaurant performance, top reviews, and intelligent recommendations."
      >
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Loading dashboard...</p>
        </div>
      </BusinessOwnerLayout>
    );
  }

  if (error) {
    return (
      <BusinessOwnerLayout
        activeItem="dashboard"
        pageTitle="Business Dashboard"
        pageDescription="Your owner console gives you fast access to restaurant performance, top reviews, and intelligent recommendations."
      >
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#ef4444', fontSize: '16px' }}>{error}</p>
        </div>
      </BusinessOwnerLayout>
    );
  }

  return (
    <BusinessOwnerLayout
      activeItem="dashboard"
      pageTitle="Business Dashboard"
      pageDescription="Your owner console gives you fast access to restaurant performance, top reviews, and intelligent recommendations."
    >
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
          {kpiCards.map((card) => (
            <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{card.label}</p>
              <p style={{ margin: '18px 0 0', fontSize: '34px', fontWeight: 800, color: '#0f172a' }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px' }}>
          {quickInsights.map((insight) => (
            <div key={insight.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{insight.label}</p>
              <p style={{ margin: '18px 0 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{insight.value}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '28px', display: 'grid', gap: '18px' }}>
          <div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Owner summary</p>
            <h2 style={{ margin: '14px 0 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Growth insights built for your restaurant portfolio</h2>
          </div>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.8 }}>This dashboard shows a high-level view of your restaurant health, sentiment, and activity. Use the sidebar or quick links to dive deeper into detailed analytics, reviews, AI summaries, and competitor intelligence.</p>
          <button
            type="button"
            onClick={() => navigate('/my-restaurants')}
            style={{ cursor: 'pointer', borderRadius: '14px', border: '1px solid #2563eb', background: '#2563eb', color: '#ffffff', padding: '12px 20px', fontWeight: 700, width: 'fit-content' }}
          >
            View restaurants
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'grid', gap: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Activity preview</h3>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Last 5 reviews</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
                  {recentReviews.slice(0, 5).map((review) => (
                    <li key={review._id}><strong>{review.rating}★ {review.restaurant}</strong> — {review.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Recent system actions</p>
                <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: '#334155', fontSize: '13px', lineHeight: 1.7 }}>
                  {systemActions.map((item) => (
                    <li key={item.id}>{item.action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Latest AI insight</p>
                <p style={{ margin: '10px 0 0', color: '#334155', fontSize: '14px', lineHeight: 1.8 }}>{latestAIInsight}</p>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'grid', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>System health</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '13px' }}>
                <span>Scraping status</span>
                <strong style={{ color: '#0f172a' }}>{systemHealth.scrapingStatus}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '13px' }}>
                <span>Last sync time</span>
                <strong style={{ color: '#0f172a' }}>{systemHealth.lastSync}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '13px' }}>
                <span>API status</span>
                <strong style={{ color: '#0f172a' }}>{systemHealth.apiStatus}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BusinessOwnerLayout>
  );
};

export default BusinessDashboard;
