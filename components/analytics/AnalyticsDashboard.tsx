import { getAnalyticsData } from '@/lib/analytics';
import { ConversionByScoreChart, StatusDistributionChart, SourceChart, GrowthChart } from './Charts';
import { BarChart3, TrendingUp, PieChart, Target } from 'lucide-react';
import { getServerTranslation } from '@/lib/server-lang';

export async function AnalyticsDashboard({ organizationId }: { organizationId: string }) {
    const [data, { t }] = await Promise.all([
        getAnalyticsData(organizationId),
        getServerTranslation(),
    ]);

    return (
        <section className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-light text-zinc-900 dark:text-zinc-100">
                        {t.analytics.title} <span className="font-semibold text-brand">{t.analytics.titleHighlight}</span>
                    </h2>
                    <p className="text-sm text-zinc-500">{t.analytics.subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

                {/* 1. Quality vs Conversion */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg">
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{t.analytics.conversionTitle}</h3>
                            <p className="text-xs text-zinc-500">{t.analytics.conversionDesc}</p>
                        </div>
                    </div>
                    <ConversionByScoreChart data={data.conversionByScore} />
                </div>

                {/* 2. Growth */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{t.analytics.growthTitle}</h3>
                            <p className="text-xs text-zinc-500">{t.analytics.growthDesc}</p>
                        </div>
                    </div>
                    <GrowthChart data={data.growth} />
                </div>

                {/* 3. Status Dist */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-500 rounded-lg">
                            <PieChart size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{t.analytics.statusTitle}</h3>
                            <p className="text-xs text-zinc-500">{t.analytics.statusDesc}</p>
                        </div>
                    </div>
                    <StatusDistributionChart data={data.statusDistribution} />
                </div>

                {/* 4. Sources */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-lg">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{t.analytics.sourcesTitle}</h3>
                            <p className="text-xs text-zinc-500">{t.analytics.sourcesDesc}</p>
                        </div>
                    </div>
                    <SourceChart data={data.sourceDistribution} />
                </div>

            </div>
        </section>
    );
}
