import React from 'react';
import {
  Users,
  Send,
  Activity,
  MessageSquareReply,
  TrendingUp,
  AlertCircle,
  Info,
  Loader2,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useDashboardData } from './hooks/useDashboardData';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import StatCard from './components/StatCard';
import { FunnelChart } from './components/PerformanceCharts';
import LeadsTable from './components/LeadsTable';
import LoginPage from './components/LoginPage';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const auth = useAuth();
  const {
    metrics,
    funnel,
    prospects,
    totalProspects,
    page,
    totalPages,
    setPage,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    lastSync,
    error,
    demoMode,
    refresh,
  } = useDashboardData();

  // Show loading screen while checking initial session
  if (isSupabaseConfigured && auth.loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-dark-200">
          <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
          <p className="text-sm font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // If Supabase IS configured, enforce Authentication
  if (isSupabaseConfigured && !auth.isAuthenticated) {
    return (
      <LoginPage
        onLogin={auth.signIn}
        loading={auth.loading}
        error={auth.error}
        onClearError={auth.clearError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* ── Ambient glow background ──────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent-indigo/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-violet/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto">
        {/* ── Header ───────────────────────────────────────────── */}
        <Header
          lastSync={lastSync}
          loading={loading}
          onRefresh={refresh}
          onLogout={auth.signOut}
        />

        <main className="px-6 pb-12 space-y-8">
          {/* ── Error banner ─────────────────────────────────── */}
          {demoMode && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 animate-fade-in-up">
              <Info className="w-5 h-5 text-accent-amber flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent-amber">Modo Demo</p>
                <p className="text-xs text-dark-200 mt-0.5">Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env para conectar con datos reales.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent-rose">Error al cargar datos</p>
                <p className="text-xs text-dark-200 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* ── KPI Cards ────────────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Canales Descubiertos"
              value={metrics ? metrics.total_discovered : 0}
              icon={Search}
              color="indigo"
              subtitle="raw_channels"
              loading={loading}
              delay={0}
            />
            <StatCard
              title="Canales Calificados"
              value={metrics ? metrics.total_qualified : 0}
              icon={CheckCircle2}
              color="violet"
              subtitle="qualified_channels"
              loading={loading}
              delay={50}
            />
            <StatCard
              title="Listos para Enviar"
              value={metrics?.total_leads ?? 0}
              icon={Users}
              color="cyan"
              subtitle="Con email extraído"
              loading={loading}
              delay={100}
            />
            <StatCard
              title="Contactados"
              value={metrics?.total_contacted ?? 0}
              icon={Send}
              color="emerald"
              loading={loading}
              delay={150}
            />
            <StatCard
              title="Secuencias Activas"
              value={metrics?.active_in_sequence ?? 0}
              icon={Activity}
              color="amber"
              loading={loading}
              delay={200}
            />
            <StatCard
              title="Respuestas"
              value={metrics?.total_replied ?? 0}
              icon={MessageSquareReply}
              color="indigo"
              loading={loading}
              delay={250}
            />
            <StatCard
              title="Reply Rate"
              value={metrics?.reply_rate_percentage?.toFixed(1) ?? '0.0'}
              icon={TrendingUp}
              color="violet"
              suffix="%"
              loading={loading}
              delay={300}
            />
          </section>

          {/* ── Charts ───────────────────────────────────────── */}
          <section className="grid grid-cols-1 gap-4">
            <FunnelChart data={funnel} loading={loading} />
          </section>

          {/* ── Leads Table ──────────────────────────────────── */}
          <section>
            <LeadsTable
              prospects={prospects}
              totalProspects={totalProspects}
              page={page}
              totalPages={totalPages}
              search={search}
              statusFilter={statusFilter}
              loading={loading}
              onPageChange={setPage}
              onSearchChange={setSearch}
              onFilterChange={setStatusFilter}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
