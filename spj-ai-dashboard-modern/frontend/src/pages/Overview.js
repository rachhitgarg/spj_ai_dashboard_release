import React from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  BookOpen,
  UserCheck,
  Zap,
  Award
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { useFilters } from '../contexts/FilterContext';
import MetricCard from '../components/MetricCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OverviewChart from '../components/OverviewChart';

const Overview = () => {
  const { getFilterParams } = useFilters();
  const filterParams = getFilterParams();

  const { data, isLoading, error } = useQuery(
    ['overview', filterParams],
    () => analyticsAPI.getOverview(new URLSearchParams(filterParams)),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Error loading overview data</p>
      </div>
    );
  }

  const { coreMetrics, aiToolPerformance, phaseComparison } = data?.data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Overview</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive view of AI initiatives impact on student outcomes
        </p>
      </div>

      {/* Core Placement Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Placement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Job Conversion Rate"
            value={coreMetrics?.jobConversionRate || 0}
            format="percentage"
            icon={TrendingUp}
            changeType="positive"
          />
          <MetricCard
            title="Average Package"
            value={coreMetrics?.avgPackage || 0}
            format="currency"
            icon={DollarSign}
            changeType="positive"
          />
          <MetricCard
            title="Tier-1 Share"
            value={coreMetrics?.tier1Share || 0}
            format="percentage"
            icon={Award}
            changeType="positive"
          />
          <MetricCard
            title="Conversion per Visit"
            value={coreMetrics?.conversionPerVisit || 0}
            format="percentage"
            icon={Target}
            changeType="positive"
          />
        </div>
      </div>

      {/* AI Tool Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Tool Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="AI Tutor Exam Improvement"
            value={aiToolPerformance?.tutorExamImprovement || 0}
            format="decimal"
            icon={BookOpen}
            changeType="positive"
          />
          <MetricCard
            title="AI Mentor Capstone Improvement"
            value={aiToolPerformance?.mentorCapstoneImprovement || 0}
            format="decimal"
            icon={UserCheck}
            changeType="positive"
          />
          <MetricCard
            title="JPT Technical Score"
            value={aiToolPerformance?.jptTechnicalScore || 0}
            format="decimal"
            icon={Zap}
            changeType="positive"
          />
          <MetricCard
            title="JPT Conversion Boost"
            value={aiToolPerformance?.jptConversionBoost || 0}
            format="percentage"
            icon={TrendingUp}
            changeType="positive"
          />
        </div>
      </div>

      {/* Phase Comparison Charts */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Phase-wise Performance Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OverviewChart
            title="Average Package by Phase"
            data={phaseComparison}
            dataKey="avgPackage"
            format="currency"
            color="#3b82f6"
          />
          <OverviewChart
            title="Tier-1 Share by Phase"
            data={phaseComparison}
            dataKey="tier1Share"
            format="percentage"
            color="#10b981"
          />
        </div>
      </div>

      {/* Traditional vs AI Comparison */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Traditional vs AI Implementation</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {phaseComparison?.map((phase, index) => {
              const isPreAI = phase.phase === 'Pre-AI';
              const isAI = phase.phase === 'JPT' || phase.phase === 'Yoodli';
              
              return (
                <div key={phase.phase} className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{phase.phase}</h3>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary-600">
                      {phase.avgPackage?.toFixed(1)} LPA
                    </div>
                    <div className="text-sm text-gray-500">Average Package</div>
                    <div className="text-lg font-semibold text-success-600">
                      {phase.tier1Share?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Tier-1 Share</div>
                    <div className="text-lg font-semibold text-warning-600">
                      {phase.jobConversionRate?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Job Conversion</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Insights</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Cohorts with higher <strong>PostTutor_Exam_Avg</strong> typically show higher <strong>Placement conversion</strong>.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Cohorts with higher <strong>PostMentor_Capstone_Grade_Avg</strong> typically show higher <strong>Tier-1 offers share</strong> and <strong>Avg Package</strong>.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <p className="text-gray-700">
                Cohorts in <strong>JPT phase</strong> show improved <strong>conversion per opening</strong> compared to earlier phases, even when openings per visit shrink.
              </p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <p className="text-gray-700">
                <strong>AI implementation</strong> shows measurable improvements in job conversion, package quality, and Tier-1 company placements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
