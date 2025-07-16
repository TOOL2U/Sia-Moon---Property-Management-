'use client'

import React from 'react'

interface ChartData {
  date: string
  value: number
  label?: string
}

interface SimpleChartProps {
  data: ChartData[]
  type: 'line' | 'bar'
  height?: number
  color?: string
  className?: string
}

export default function SimpleChart({ 
  data, 
  type, 
  height = 200, 
  color = '#6366f1',
  className = '' 
}: SimpleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-gray-400 ${className}`}
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const chartWidth = 100 // percentage
  const chartHeight = height - 40 // Leave space for labels

  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth
      const y = chartHeight - ((item.value - minValue) / range) * chartHeight
      return `${x},${y}`
    }).join(' ')

    return (
      <div className={`relative ${className}`} style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(75, 85, 99, 0.2)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height={chartHeight} fill="url(#grid)" />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth
            const y = chartHeight - ((item.value - minValue) / range) * chartHeight
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                className="drop-shadow-sm hover:r-4 transition-all cursor-pointer"
              >
                <title>{`${item.label || item.date}: ${item.value}`}</title>
              </circle>
            )
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => {
            if (index % Math.ceil(data.length / 5) === 0) { // Show every 5th label
              const x = (index / (data.length - 1)) * chartWidth
              return (
                <text
                  key={index}
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  className="fill-gray-400 text-xs"
                >
                  {item.label || item.date}
                </text>
              )
            }
            return null
          })}
        </svg>
      </div>
    )
  }

  if (type === 'bar') {
    const barWidth = chartWidth / data.length * 0.8
    const barSpacing = chartWidth / data.length * 0.2

    return (
      <div className={`relative ${className}`} style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid-bar" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(75, 85, 99, 0.2)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height={chartHeight} fill="url(#grid-bar)" />
          
          {/* Bars */}
          {data.map((item, index) => {
            const x = (index / data.length) * chartWidth + barSpacing / 2
            const barHeight = ((item.value - minValue) / range) * chartHeight
            const y = chartHeight - barHeight
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-sm"
                  rx="2"
                >
                  <title>{`${item.label || item.date}: ${item.value}`}</title>
                </rect>
                
                {/* Value label on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-gray-300 text-xs font-medium"
                >
                  {item.value}
                </text>
              </g>
            )
          })}
          
          {/* X-axis labels */}
          {data.map((item, index) => {
            const x = (index / data.length) * chartWidth + barWidth / 2 + barSpacing / 2
            return (
              <text
                key={index}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-gray-400 text-xs"
                transform={data.length > 6 ? `rotate(-45, ${x}, ${height - 5})` : ''}
              >
                {(item.label || item.date).length > 10 
                  ? (item.label || item.date).substring(0, 10) + '...'
                  : (item.label || item.date)
                }
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  return null
}

// Simple pie chart component
interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  size?: number
  className?: string
}

export function SimplePieChart({ data, size = 200, className = '' }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        No data
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = size / 2 - 20
  const centerX = size / 2
  const centerY = size / 2

  let currentAngle = -90 // Start from top

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#3b82f6', '#ef4444', '#6b7280'
  ]

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {data.map((item, index) => {
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          
          const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
          const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
          const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
          const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ')
          
          currentAngle += angle
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || colors[index % colors.length]}
              className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-sm"
            >
              <title>{`${item.label}: ${item.value} (${Math.round((item.value / total) * 100)}%)`}</title>
            </path>
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-full left-0 right-0 mt-2 space-y-1">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: item.color || colors[index % colors.length] }}
            />
            <span className="text-gray-300 truncate">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
