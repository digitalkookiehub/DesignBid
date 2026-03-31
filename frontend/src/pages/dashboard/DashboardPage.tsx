import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Activity,
  Users,
  FileSpreadsheet,
  IndianRupee,
  TrendingUp,
  Plus,
  CreditCard,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { getDashboardStats } from '@/services/dashboardService';
import type { DashboardStats } from '@/types/dashboard';

const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

interface StatCardConfig {
  key: keyof DashboardStats;
  label: string;
  icon: LucideIcon;
  gradient: string;
  shadow: string;
  format: (val: number) => string;
}

const statCards: StatCardConfig[] = [
  {
    key: 'total_projects',
    label: 'Total Projects',
    icon: FolderKanban,
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/30',
    format: (v) => String(v),
  },
  {
    key: 'active_projects',
    label: 'Active Projects',
    icon: Activity,
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    format: (v) => String(v),
  },
  {
    key: 'total_clients',
    label: 'Total Clients',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/30',
    format: (v) => String(v),
  },
  {
    key: 'quotations_sent',
    label: 'Quotations Sent',
    icon: FileSpreadsheet,
    gradient: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-500/30',
    format: (v) => String(v),
  },
  {
    key: 'total_revenue',
    label: 'Total Revenue',
    icon: IndianRupee,
    gradient: 'from-pink-500 to-rose-500',
    shadow: 'shadow-pink-500/30',
    format: (v) => formatINR(v),
  },
  {
    key: 'approval_rate',
    label: 'Approval Rate',
    icon: TrendingUp,
    gradient: 'from-indigo-500 to-violet-500',
    shadow: 'shadow-indigo-500/30',
    format: (v) => `${v.toFixed(1)}%`,
  },
];

interface QuickActionConfig {
  label: string;
  icon: LucideIcon;
  route: string;
  borderColor: string;
  iconColor: string;
  bgHover: string;
}

const quickActions: QuickActionConfig[] = [
  {
    label: 'New Project',
    icon: Plus,
    route: '/projects/new',
    borderColor: 'border-violet-200 hover:border-violet-400',
    iconColor: 'text-violet-600 bg-violet-50',
    bgHover: 'hover:bg-violet-50/50',
  },
  {
    label: 'Rate Card',
    icon: CreditCard,
    route: '/rate-card',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    iconColor: 'text-emerald-600 bg-emerald-50',
    bgHover: 'hover:bg-emerald-50/50',
  },
  {
    label: 'View Quotations',
    icon: FileText,
    route: '/quotations',
    borderColor: 'border-orange-200 hover:border-orange-400',
    iconColor: 'text-orange-600 bg-orange-50',
    bgHover: 'hover:bg-orange-50/50',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });

  const firstName = user?.full_name?.split(' ')[0] ?? 'Designer';

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome back, {firstName}
            </span>
          </h1>
          <p className="text-gray-500 text-base mt-2">
            Here is an overview of your design business
          </p>
        </motion.div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {statCards.map((card) => {
              const Icon = card.icon;
              const value = stats?.[card.key] ?? 0;
              return (
                <motion.div
                  key={card.key}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div
                    className={`
                      relative overflow-hidden rounded-2xl p-6
                      bg-gradient-to-br ${card.gradient}
                      shadow-lg ${card.shadow}
                      cursor-default
                    `}
                  >
                    {/* Decorative circle */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-white/5" />

                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium mb-1">
                          {card.label}
                        </p>
                        <p className="text-3xl font-extrabold text-white tracking-tight">
                          {card.format(value)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <GlassCard
                  key={action.label}
                  className={`
                    cursor-pointer border-2 transition-all duration-300
                    ${action.borderColor} ${action.bgHover}
                  `}
                  hoverEffect
                >
                  <button
                    type="button"
                    onClick={() => navigate(action.route)}
                    className="flex items-center gap-4 w-full text-left"
                  >
                    <div className={`p-3 rounded-xl ${action.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-700">
                      {action.label}
                    </span>
                  </button>
                </GlassCard>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom Motivational Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <GlassCard gradient className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-100 to-transparent rounded-bl-full opacity-60" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/40">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  Keep up the great work!
                </h3>
                <p className="text-gray-500 text-sm mt-1 max-w-lg">
                  You have managed{' '}
                  <span className="font-semibold text-violet-600">
                    {stats?.total_projects ?? 0} projects
                  </span>{' '}
                  and served{' '}
                  <span className="font-semibold text-emerald-600">
                    {stats?.total_clients ?? 0} clients
                  </span>{' '}
                  so far. Your approval rate stands at{' '}
                  <span className="font-semibold text-indigo-600">
                    {(stats?.approval_rate ?? 0).toFixed(1)}%
                  </span>
                  . Keep building amazing designs!
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
