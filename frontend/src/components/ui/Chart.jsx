import React, { useRef, useEffect } from 'react';

export const Chart = ({ 
  data = [], 
  type = 'line', 
  height = 200, 
  color = 'cyan',
  xKey = 'time',
  yKey = 'count',
  showGrid = true,
  showArea = true,
  className = '' 
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => d[yKey]);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    const colorMap = {
      cyan: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)', grid: 'rgba(6, 182, 212, 0.1)' },
      rose: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.1)', grid: 'rgba(244, 63, 94, 0.1)' },
      emerald: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', grid: 'rgba(16, 185, 129, 0.1)' },
      amber: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)', grid: 'rgba(245, 158, 11, 0.1)' },
      blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', grid: 'rgba(59, 130, 246, 0.1)' },
      violet: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)', grid: 'rgba(139, 92, 246, 0.1)' }
    };

    const colors = colorMap[color] || colorMap.cyan;

    ctx.clearRect(0, 0, width, height);

    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      for (let i = 0; i <= 6; i++) {
        const x = padding.left + (chartWidth / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    const getX = (index) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;

    if (showArea) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, colors.fill.replace('0.1', '0.3'));
      gradient.addColorStop(1, colors.fill.replace('0.1', '0'));
      
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + chartHeight);
      
      data.forEach((point, index) => {
        ctx.lineTo(getX(index), getY(point[yKey]));
      });
      
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point[yKey]);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point[yKey]);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colors.stroke;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#070b14';
      ctx.fill();
    });

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#8b98b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
        ctx.fillText(point[xKey], getX(index), padding.top + chartHeight + 8);
      }
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const value = maxValue - (maxValue - minValue) * (i / 4);
      const y = padding.top + (chartHeight / 4) * i;
      ctx.fillText(formatNumber(value), padding.left - 10, y);
    }

  }, [data, type, height, color, xKey, yKey, showGrid, showArea]);

  function formatNumber(num) {
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.round(num).toString();
  }

  return (
    <canvas 
      ref={canvasRef} 
      className={`chart-canvas ${className}`}
      width={800}
      height={height}
      role="img"
      aria-label={`${type} chart showing ${data.length} data points`}
    />
  );
};

export default Chart;