
import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { AlertTriangle, Clock, TrendingUp, Target, Database, Info, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { COLORS } from '../constants';

const Dashboard: React.FC = () => {
  const riskData = [
    { name: '高风险', value: 2, color: COLORS.RED },
    { name: '中风险', value: 5, color: COLORS.PRIMARY },
    { name: '低风险', value: 8, color: COLORS.BLUE }
  ];

  const radarData = [
    { subject: '省属规章对标', A: 85, fullMark: 100 },
    { subject: '安全生产', A: 70, fullMark: 100 },
    { subject: '投资决策', A: 85, fullMark: 100 },
    { subject: '数据隐私', A: 60, fullMark: 100 },
    { subject: '关联方管理', A: 95, fullMark: 100 },
  ];

  const recentActions = [
    { id: 1, title: '东兴区平安路办公点资产归集核查', dept: '财务部', status: '待整改', level: 'HIGH' },
    { id: 2, title: '内江圣美路储能设施等保测评', dept: '技术部', status: '进行中', level: 'MEDIUM' },
    { id: 3, title: '东同集团内部关联交易准则对标', dept: '法务部', status: '已完成', level: 'LOW' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">管理驾驶舱</h2>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <MapPin size={14} className="mr-1 text-primary" />
            内江市东兴区 · 栎东数字能源智能看板
          </div>
        </div>
        <div className="flex space-x-2">
            <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-black hover:bg-gray-50 transition-all flex items-center shadow-sm">
                <Clock size={16} className="mr-2 text-primary" />
                导出实时分析报告
            </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '整体健康度', val: '92.4', unit: '分', trend: '+1.2%', icon: Target, color: COLORS.PRIMARY },
          { label: '违规风险点', val: '15', unit: '个', trend: '-2', icon: AlertTriangle, color: COLORS.RED },
          { label: '省属标准对标率', val: '88', unit: '%', trend: '+5%', icon: ShieldCheck, color: COLORS.GREEN },
          { label: '内规建设度', val: '64', unit: '%', trend: '+10%', icon: Database, color: COLORS.BLUE },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-gray-50/80 text-gray-400">
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${item.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {item.trend}
              </span>
            </div>
            <div className="text-3xl font-black text-gray-800">
              {item.val}<span className="text-sm font-bold text-gray-400 ml-1">{item.unit}</span>
            </div>
            <div className="text-xs font-black text-gray-400 mt-2 uppercase tracking-widest">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Radar */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="font-black text-gray-800 mb-8 flex items-center text-lg">
            <ShieldCheck size={20} className="mr-2 text-primary" />
            省属对标画像
          </h3>
          <div className="h-72 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Radar name="合规表现" dataKey="A" stroke={COLORS.PRIMARY} fill={COLORS.PRIMARY} fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 text-lg">东兴区重点任务整改进度</h3>
            <button className="text-xs text-primary font-black hover:underline flex items-center">
              查看全部档案 <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActions.map(action => (
              <div key={action.id} className="flex items-center justify-between p-5 border border-gray-50 rounded-2xl hover:bg-gray-50 hover:border-amber-100 transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mr-5 ${action.level === 'HIGH' ? 'bg-red-500' : action.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div>
                    <div className="text-base font-black text-gray-800 group-hover:text-primary transition-colors">{action.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">{action.dept} · 风险评估: {action.level}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase ${action.status === '已完成' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {action.status}
                  </span>
                  <ChevronRight size={18} className="text-gray-200 ml-5 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-secondary-blue rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="bg-blue-400/20 px-3 py-1 rounded-lg text-[10px] font-black inline-block mb-4 border border-blue-400/30 uppercase tracking-widest">Local Insight · Neijiang</div>
          <h3 className="text-2xl font-black mb-3">栎东公司·东兴区专属合规洞察</h3>
          <p className="text-blue-100 text-base leading-relaxed mb-8 opacity-90 font-medium">
            监测到内江市暂未发布独立合规办法。建议公司在参照省属办法的基础上，由母公司 <span className="text-primary font-black">四川东同建设集团</span> 牵头，针对位于圣美路11号的储能资产制定差异化的“资产负债透明度”实施细则。
          </p>
          <div className="flex space-x-4">
            <button className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black shadow-xl hover:shadow-2xl transition-all active:scale-95">
              编制内规建议书
            </button>
            <button className="bg-blue-900/50 border border-blue-700 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-blue-800 transition-all">
              配置自动预警系统
            </button>
          </div>
        </div>
        <Database className="absolute -right-12 -bottom-12 text-blue-800 opacity-30" size={300} />
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => {
    const { ChevronRight: LucideIcon } = (window as any).LucideReact || { ChevronRight: () => null };
    return <LucideIcon size={size} className={className} />;
};

export default Dashboard;
