
import React from 'react';
import { LayoutDashboard, ShieldCheck, BookOpen, History, Cpu, MapPin } from 'lucide-react';
import { COLORS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: '管理驾驶舱', icon: LayoutDashboard },
    { id: 'analysis', label: '合规诊断', icon: ShieldCheck },
    { id: 'knowledge', label: '规则库', icon: BookOpen },
    { id: 'history', label: '历史记录', icon: History }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-secondary-blue text-white p-4 shadow-lg flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
            <Cpu size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">国企经营管理合规智能体</h1>
            <div className="flex items-center text-[10px] text-blue-200 mt-0.5 space-x-2">
              <span className="font-bold bg-blue-900/50 px-1.5 py-0.5 rounded">四川东同建设集团子公司</span>
              <span>|</span>
              <span className="flex items-center"><MapPin size={10} className="mr-1" /> 内江市东兴区 · 四川栎东数字能源科技</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right mr-4 hidden sm:block">
            <p className="text-xs font-bold">王经理</p>
            <p className="text-[9px] text-blue-300">合规部负责人</p>
          </div>
          <span className="w-10 h-10 bg-blue-800 rounded-full border border-blue-600 flex items-center justify-center font-bold text-sm">王</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 hidden md:block">
          <nav className="mt-6 px-3">
            {tabs.map(Tab => (
              <button
                key={Tab.id}
                onClick={() => onTabChange(Tab.id)}
                className={`w-full flex items-center px-4 py-3.5 mb-1 rounded-xl text-sm font-bold transition-all ${
                  activeTab === Tab.id
                    ? 'text-primary bg-amber-50 shadow-sm border border-amber-100'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <Tab.icon size={18} className="mr-3" />
                {Tab.label}
              </button>
            ))}
          </nav>
          <div className="absolute bottom-8 left-0 w-64 px-6">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">执行标准</p>
                <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                  当前优先遵循：<br/>
                  《四川省省属企业合规管理办法》
                </p>
            </div>
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Footer Nav */}
      <nav className="md:hidden bg-white border-t border-gray-200 flex justify-around p-2 sticky bottom-0 z-50">
        {tabs.map(Tab => (
          <button
            key={Tab.id}
            onClick={() => onTabChange(Tab.id)}
            className={`flex flex-col items-center p-2 transition-colors ${
              activeTab === Tab.id ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <Tab.icon size={20} />
            <span className="text-[10px] mt-1 font-bold">{Tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
