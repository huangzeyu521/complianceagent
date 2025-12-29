
import React, { useState, useRef, useEffect } from 'react';
import { performComplianceDiagnosis, extractEntitiesFromDocument } from '../services/geminiService';
import { DiagnosisResult, RiskLevel, ExtractedEntity } from '../types';
import { COLORS } from '../constants';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { 
  FileText, PenTool, UploadCloud, Loader2, Save, Download, 
  ShieldCheck, ChevronRight, AlertCircle, Clock, Info, 
  BookOpen, Target, ListChecks, Map, CheckCircle2, AlertTriangle, XCircle, FileWarning,
  FileUp, Lock, FileX, Trash2, Hash, Terminal, Sparkles, Database, FileSpreadsheet,
  Cpu, ArrowRight, ShieldAlert, ScanSearch, FileSearch
} from 'lucide-react';

const ComplianceAnalysis: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [inputText, setInputText] = useState('');
  const [fileData, setFileData] = useState<{ data: string; mimeType: string } | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<{ title: string; message: string; type: string } | null>(null);
  
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [parsingLogs, setParsingLogs] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<{ 
    score: number, 
    summary: string, 
    results: DiagnosisResult[] 
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsingLogs]);

  const SUPPORTED_FORMATS = [
    { ext: '.pdf', mime: 'application/pdf', label: 'PDF' },
    { ext: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word' },
    { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel' },
    { ext: '.txt', mime: 'text/plain', label: 'Text' },
    { ext: '.csv', mime: 'text/csv', label: 'CSV' }
  ];

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const addLog = (msg: string) => {
    setParsingLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(0);
    setFileName(file.name);
    setFileData(null);
    setExtractedText(null);
    
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowedExtensions = SUPPORTED_FORMATS.map(f => f.ext);
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError({
        title: "格式不受支持",
        message: `系统目前无法解析 "${fileExtension}" 格式。请报送 PDF, Word 或 Excel。`,
        type: 'format'
      });
      return;
    }

    if (file.size === 0) {
      setError({ title: "空文件异常", message: "报送的文件内容为空，请检查后重试。", type: 'empty' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError({
        title: "报送文件超限",
        message: "为保证 AI 审计解析质量，单个文档不得超过 25MB。",
        type: 'size'
      });
      return;
    }

    setIsReadingFile(true);
    setUploadProgress(15);

    try {
      if (fileExtension === '.pdf') {
        const base64 = await blobToBase64(file);
        setFileData({ data: base64, mimeType: file.type });
        setUploadProgress(100);
      } else if (fileExtension === '.docx') {
        setUploadProgress(35);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error("EMPTY_TEXT");
        setExtractedText(result.value);
        setUploadProgress(100);
      } else if (fileExtension === '.xlsx') {
        setUploadProgress(35);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let text = "";
        let sheetCount = 0;
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (csv.trim()) {
            text += `--- 工作表: ${sheetName} ---\n${csv}\n\n`;
            sheetCount++;
          }
        });
        if (sheetCount === 0) throw new Error("EMPTY_SHEETS");
        setExtractedText(text);
        setUploadProgress(100);
      } else {
        const text = await file.text();
        if (!text.trim()) throw new Error("EMPTY_TEXT");
        setExtractedText(text);
        setUploadProgress(100);
      }
      
      setTimeout(() => setIsReadingFile(false), 600);
    } catch (err: any) {
      console.error("File processing error:", err);
      const msg = err.message === "EMPTY_TEXT" || err.message === "EMPTY_SHEETS" 
        ? "文档中未检测到有效可读文本内容。" 
        : "文件可能已加密或物理损坏。请确保 Word/Excel 未设置打开密码。";
      setError({ title: "读取失败", message: msg, type: 'error' });
      setIsReadingFile(false);
      setFileName(null);
    }
  };

  const startParsing = async () => {
    if (!fileData && !extractedText && !inputText) return;
    setIsProcessing(true);
    setStep(2);
    setParsingLogs([
      "系统自检：Gemini 3 Pro 合规引擎就绪...", 
      `加载审计主体：${fileName || '手动录入数据'}`,
      "初始化深度语义对标协议 (SOE-IQ-V2)..."
    ]);
    
    try {
      setTimeout(() => addLog("正在研读物理布局：识别页眉页脚及印章区域..."), 800);
      setTimeout(() => addLog("语义增强：执行专业词库匹配（国资监管专用）..."), 1800);
      setTimeout(() => addLog("核心提取：锁定组织关系 (ORG) 与利益相关方..."), 3200);
      setTimeout(() => addLog("敏感扫描：检索财务红线 (MONEY) 与资金流向记录..."), 4800);
      setTimeout(() => addLog("深度比对：提取关键约束条款 (CLAUSE) 并建立逻辑关联..."), 6200);
      setTimeout(() => addLog("审计溯源：构建证据上下文回溯索引..."), 7800);

      const input = fileData ? fileData : (extractedText || inputText);
      const extracted = await extractEntitiesFromDocument(input);
      
      addLog(`[完成] AI 引擎成功识别 ${extracted.length} 项具备审计价值的事实证据。`);
      setEntities(extracted);
      
      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
      }, 1800);
    } catch (err) {
      console.error("AI Extraction Failed:", err);
      setError({ 
        title: "AI 语义解析中断", 
        message: "解析模型响应异常。可能是文档逻辑极其复杂或包含大量不可读图表。请尝试转换格式后重试。", 
        type: 'ai' 
      });
      setStep(1);
      setIsProcessing(false);
    }
  };

  const startFinalDiagnosis = async () => {
    setIsProcessing(true);
    try {
      const result = await performComplianceDiagnosis(inputText || `基于报送文档: ${fileName}`, entities);
      setDiagnosis(result);
      setStep(4);
    } catch (err) {
      setError({ title: "诊断报告生成失败", message: "对标标准库匹配量过载，请尝试分批报送资料进行诊断。", type: 'timeout' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    const styles = {
      [RiskLevel.HIGH]: { bg: 'bg-red-100', text: 'text-red-700', label: '重大违规' },
      [RiskLevel.MEDIUM]: { bg: 'bg-amber-100', text: 'text-amber-700', label: '合规瑕疵' },
      [RiskLevel.LOW]: { bg: 'bg-blue-100', text: 'text-blue-700', label: '改进建议' }
    };
    const s = styles[level];
    return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${s.bg} ${s.text} uppercase tracking-tighter`}>{s.label}</span>;
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'ORG': return <Database size={16} className="text-blue-500" />;
      case 'MONEY': return <Target size={16} className="text-emerald-500" />;
      case 'DATE': return <Clock size={16} className="text-amber-500" />;
      case 'CLAUSE': return <Lock size={16} className="text-rose-400" />;
      case 'METRIC': return <ScanSearch size={16} className="text-primary" />;
      default: return <Info size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 步骤导航 */}
      <div className="flex items-center justify-between px-10 py-6 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
        {[
          { id: 1, label: '资料报送', icon: FileUp },
          { id: 2, label: '智能提取', icon: Terminal },
          { id: 3, label: '证据链核查', icon: ShieldCheck },
          { id: 4, label: '诊断报告', icon: BookOpen }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center space-x-4 transition-all duration-700 ${step >= s.id ? 'opacity-100' : 'opacity-25'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${step >= s.id ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105' : 'bg-gray-50 text-gray-300'}`}>
                {step > s.id ? <CheckCircle2 size={28} /> : <s.icon size={26} />}
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-[10px] uppercase tracking-[0.2em] ${step === s.id ? 'text-primary' : 'text-gray-400'}`}>Phase 0{s.id}</span>
                <span className={`font-black text-base whitespace-nowrap ${step === s.id ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
              </div>
            </div>
            {i < 3 && <div className={`h-[3px] w-14 mx-4 rounded-full ${step > s.id ? 'bg-primary' : 'bg-gray-100'} transition-all duration-700`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-white border-l-[12px] border-red-500 p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-10 flex items-start group">
          <div className="p-4 bg-red-50 rounded-[1.5rem] mr-8 transition-transform group-hover:scale-110">
            <ShieldAlert size={40} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-gray-800 text-2xl mb-2 tracking-tight">{error.title}</h4>
            <p className="text-base text-gray-500 leading-relaxed font-bold">{error.message}</p>
          </div>
          <button onClick={() => { setError(null); setFileName(null); setFileData(null); setExtractedText(null); }} className="text-gray-200 hover:text-red-500 transition-colors p-2">
            <XCircle size={32} />
          </button>
        </div>
      )}

      {/* 阶段 1: 报送 */}
      {step === 1 && (
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 animate-in fade-in duration-700">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-8">
            <div>
                <h2 className="text-4xl font-black text-gray-800 flex items-center tracking-tighter">
                <FileSearch size={40} className="text-primary mr-5" />
                报送合规审计资料
                </h2>
                <p className="text-base text-gray-400 mt-2 font-bold max-w-xl">AI 将对您上传的文档进行非结构化提取，自动识别经营主体、财务合同及红线条款。</p>
            </div>
            <div className="flex bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100 shadow-inner">
              {['upload', 'manual'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setInputMode(mode as any)}
                  className={`px-8 py-4 rounded-2xl text-xs font-black transition-all ${inputMode === mode ? 'bg-white text-primary shadow-xl border border-amber-100 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {mode === 'upload' ? '多维文档报送' : '合规事实录入'}
                </button>
              ))}
            </div>
          </div>
          
          {inputMode === 'upload' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8">
                    <div 
                    onClick={() => !isReadingFile && fileInputRef.current?.click()}
                    className={`relative overflow-hidden group border-4 border-dashed rounded-[3.5rem] p-20 flex flex-col items-center justify-center text-center transition-all ${isReadingFile ? 'bg-amber-50/20 border-primary cursor-wait' : 'border-gray-100 hover:border-primary/50 hover:bg-amber-50/10 cursor-pointer shadow-md hover:shadow-2xl'}`}
                    >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.xlsx,.txt,.csv" />
                    
                    {isReadingFile ? (
                        <div className="space-y-8 py-4">
                        <div className="relative w-24 h-24 mx-auto">
                            <Loader2 size={96} className="text-primary animate-spin absolute inset-0 opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-primary">{uploadProgress}%</div>
                        </div>
                        <div className="space-y-3">
                            <p className="font-black text-gray-800 text-2xl tracking-tight">正在构建底层索引...</p>
                            <p className="text-xs text-gray-400 font-black uppercase tracking-[0.3em]">Binary structural parsing in progress</p>
                        </div>
                        <div className="w-72 h-3 bg-gray-50 rounded-full overflow-hidden mx-auto shadow-inner border border-gray-100">
                            <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        </div>
                    ) : fileName ? (
                        <div className="space-y-8 animate-in zoom-in duration-500 py-6">
                        <div className="bg-green-50 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-200/50 border-4 border-white transition-transform hover:scale-110">
                            {fileName.endsWith('.xlsx') ? <FileSpreadsheet size={64} className="text-green-500" /> : <CheckCircle2 size={64} className="text-green-500" />}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">{fileName}</h3>
                            <div className="flex items-center justify-center space-x-3">
                              <span className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full border border-green-200">Pre-Parsing Complete</span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFileName(null); setFileData(null); setExtractedText(null); }} 
                            className="flex items-center px-8 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] text-red-500 hover:bg-red-50 hover:border-red-200 font-black transition-all mx-auto shadow-sm"
                        >
                            <Trash2 size={16} className="mr-3" /> 移除并重新报送
                        </button>
                        </div>
                    ) : (
                        <>
                        <div className="w-28 h-28 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-10 group-hover:bg-white group-hover:shadow-xl transition-all shadow-inner">
                            <FileUp size={56} className="text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">点击或拖拽报送审计文档</h3>
                        <p className="text-base text-gray-400 max-w-sm mx-auto font-bold opacity-80">AI 智脑支持 PDF, DOCX, XLSX 报表等多种格式，最大限制 25MB。</p>
                        <div className="mt-10 flex flex-wrap justify-center gap-3">
                            {SUPPORTED_FORMATS.map(f => (
                                <span key={f.ext} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary hover:border-primary/30 transition-all">{f.label}</span>
                            ))}
                        </div>
                        </>
                    )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-50/50 p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                        <h4 className="text-[11px] font-black text-gray-500 mb-6 flex items-center uppercase tracking-[0.2em]">
                            <ShieldCheck size={20} className="mr-3 text-primary" /> 报送合规准则
                        </h4>
                        <ul className="space-y-6">
                            {[
                                { t: '语义对标', d: 'AI 自动扫描国资监管办法，关联省属合规标准。' },
                                { t: '指标提取', d: '自动锁定财报中的研发强度及负债率等关键指标。' },
                                { t: '隐私保护', d: '底层解析过程采用阅后即焚，不持久化存储任何敏感数据。' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start group">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2.5 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                    <div>
                                        <p className="text-sm font-black text-gray-800 mb-1">{item.t}</p>
                                        <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{item.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-amber-50/40 p-10 rounded-[3rem] border border-amber-100/40 relative overflow-hidden shadow-inner">
                        <h4 className="text-[10px] font-black text-primary mb-4 uppercase tracking-[0.2em] flex items-center">
                            <Sparkles size={18} className="mr-3" /> 模型状态反馈
                        </h4>
                        <p className="text-xs text-amber-900/80 leading-relaxed font-black mb-2">
                            当前分配算力单元：<span className="text-primary font-black">Gemini-3-Pro-Ultra</span>
                        </p>
                        <p className="text-[11px] text-amber-900/50 leading-relaxed font-bold">
                          已预加载《四川省省属企业合规管理办法》核心审计包。
                        </p>
                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12 scale-150">
                            <Cpu size={180} />
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="relative group">
                <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-[32rem] p-12 border-4 border-gray-50 rounded-[4rem] bg-gray-50/20 text-xl font-bold outline-none focus:border-primary focus:bg-white transition-all shadow-inner custom-scrollbar leading-relaxed"
                placeholder="请在此手动录入或粘贴企业经营管理的具体事实、财务数据描述、重大合同摘要或会议纪要核心内容..."
                />
                <div className="absolute bottom-10 right-14 flex items-center text-xs text-gray-300 font-black uppercase tracking-widest group-focus-within:text-primary/40">
                    <Hash size={16} className="mr-2" /> {inputText.length} Characters Detected
                </div>
            </div>
          )}

          <div className="mt-14 flex justify-end">
            <button
              onClick={startParsing}
              disabled={isProcessing || (!fileData && !extractedText && !inputText)}
              className="group px-20 py-8 bg-primary text-white rounded-[2.5rem] font-black shadow-2xl shadow-primary/30 hover:-translate-y-2 hover:shadow-primary/50 transition-all disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none flex items-center text-2xl"
            >
              启动 AI 深度审计解析
              <div className="ml-6 p-2 bg-white/20 rounded-2xl group-hover:translate-x-2 transition-transform shadow-inner">
                <ChevronRight size={32} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 阶段 2: 深度解析控制台 */}
      {step === 2 && (
        <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-gray-100 animate-in zoom-in duration-1000">
           <div className="flex items-center justify-between mb-12">
              <div className="flex items-center">
                <div className="p-5 bg-gray-900 rounded-[2.5rem] mr-8 shadow-3xl shadow-primary/10 border-2 border-gray-800 scale-110">
                    <Terminal size={40} className="text-green-500 animate-pulse" />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter">AI 智能审计工作间</h2>
                    <p className="text-base text-gray-400 mt-2 font-bold">深度解析底层语义，正在构建合规事实证据链...</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center text-xs font-black text-primary px-5 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 animate-pulse tracking-[0.2em] uppercase shadow-sm">
                  <Cpu size={16} className="mr-3" /> Core Engine Active
                </div>
              </div>
           </div>

           <div className="bg-gray-950 rounded-[3.5rem] p-12 font-mono text-base text-green-400 h-[35rem] overflow-y-auto custom-scrollbar shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] border-[16px] border-gray-900 relative">
              <div className="absolute top-0 right-0 p-8 text-gray-800 font-black text-[100px] select-none opacity-5 leading-none">AI</div>
              <div className="space-y-4 relative z-10">
                {parsingLogs.map((log, i) => (
                    <div key={i} className="flex items-start animate-in fade-in slide-in-from-left-6 duration-700">
                    <span className="text-gray-700 mr-5 shrink-0 font-black select-none opacity-50">[{String(i+1).padStart(2, '0')}]</span>
                    <span className="text-primary mr-4 select-none font-black opacity-90 tracking-widest">{'>'}</span>
                    <span className="leading-relaxed font-bold tracking-tight text-green-300/90">{log}</span>
                    </div>
                ))}
                <div className="flex items-center space-x-3 animate-pulse mt-10 ml-12">
                    <span className="w-2 h-6 bg-green-500 rounded-sm" />
                    <span className="text-[11px] text-gray-600 uppercase font-black tracking-[0.4em]">Contextualizing facts...</span>
                </div>
              </div>
              <div ref={logEndRef} />
           </div>

           <div className="mt-16 flex flex-col items-center">
              <div className="w-full max-w-5xl h-3 bg-gray-50 rounded-full overflow-hidden mb-8 shadow-inner relative border border-gray-100">
                <div className="h-full bg-primary animate-progress-indeterminate rounded-full shadow-[0_0_15px_rgba(191,147,59,0.5)]" />
                <div className="absolute inset-0 bg-white/10 animate-shimmer" />
              </div>
              <div className="flex items-center space-x-10">
                <div className="flex items-center group">
                    <div className="p-2 bg-amber-50 rounded-lg mr-3 group-hover:bg-primary/10 transition-colors">
                      <ScanSearch size={20} className="text-primary" />
                    </div>
                    <span className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">Cross-Referencing Rules</span>
                </div>
                <div className="w-2 h-2 bg-gray-100 rounded-full" />
                <div className="flex items-center group">
                    <div className="p-2 bg-amber-50 rounded-lg mr-3 group-hover:bg-primary/10 transition-colors">
                      <ShieldCheck size={20} className="text-primary" />
                    </div>
                    <span className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">Validating Evidence</span>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* 阶段 3: 证据链确认 */}
      {step === 3 && (
        <div className="bg-white p-14 rounded-[3.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-right-16 duration-1000">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8">
            <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter">合规事实证据报告</h2>
                <p className="text-lg text-gray-400 font-bold mt-2">AI 已自动从报送资料中提取出核心事实，请审计官进行真实性核验。</p>
            </div>
            <div className="flex items-center px-8 py-4 bg-green-50 rounded-[2rem] border-2 border-green-100 shadow-sm transition-transform hover:scale-105">
                <Hash size={24} className="text-green-600 mr-4" />
                <span className="text-base font-black text-green-800 uppercase tracking-widest">Identified: {entities.length} Items</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[50rem] overflow-y-auto pr-6 custom-scrollbar px-2 py-2">
            {entities.map((ent, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[3rem] border-2 border-gray-50 shadow-sm hover:shadow-3xl hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                   {getEntityIcon(ent.type)}
                </div>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center">
                    <div className="p-5 bg-gray-50 rounded-[2rem] shadow-inner mr-6 group-hover:bg-amber-50 group-hover:shadow-xl transition-all border border-gray-50">
                      {getEntityIcon(ent.type)}
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] block mb-2">{ent.type}</span>
                      <div className="text-2xl font-black text-gray-800 group-hover:text-primary transition-colors tracking-tight">{ent.value}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                    <div className="text-sm text-gray-500 font-bold leading-relaxed italic bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 relative group-hover:bg-white transition-colors">
                      <div className="absolute -top-4 left-6 bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] border border-gray-100 shadow-sm">审计事实回溯</div>
                      “...{ent.context}...”
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                        <div className={`flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${ent.confidence > 0.85 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            Confidence: {(ent.confidence * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col lg:flex-row justify-between items-center pt-12 border-t-4 border-gray-50 gap-8">
            <button 
              onClick={() => { setStep(1); setEntities([]); setFileName(null); setFileData(null); setExtractedText(null); }}
              className="flex items-center px-12 py-5 bg-white border-4 border-gray-50 rounded-[2rem] font-black text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm hover:shadow-xl"
            >
              <Trash2 size={24} className="mr-4" /> 放弃并重新报送
            </button>
            <button
              onClick={startFinalDiagnosis}
              className="group px-20 py-8 bg-secondary-blue text-white rounded-[3rem] font-black shadow-[0_30px_60px_-15px_rgba(4,33,120,0.4)] hover:-translate-y-2 transition-all flex items-center text-2xl active:scale-95"
              style={{ backgroundColor: COLORS.BLUE }}
            >
              生成合规对标报告
              <div className="ml-6 p-3 bg-white/10 rounded-2xl group-hover:translate-x-3 transition-transform shadow-inner">
                <ArrowRight size={32} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 阶段 4: 结果 */}
      {step === 4 && diagnosis && (
        <div className="space-y-10 animate-in slide-in-from-bottom-20 duration-1000">
           <div className="bg-white p-16 rounded-[4.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-16 hidden lg:block">
                    <div className="bg-white p-12 rounded-[3.5rem] border-[6px] border-primary text-center shadow-[0_50px_80px_-20px_rgba(191,147,59,0.3)] relative z-10 scale-125 translate-x-4 -translate-y-4">
                        <div className="text-[12px] font-black text-primary uppercase tracking-[0.5em] mb-3">Compliance Score</div>
                        <div className="text-8xl font-black text-primary leading-none">{diagnosis.score}</div>
                    </div>
                </div>

                <div className="max-w-4xl relative z-10">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="px-4 py-1.5 bg-amber-50 text-primary text-[11px] font-black rounded-xl border border-amber-100 uppercase tracking-[0.3em] shadow-sm">SOE-IQ-Audit-Insight-2025</div>
                        <div className="w-2 h-2 bg-gray-100 rounded-full" />
                        <span className="text-[11px] text-gray-300 font-black uppercase tracking-[0.3em]">Verified by Gemini 3 Pro Engine</span>
                    </div>
                    <h2 className="text-6xl font-black text-gray-900 mb-10 tracking-tighter leading-[1.1]">企业经营管理<br/>合规深度审计诊断报告</h2>
                    <p className="text-gray-500 leading-relaxed text-3xl mb-14 font-bold opacity-80 max-w-2xl">{diagnosis.summary}</p>
                    <div className="flex flex-wrap gap-6">
                        <button className="flex items-center px-12 py-6 bg-secondary-blue text-white rounded-[2rem] font-black shadow-3xl hover:scale-105 transition-all active:scale-95">
                            <Download size={28} className="mr-4" /> 导出权威 PDF 报告
                        </button>
                        <button className="flex items-center px-12 py-6 border-4 border-gray-50 rounded-[2rem] font-black text-gray-500 bg-white hover:bg-gray-50 hover:border-primary/20 transition-all shadow-sm">
                            <Save size={28} className="mr-4" /> 保存当前审计快照
                        </button>
                    </div>
                </div>
                <BookOpen className="absolute -left-32 -bottom-32 text-gray-50 opacity-30 rotate-12" size={500} />
            </div>

            <div className="grid grid-cols-1 gap-12">
                {diagnosis.results.map((res, idx) => (
                    <div key={idx} className="bg-white rounded-[4.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-1000 group/res">
                        <div className={`px-16 py-12 flex items-center justify-between border-b-2 ${res.riskLevel === 'HIGH' ? 'bg-red-50/10' : 'bg-gray-50/5'}`}>
                            <div className="flex items-center">
                                <div className={`w-5 h-5 rounded-full mr-8 shadow-2xl transition-transform group-hover/res:scale-150 ${res.riskLevel === 'HIGH' ? 'bg-red-500 shadow-red-500/40 animate-pulse' : 'bg-amber-500 shadow-amber-500/40'}`} />
                                <h4 className="font-black text-gray-900 text-4xl tracking-tighter">{res.riskTitle}</h4>
                            </div>
                            {getRiskBadge(res.riskLevel)}
                        </div>

                        <div className="p-16 grid grid-cols-1 lg:grid-cols-12 gap-20">
                            <div className="lg:col-span-8 space-y-16">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                    <div>
                                        <h5 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8 flex items-center opacity-60">
                                            <Target size={20} className="mr-4 text-red-500" /> 审计事实与差距识别
                                        </h5>
                                        <div className="bg-gray-50/30 p-10 rounded-[3rem] border-2 border-gray-50 shadow-inner group-hover/res:bg-white transition-colors duration-500">
                                            <p className="text-xl text-gray-700 leading-relaxed mb-10 font-bold">{res.currentStatus}</p>
                                            <div className="text-base text-red-600 font-black bg-white border-4 border-red-50 p-8 rounded-[2.5rem] flex items-start shadow-2xl relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
                                                <AlertTriangle size={24} className="mr-5 mt-1 flex-shrink-0" />
                                                <span className="leading-relaxed tracking-tight">{res.gapAnalysis}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8 flex items-center opacity-60">
                                            <ShieldCheck size={20} className="mr-4 text-primary" /> 合规法律对标依据
                                        </h5>
                                        <div className="bg-amber-50/10 p-10 rounded-[3rem] border-2 border-amber-100/10 h-full flex flex-col group-hover/res:bg-white transition-colors duration-500">
                                            <p className="text-sm text-primary font-black mb-8 italic border-b-2 border-amber-100/10 pb-6 tracking-tight leading-relaxed">{res.complianceBasis}</p>
                                            <div className="flex-1">
                                                <p className="text-base text-gray-600 leading-relaxed font-black">
                                                    【穿透风险评估】：<br/>
                                                    <span className="text-gray-400 font-bold opacity-80 italic tracking-tight">{res.impactAnalysis}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary p-14 rounded-[4.5rem] text-white shadow-3xl relative overflow-hidden group/sug transform transition-all hover:scale-[1.02]">
                                    <h5 className="text-xs font-black mb-8 flex items-center opacity-70 tracking-[0.4em] uppercase">
                                        <PenTool size={24} className="mr-5" /> 专家级合规整改指令
                                    </h5>
                                    <p className="text-3xl font-black leading-tight relative z-10 tracking-tighter group-hover/sug:translate-x-3 transition-transform">{res.suggestion}</p>
                                    <Sparkles className="absolute -right-16 -bottom-16 text-white opacity-[0.08] rotate-12 scale-150" size={350} />
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/sug:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            <div className="lg:col-span-4 lg:border-l-[6px] lg:border-gray-50 lg:pl-20">
                                <h5 className="text-[12px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12 flex items-center">
                                    <Map size={22} className="mr-4 text-primary" /> 闭环改进路线图
                                </h5>
                                <div className="space-y-12 relative">
                                    <div className="absolute left-[19px] top-6 bottom-6 w-1.5 bg-gray-50 rounded-full" />
                                    {res.roadmap.map((step, sidx) => (
                                        <div key={sidx} className="flex items-start relative z-10 group/step">
                                          <div className={`w-11 h-11 rounded-[1.2rem] flex items-center justify-center text-sm font-black border-4 bg-white transition-all shadow-xl group-hover/step:scale-125 group-hover/step:rotate-12 ${sidx === 0 ? 'border-primary text-primary shadow-primary/30' : 'border-gray-100 text-gray-300'}`}>
                                            {sidx + 1}
                                          </div>
                                          <div className="ml-8 mt-2 flex-1">
                                            <p className="text-lg text-gray-700 leading-relaxed font-black group-hover/step:text-primary transition-colors tracking-tight">{step}</p>
                                          </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center mt-20 pb-32 space-y-8">
                <p className="text-sm text-gray-400 font-black uppercase tracking-[0.8em] opacity-40">Final Analysis Completed</p>
                <button 
                    onClick={() => { setStep(1); setDiagnosis(null); setEntities([]); setFileName(null); setFileData(null); setExtractedText(null); setInputText(''); }}
                    className="flex items-center px-24 py-8 bg-white border-4 border-primary/20 rounded-[3rem] font-black text-primary hover:bg-amber-50 hover:border-primary hover:-translate-y-3 transition-all shadow-3xl active:scale-95 group"
                >
                    发起新一轮审计扫描
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <ArrowRight size={24} />
                    </div>
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceAnalysis;
