import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatAxis } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const COLORS = ['#6366F1', '#059669', '#D97706', '#7C3AED', '#0284C7', '#E11D48', '#94A3B8'];

function colorAt(i) {
  return COLORS[i % COLORS.length];
}

function buildDataset(ds, i, type) {
  const color = colorAt(i);
  const base = {
    label: ds.label,
    data: ds.data,
    borderColor: color,
    backgroundColor: type === 'line' ? `${color}20` : color,
    tension: type === 'line' ? 0.4 : 0,
    fill: type === 'line' && i === 0,
    borderWidth: type === 'line' ? 2.5 : 2,
    pointRadius: type === 'line' ? 3 : 0,
  };
  if (ds.borderDash) base.borderDash = ds.borderDash;
  return base;
}

function getChartTheme(theme) {
  const dark = theme === 'dark';
  return {
    legend: dark ? '#D7DEE9' : '#5B6B8A',
    ticks: dark ? '#E2E8F0' : '#64748B',
    grid: dark ? 'rgba(203, 213, 225, 0.18)' : '#E2E8F4',
    tooltipBg: dark ? 'rgba(232, 237, 245, 0.96)' : 'rgba(10, 15, 30, 0.93)',
    tooltipText: dark ? '#0F1420' : '#FFFFFF',
  };
}

function buildOptions(theme) {
  const colors = getChartTheme(theme);
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Plus Jakarta Sans', size: 11 },
          usePointStyle: true,
          padding: 14,
          color: colors.legend,
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        padding: 12,
        cornerRadius: 9,
        callbacks: {
          label: (c) => ` ${c.dataset.label}: Rs. ${Number(c.raw).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.ticks, maxTicksLimit: 12 },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid },
        ticks: { color: colors.ticks, callback: formatAxis },
        border: { display: false },
      },
    },
  };
}

function buildDoughnutOptions(theme) {
  const colors = getChartTheme(theme);
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11 }, usePointStyle: true, color: colors.legend },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.tooltipText,
        bodyColor: colors.tooltipText,
        callbacks: {
          label: (c) => {
            const total = c.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((c.raw / total) * 100).toFixed(1) : 0;
            return ` ${c.label}: Rs. ${Number(c.raw).toLocaleString('en-IN')} (${pct}%)`;
          },
        },
      },
    },
  };
}

export default function ChartPanel({ chart }) {
  const { theme } = useTheme();

  if (!chart?.data) return null;

  const type = chart.type || 'line';
  const height = chart.height || 260;
  const datasets = chart.data.datasets.map((ds, i) => buildDataset(ds, i, type === 'bar' ? 'bar' : 'line'));

  const data = { labels: chart.data.labels, datasets };
  const defaultOptions = buildOptions(theme);
  const doughnutOptions = buildDoughnutOptions(theme);

  return (
    <div className="calc-chart-card">
      <div className="calc-chart-title">{chart.title}</div>
      <div className="calc-chart-wrap" style={{ height }}>
        {type === 'doughnut' ? (
          <Doughnut
            data={{
              labels: chart.data.labels,
              datasets: [{
                data: chart.data.datasets[0].data,
                backgroundColor: COLORS.slice(0, chart.data.labels.length),
                borderWidth: 0,
              }],
            }}
            options={doughnutOptions}
          />
        ) : type === 'bar' ? (
          <Bar data={data} options={{ ...defaultOptions, scales: defaultOptions.scales }} />
        ) : (
          <Line data={data} options={defaultOptions} />
        )}
      </div>
    </div>
  );
}
