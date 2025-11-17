import { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Order } from '@/types';
import styles from './Admin.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

type SalesRange = 'hora' | 'dia' | 'semana' | 'mes';
type SalesMetric = 'ventas' | 'ordenes' | 'ticket';

type SalesPoint = {
  label: string;
  ventas: number;
  ordenes: number;
  ticket: number;
};

type Props = {
  orders: Order[];
};

type RangeConfig = {
  buckets: number;
  bucketMs: number;
  labelFormatter: (input: Date, index: number) => string;
};

type ChartPalette = {
  ventas: { border: string; fill: string; label: string };
  ordenes: { border: string; fill: string; label: string };
  ticket: { border: string; fill: string; label: string };
};

const RANGE_CONFIG: Record<SalesRange, RangeConfig> = {
  hora: {
    buckets: 12,
    bucketMs: 5 * 60 * 1000,
    labelFormatter: (date) =>
      date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  },
  dia: {
    buckets: 24,
    bucketMs: 60 * 60 * 1000,
    labelFormatter: (date) =>
      date.toLocaleTimeString('es-CL', { hour: '2-digit' }),
  },
  semana: {
    buckets: 7,
    bucketMs: 24 * 60 * 60 * 1000,
    labelFormatter: (date) =>
      ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
  },
  mes: {
    buckets: 30,
    bucketMs: 24 * 60 * 60 * 1000,
    labelFormatter: (date) =>
      date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
  },
};

const PALETTE: ChartPalette = {
  ventas: {
    border: '#7c3aed',
    fill: 'rgba(124, 58, 237, 0.18)',
    label: 'Ventas ($)',
  },
  ordenes: {
    border: '#22c55e',
    fill: 'rgba(34, 197, 94, 0.18)',
    label: 'Órdenes',
  },
  ticket: {
    border: '#f97316',
    fill: 'rgba(249, 115, 22, 0.18)',
    label: 'Ticket promedio ($)',
  },
};

const METRIC_HELPER: Record<SalesMetric, string> = {
  ventas: 'Monto total transado en el período',
  ordenes: 'Órdenes confirmadas registradas',
  ticket: 'Promedio por orden confirmada',
};

const RANGE_LABEL: Record<SalesRange, string> = {
  hora: 'Última hora',
  dia: 'Últimas 24 horas',
  semana: 'Últimos 7 días',
  mes: 'Últimos 30 días',
};

function generateFallbackSeries(): Record<SalesRange, SalesPoint[]> {
  return {
    hora: Array.from({ length: 12 }, (_, index) => {
      const ordenes = Math.floor(Math.random() * 5 + 1);
      const ventas = ordenes * Math.floor(Math.random() * 8000 + 2000);
      return {
        label: `${(index + 1) * 5}m`,
        ventas,
        ordenes,
        ticket: ordenes ? Math.round(ventas / ordenes) : 0,
      };
    }),
    dia: Array.from({ length: 24 }, (_, index) => {
      const ordenes = Math.floor(Math.random() * 15 + 2);
      const ventas = ordenes * Math.floor(Math.random() * 12000 + 4000);
      return {
        label: `${index.toString().padStart(2, '0')}:00`,
        ventas,
        ordenes,
        ticket: ordenes ? Math.round(ventas / ordenes) : 0,
      };
    }),
    semana: Array.from({ length: 7 }, (_, index) => {
      const ordenes = Math.floor(Math.random() * 80 + 10);
      const ventas = ordenes * Math.floor(Math.random() * 15000 + 5000);
      return {
        label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][index],
        ventas,
        ordenes,
        ticket: ordenes ? Math.round(ventas / ordenes) : 0,
      };
    }),
    mes: Array.from({ length: 30 }, (_, index) => {
      const ordenes = Math.floor(Math.random() * 120 + 25);
      const ventas = ordenes * Math.floor(Math.random() * 20000 + 7000);
      return {
        label: `${index + 1}`,
        ventas,
        ordenes,
        ticket: ordenes ? Math.round(ventas / ordenes) : 0,
      };
    }),
  };
}

function buildSeriesFromOrders(
  orders: Order[]
): Record<SalesRange, SalesPoint[]> {
  const now = Date.now();

  const seriesEntries = (
    Object.entries(RANGE_CONFIG) as [SalesRange, RangeConfig][]
  ).map(([range, config]) => {
    const startTime = now - config.buckets * config.bucketMs;
    const buckets = Array.from({ length: config.buckets }, (_, index) => {
      const bucketStart = startTime + index * config.bucketMs;
      const bucketEnd = bucketStart + config.bucketMs;
      return {
        start: bucketStart,
        end: bucketEnd,
        label: config.labelFormatter(
          new Date(bucketStart + config.bucketMs / 2),
          index
        ),
        ventas: 0,
        ordenes: 0,
      };
    });

    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt).getTime();
      if (Number.isNaN(createdAt)) {
        return;
      }
      if (createdAt < startTime || createdAt > now) {
        return;
      }
      const rawIndex = Math.floor((createdAt - startTime) / config.bucketMs);
      const bucketIndex = Math.min(buckets.length - 1, Math.max(0, rawIndex));
      const bucket = buckets[bucketIndex];
      bucket.ventas += order.total;
      bucket.ordenes += 1;
    });

    const points = buckets.map((bucket) => ({
      label: bucket.label,
      ventas: bucket.ventas,
      ordenes: bucket.ordenes,
      ticket: bucket.ordenes ? Math.round(bucket.ventas / bucket.ordenes) : 0,
    }));

    const hasActivity = points.some(
      (point) => point.ventas > 0 || point.ordenes > 0
    );
    return [range, hasActivity ? points : []] as const;
  });

  return Object.fromEntries(seriesEntries) as Record<SalesRange, SalesPoint[]>;
}

const SalesChartSection: React.FC<Props> = ({ orders }) => {
  const fallbackSeries = useMemo(generateFallbackSeries, []);
  const computedSeries = useMemo(() => buildSeriesFromOrders(orders), [orders]);
  const [range, setRange] = useState<SalesRange>('dia');
  const [metric, setMetric] = useState<SalesMetric>('ventas');

  const chartSeries = useMemo(() => {
    const points = computedSeries[range];
    if (points.length === 0) {
      return fallbackSeries[range];
    }
    return points;
  }, [computedSeries, fallbackSeries, range]);

  const summary = useMemo(() => {
    const total = chartSeries.reduce((acc, item) => acc + item[metric], 0);
    const promedio = chartSeries.length > 0 ? total / chartSeries.length : 0;
    return {
      total,
      promedio,
    };
  }, [chartSeries, metric]);

  const palette = PALETTE[metric];

  const chartData = useMemo(
    () => ({
      labels: chartSeries.map((item) => item.label),
      datasets: [
        {
          label: palette.label,
          data: chartSeries.map((item) => item[metric]),
          borderColor: palette.border,
          backgroundColor: palette.fill,
          tension: 0.35,
          pointRadius: 3,
          fill: true,
        },
      ],
    }),
    [chartSeries, metric, palette]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          intersect: false,
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => items[0]?.label ?? '',
            label: (context: TooltipItem<'line'>) => {
              const value =
                typeof context.parsed === 'number'
                  ? context.parsed
                  : (context.parsed?.y ?? 0);
              if (metric === 'ventas' || metric === 'ticket') {
                return new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value);
              }
              return `${value} ordenes`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: string | number) => {
              const numeric = typeof value === 'string' ? Number(value) : value;
              if (metric === 'ventas' || metric === 'ticket') {
                return new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  maximumFractionDigits: 0,
                }).format(numeric);
              }
              return numeric;
            },
          },
          grid: { color: 'rgba(255, 255, 255, 0.08)' },
        },
        x: {
          grid: { display: false },
        },
      },
    }),
    [metric]
  );

  return (
    <section className={styles.sectionCard} aria-labelledby="sales-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="sales-heading" className={styles.sectionTitle}>
            Ventas y actividad
          </h2>
          <span className={styles.metricDelta}>{METRIC_HELPER[metric]}</span>
        </div>
        <div className={styles.chartToolbar}>
          <label className={styles.chartSelect}>
            <span>Rango</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as SalesRange)}
            >
              <option value="hora">Última hora</option>
              <option value="dia">Últimas 24 horas</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Últimos 30 días</option>
            </select>
          </label>
          <label className={styles.chartSelect}>
            <span>Métrica</span>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as SalesMetric)}
            >
              <option value="ventas">Ventas ($)</option>
              <option value="ordenes">Órdenes</option>
              <option value="ticket">Ticket promedio ($)</option>
            </select>
          </label>
        </div>
      </div>
      <div className={styles.chartSummary}>
        <div>
          <span className={styles.chartSummaryLabel}>Rango seleccionado</span>
          <strong className={styles.chartSummaryValue}>
            {RANGE_LABEL[range]}
          </strong>
        </div>
        <div>
          <span className={styles.chartSummaryLabel}>Total acumulado</span>
          <strong className={styles.chartSummaryValue}>
            {metric === 'ordenes'
              ? summary.total.toLocaleString('es-CL')
              : new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(summary.total)}
          </strong>
        </div>
        <div>
          <span className={styles.chartSummaryLabel}>Promedio</span>
          <strong className={styles.chartSummaryValue}>
            {metric === 'ordenes'
              ? summary.promedio.toFixed(1)
              : new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: 'CLP',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(summary.promedio)}
          </strong>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </section>
  );
};

export default SalesChartSection;
