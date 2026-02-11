'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell,
    AreaChart, Area,
    LineChart, Line
} from 'recharts';

// --- 1. Conversion vs Quality (Bar Chart) ---
export function ConversionByScoreChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-zinc-500">Sin datos suficientes</div>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="range" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} unit="%" />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                        cursor={{ fill: '#27272a' }}
                    />
                    <Legend />
                    <Bar name="Tasa de Conversión (Ganados)" dataKey="rate" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- 2. Status Distribution (Donut Chart) ---
export function StatusDistributionChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-zinc-500">Sin datos de estado</div>;

    return (
        <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- 3. Sources (Simple Bar List or Chart) ---
// Let's use a Horizontal Bar Chart for variety
export function SourceChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-zinc-500">Sin datos de fuentes</div>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#71717a" fontSize={12} hide />
                    <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={100} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                    />
                    <Bar name="Leads" dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- 4. Growth (Area Chart) ---
export function GrowthChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-zinc-500">Sin historial reciente</div>;

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                    <Area type="monotone" dataKey="count" stroke="#eab308" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
