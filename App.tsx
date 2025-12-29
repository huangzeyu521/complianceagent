
import React, { useState } from 'react';
import { History, Download, Calendar, Search, FileDown, ChevronRight, ShieldCheck as LucideShieldCheck } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ComplianceAnalysis from './components/ComplianceAnalysis';
import KnowledgeBase from './components/KnowledgeBase';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analysis':
        return <ComplianceAnalysis />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'history':
        return (
          <div className="space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <History className="mr-3 text-primary" size={28} />
                    合规历史档案
                </h2>
                <div className="flex space-x-2">
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-primary transition-all shadow-sm">
                        <Calendar size={16} className="mr-2" />
                        时间范围
                    </button>
                    <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:text-primary transition-all shadow-sm">
                        <Download size={16} className="mr-2" />
                        批量导出
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm text-center border border-gray-100">
              <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <History size={40} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">历史诊断记录</h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                系统已为您自动归档所有历史合规快照、诊断报告及改进建议，方便您进行跨周期的合规趋势对比。
              </p>
              
              <div className="mt-12 space-y-4 max-w-2xl mx-auto">
                {[1, 2, 3].map(i => (
                  <div key={i} className="group flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md">
                    <div className="flex items-center text-left">
                      <div className={`p-3 rounded-xl mr-5 transition-colors ${i === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-700 flex items-center">
                            季度资产合规核查 ({2024 - (i > 1 ? 1 : 0)} Q{4 - i + 1})
                            {i === 1 && <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-[8px] text-white rounded font-black uppercase">Latest</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center font-medium">
                            <Calendar size={10} className="mr-1" />
                            2024-0{5-i}-1{i} 14:30 · <span className="ml-1 text-gray-500">操作员：王经理</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right mr-4">
                          <div className="text-lg font-black text-primary">9{5-i}分</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Health Score</div>
                      </div>
                      <div className="flex space-x-1">
                        <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all" title="查看报告">
                            <Search size={18} />
                        </button>
                        <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-all" title="下载 PDF">
                            <FileDown size={18} />
                        </button>
                        <ChevronRight size={18} className="text-gray-200 group-hover:text-primary ml-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-10 text-sm font-bold text-primary hover:underline flex items-center mx-auto">
                  查看全部历史档案 (24)
                  <ChevronRight size={14} className="ml-1" />
              </button>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const ShieldCheck = ({ size, className }: { size: number, className?: string }) => {
    return <LucideShieldCheck size={size} className={className} />;
};

export default App;
