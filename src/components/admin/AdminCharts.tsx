import React from 'react';
import { Order } from '../../types';

interface AdminChartsProps {
  orders: Order[];
}

export const AdminCharts: React.FC<AdminChartsProps> = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-jost">
      
      {/* 1. Yearly Stats Line Chart Card matching reference image */}
      <div className="lg:col-span-7 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Yearly Stats</span>
            <h3 className="font-extrabold text-2xl text-white mt-1">₹2,45,479</h3>
          </div>
          <select className="bg-[#1A2035] text-xs text-gray-300 font-bold border border-[#262E4A] px-3 py-1.5 rounded-lg focus:outline-hidden">
            <option>Yearly</option>
            <option>Monthly</option>
          </select>
        </div>

        {/* SVG Smooth Bezier Curve Line Chart matching reference image */}
        <div className="w-full h-64 pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[40, 80, 120, 160].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="500"
                y2={y}
                stroke="#262E4A"
                strokeDasharray="4 4"
              />
            ))}

            {/* Gradient Fill under path */}
            <path
              d="M 0 180 Q 50 80 100 130 T 200 60 T 300 90 T 400 110 T 500 30 L 500 200 L 0 200 Z"
              fill="url(#lineGrad)"
            />

            {/* Smooth Bezier Line Path */}
            <path
              d="M 0 180 Q 50 80 100 130 T 200 60 T 300 90 T 400 110 T 500 30"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="4.5"
              strokeLinecap="round"
            />

            {/* Data Point Glow Circles */}
            <circle cx="200" cy="60" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
            <circle cx="500" cy="30" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
          </svg>

          {/* Month Labels */}
          <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Sales/Revenue Vertical Bar Chart Card matching reference image */}
      <div className="lg:col-span-5 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Sales / Revenue</span>
            <h3 className="font-extrabold text-xl text-white mt-1">Monthly Growth</h3>
          </div>
          <select className="bg-[#1A2035] text-xs text-gray-300 font-bold border border-[#262E4A] px-3 py-1.5 rounded-lg focus:outline-hidden">
            <option>Yearly</option>
            <option>Monthly</option>
          </select>
        </div>

        {/* SVG Vertical Bar Chart Columns matching reference image */}
        <div className="w-full h-64 pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180">
            {/* Gridlines */}
            {[40, 90, 140].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="400"
                y2={y}
                stroke="#262E4A"
                strokeDasharray="4 4"
              />
            ))}

            {/* Vertical Bar Columns */}
            {[
              { x: 20, h: 90 },
              { x: 50, h: 115 },
              { x: 80, h: 140 },
              { x: 110, h: 80 },
              { x: 140, h: 125 },
              { x: 170, h: 105 },
              { x: 200, h: 155 },
              { x: 230, h: 110 },
              { x: 260, h: 135 },
              { x: 290, h: 170 },
              { x: 320, h: 145 },
              { x: 350, h: 160 },
            ].map((bar, i) => (
              <rect
                key={i}
                x={bar.x}
                y={180 - bar.h}
                width="14"
                height={bar.h}
                rx="4"
                fill={i === 9 ? '#3B82F6' : '#2563EB'}
                opacity={i === 9 ? '1' : '0.85'}
              />
            ))}
          </svg>

          {/* Month Labels */}
          <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
