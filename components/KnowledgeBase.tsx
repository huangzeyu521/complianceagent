
import React, { useState, useRef } from 'react';
import { 
  Search, BookOpen, ExternalLink, FileX, Tags, Info, 
  ListChecks, ArrowRight, AlertCircle, Sparkles, 
  CheckSquare, Square, ChevronDown, ChevronUp, History, 
  ShieldAlert, BookCheck, FileUp, Loader2, X, PlusCircle, CheckCircle2, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { MOCK_RULES, COLORS } from '../constants';
import { interpretComplianceDocument } from '../services/geminiService';
import { ComplianceRule } from '../types';

const KnowledgeBase: React.FC = () => {
  const [rules, setRules] = useState<ComplianceRule[]>(MOCK_RULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // 入库相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'idle' | 'reading' | 'interpreting' | 'confirm_duplicate' | 'success'>('idle');
  const [pendingRule, setPendingRule] = useState<ComplianceRule | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['全部', '风险控制', '财务管理', '投资决策', '安全生产', '科技创新'];

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        rule.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === '全部' || rule.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCheck = (ruleId: string, itemIdx: number) => {
    const key = `${ruleId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStep('reading');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const content = new TextDecoder().decode(new Uint8Array(arrayBuffer).slice(0, 15000));
      
      setImportStep('interpreting');
      const newRule = await interpretComplianceDocument(content || "文件内容读取失败，请检查文件格式。");
      
      // 检查重复性 (通过 ID 或 标题判断)
      const existingIndex = rules.findIndex(r => r.id === newRule.id || r.title === newRule.title);
      
      if (existingIndex !== -1) {
        setPendingRule(newRule);
        setImportStep('confirm_duplicate');
      } else {
        addNewRule(newRule);
      }
    } catch (error) {
      console.error("Rule import failed:", error);
      alert("智能解读失败，请确保文件内容清晰且符合国企监管主题。");
      setImportStep('idle');
    }
    // 重置 input 以便下次上传相同文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addNewRule = (newRule: ComplianceRule) => {
    setRules(prev => [newRule, ...prev]);
    setImportStep('success');
    finishImport(newRule.id);
  };

  const overwriteRule = () => {
    if (!pendingRule) return;
    setRules(prev => {
        const filtered = prev.filter(r => r.id !== pendingRule.id && r.title !== pendingRule.title);
        return [pendingRule, ...filtered];
    });
    setImportStep('success');
    finishImport(pendingRule.id);
  };

  const finishImport = (ruleId: string) => {
    setTimeout(() => {
        setShowImportModal(false);
        setImportStep('idle');
        setPendingRule(null);
        setExpandedRule(ruleId);
    }, 2000);
  };

  const getWeightBadge = (id: string) => {
    if (id.startsWith('NEW')) return <span className="px-2 py-0.5 rounded text-[9px] font-black text-white bg-green-500 uppercase tracking-wider">新增解析</span>;
    const weights: Record<string, { label: string, color: string }> = {
      'SASAC-001': { label: '核心基准', color: COLORS.RED },
      'SC-SASAC-003': { label: '直接指引', color: COLORS.PRIMARY }
    };
    const weight = weights[id] || { label: '参考规范', color: COLORS.BLUE };
    return (
      <span 
        className="px-2 py-0.5 rounded text-[9px] font-black text-white uppercase tracking-wider"
        style={{ backgroundColor: weight.color }}
      >
        {weight.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 头部标题与高级搜索 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                <BookOpen className="mr-4 text-primary" size={32} />
                合规智库中心
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-medium">权威动态规则引擎 · 当前收录 {rules.length} 条监管规则</p>
            
            <div className="flex items-center space-x-3 mt-6 overflow-x-auto no-scrollbar pb-2">
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white border-primary shadow-lg' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                  >
                      {cat}
                  </button>
              ))}
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-80">
                <input 
                    type="text"
                    placeholder="搜索法规内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none shadow-inner bg-gray-50/50 text-xs font-bold transition-all"
                />
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-300" />
            </div>
            <button 
              onClick={() => setShowImportModal(true)}
              className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-secondary-blue text-white rounded-xl font-black text-xs shadow-xl hover:opacity-90 transition-all active:scale-95"
            >
              <PlusCircle size={16} className="mr-2" /> 智能解读入库
            </button>
        </div>
      </div>

      {/* 智能入库 Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-secondary-blue/40 backdrop-blur-sm" onClick={() => importStep === 'idle' && setShowImportModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800 flex items-center">
                <Sparkles size={20} className="mr-3 text-primary" /> AI 合规文件解读入库
              </h3>
              {(importStep === 'idle' || importStep === 'confirm_duplicate') && (
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <div className="p-10 text-center">
              {importStep === 'idle' ? (
                <div className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-gray-100 rounded-[2rem] p-12 hover:border-primary hover:bg-amber-50/20 cursor-pointer transition-all group"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt" />
                    <FileUp size={48} className="mx-auto text-gray-200 group-hover:text-primary transition-colors mb-4" />
                    <p className="font-black text-gray-800">上传原始合规文件</p>
                    <p className="text-xs text-gray-400 mt-2">支持 PDF, DOCX, TXT · 自动解析章节红线</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start text-left">
                    <Info size={16} className="text-blue-500 mr-3 mt-0.5" />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                      AI 将自动分析文件中的法律层级（国级/省级/区级），并为您提取核心条文、自动匹配分类，收录至您的私有规则库中。
                    </p>
                  </div>
                </div>
              ) : importStep === 'confirm_duplicate' ? (
                <div className="py-6 flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mb-8">
                    <AlertTriangle size={48} className="text-amber-500" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-800 mb-2">合规文件已存在</h4>
                  <p className="text-sm text-gray-500 font-medium mb-8 max-w-sm">
                    检测到规则库中已收录标题或 ID 相同的条目：<br/>
                    <span className="text-gray-800 font-black italic">“{pendingRule?.title}”</span><br/>
                    您是否要使用本次解析的最新内容覆盖旧版本？
                  </p>
                  <div className="flex w-full space-x-4">
                    <button 
                      onClick={() => setShowImportModal(false)}
                      className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      取消入库
                    </button>
                    <button 
                      onClick={overwriteRule}
                      className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/20 hover:opacity-90 flex items-center justify-center transition-all"
                    >
                      <RefreshCcw size={16} className="mr-2" /> 确认覆盖
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-8">
                    {importStep === 'success' ? (
                      <div className="bg-green-100 w-full h-full rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle2 size={48} className="text-green-500" />
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 size={32} className="text-primary animate-pulse" />
                        </div>
                      </>
                    )}
                  </div>
                  <h4 className="text-2xl font-black text-gray-800 mb-2">
                    {importStep === 'reading' ? '正在提取文本事实' : 
                     importStep === 'interpreting' ? 'Gemini 正在深度研读' : '解读成功并已入库'}
                  </h4>
                  <p className="text-sm text-gray-400 font-medium">
                    {importStep === 'reading' ? '正在解析文件物理结构与元数据...' : 
                     importStep === 'interpreting' ? '正在提炼法律红线、确定适用范围及分类对标...' : '正在同步至栎东公司私有智库...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 规则展示列表 */}
      <div className="grid grid-cols-1 gap-6">
          {filteredRules.map(rule => (
              <div key={rule.id} className={`bg-white rounded-[2.5rem] shadow-sm border transition-all duration-500 overflow-hidden group ${expandedRule === rule.id ? 'border-primary ring-4 ring-primary/5' : 'border-gray-100'}`}>
                  <div 
                    className="p-8 cursor-pointer flex items-start justify-between"
                    onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                  >
                      <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase tracking-wider border border-gray-50">
                                {rule.category}
                              </span>
                              {getWeightBadge(rule.id)}
                              <span className="text-[10px] text-gray-300 font-mono font-bold tracking-widest">{rule.id}</span>
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 group-hover:text-primary transition-colors tracking-tight flex items-center">
                            {rule.title}
                            <div className={`ml-4 transition-transform duration-300 ${expandedRule === rule.id ? 'rotate-180' : ''}`}>
                              <ChevronDown size={20} className="text-gray-300" />
                            </div>
                          </h3>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                          <button className="p-3 bg-gray-50 text-gray-400 hover:text-primary transition-colors rounded-2xl border border-gray-100 hover:border-primary/20">
                              <ExternalLink size={18} />
                          </button>
                      </div>
                  </div>

                  {expandedRule === rule.id && (
                    <div className="px-8 pb-10 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-gray-50 pt-10">
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <Info size={16} className="mr-2 text-primary" /> 条文原始内容摘要
                            </h4>
                            <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 shadow-inner">
                                <p className="text-gray-600 text-base leading-relaxed font-bold italic">“{rule.content}”</p>
                                <div className="mt-6 flex items-center text-[11px] text-primary/60 font-black">
                                  依据：{rule.source}
                                </div>
                            </div>
                          </div>
                          <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 relative overflow-hidden group/ai">
                            <div className="relative z-10">
                              <h4 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center">
                                  <Sparkles size={16} className="mr-2" /> AI 针对性深度解读 (栎东公司专项)
                              </h4>
                              <p className="text-sm text-amber-900/80 leading-relaxed font-bold">
                                对栎东公司而言，此条文的核心约束在于 <span className="text-primary underline decoration-2 underline-offset-4">内部分权授权手册</span> 的建设。由于公司属于东同建设集团子公司，必须在内江市东兴区内规中明确划分母子公司间的决策边界，确保合规监督要求。
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <BookCheck size={16} className="mr-2 text-green-500" /> 企业内控自查清单 (Action Items)
                            </h4>
                            <div className="space-y-3">
                                {[
                                    '是否已结合内江东兴区平安路办公点情况制定合规细则？',
                                    '储能电站（圣美路11号）运营数据是否实现合规归档？',
                                    '东同集团内关联交易是否已完成前置合规审查？',
                                ].map((item, idx) => {
                                    const isChecked = checkedItems[`${rule.id}-${idx}`];
                                    return (
                                        <div 
                                          key={idx} 
                                          onClick={() => toggleCheck(rule.id, idx)}
                                          className={`flex items-center p-5 rounded-2xl text-xs font-black transition-all cursor-pointer border shadow-sm ${isChecked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 text-gray-600 hover:border-primary/40 hover:bg-amber-50/10'}`}
                                        >
                                            <div className="mr-4 flex-shrink-0">
                                                {isChecked ? <CheckSquare size={22} className="text-green-500" /> : <Square size={22} className="text-gray-200" />}
                                            </div>
                                            <span className={isChecked ? 'line-through opacity-60' : ''}>{item}</span>
                                        </div>
                                    );
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
          ))}

          {filteredRules.length === 0 && (
              <div className="text-center py-40 bg-white rounded-[3rem] border-4 border-dashed border-gray-100">
                  <FileX size={48} className="mx-auto text-gray-200 mb-4" />
                  <h3 className="text-2xl font-black text-gray-300">未检索到匹配的监管规则</h3>
              </div>
          )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
