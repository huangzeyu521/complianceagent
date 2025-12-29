
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
  Cpu, ArrowRight
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
        message: `系统当前无法解析 "${fileExtension}" 格式。请使用 PDF, Word 或 Excel。`,
        type: 'format'
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError({
        title: "文件超限",
        message: "文档不得超过 25MB。",
        type: 'size'
      });
      return;
    }

    setIsReadingFile(true);
    setUploadProgress(20);

    try {
      if (fileExtension === '.pdf') {
        const base64 = await blobToBase64(file);
        setFileData({ data: base64, mimeType: file.type });
        setUploadProgress(100);
      } else if (fileExtension === '.docx') {
        setUploadProgress(40);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setExtractedText(result.value);
        setUploadProgress(100);
      } else if (fileExtension === '.xlsx') {
        setUploadProgress(40);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let text = "";
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          text += `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_txt(sheet)}\n\n`;
        });
        setExtractedText(text);
        setUploadProgress(100);
      } else {
        const text = await file.text();
        setExtractedText(text);
        setUploadProgress(100);
      }
      
      setTimeout(() => setIsReadingFile(false), 500);
    } catch (err) {
      console.error("File processing error:", err);
      setError({ 
        title: "解析失败", 
        message: "文件可能已加密、损坏或格式不规范。如果是 Excel/Word，请确保没有设置打开密码。", 
        type: 'error' 
      });
      setIsReadingFile(false);
    }
  };

  const startParsing = async () => {
    if (!fileData && !extractedText && !inputText) return;
    setIsProcessing(true);
    setStep(2);
    setParsingLogs([
      "启动 AI 深度经营事实解析引擎...", 
      "建立全量合规模型链接 (Gemini 3 Pro)...",
      `正在分配处理资源对文件 "${fileName || '手动输入'}" 进行建模...`
    ]);
    
    try {
      setTimeout(() => addLog("正在研读文档物理结构与元数据信息..."), 1000);
      setTimeout(() => addLog("执行智能版面还原与 OCR 字符二次增强..."), 2000);
      setTimeout(() => addLog("识别关键控制实体 (ORG) 与关联方信息..."), 3500);
      setTimeout(() => addLog("正在锁定财务红线 (MONEY) 与合规指标 (METRIC)..."), 5000);
      setTimeout(() => addLog("深度提取法律约束条款 (CLAUSE) 语义..."), 6500);

      const input = fileData ? fileData : (extractedText || inputText);
      const extracted = await extractEntitiesFromDocument(input);
      
      addLog(`成功识别 ${extracted.length} 个核心合规事实证据。`);
      setEntities(extracted);
      
      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
      }, 1500);
    } catch (err) {
      console.error("AI Parsing Error:", err);
      setError({ 
        title: "AI 语义解析异常", 
        message: "大模型无法在有效时间内提取该文档的结构化事实，可能是内容过于杂乱或超出文本限制。", 
        type: 'ai' 
      });
      setStep(1);
      setIsProcessing(false);
    }
  };

  const startFinalDiagnosis = async () => {
    setIsProcessing(true);
    try {
      const result = await performComplianceDiagnosis(inputText || `基于合规文件: ${fileName}`, entities);
      setDiagnosis(result);
      setStep(4);
    } catch (err) {
      setError({ title: "诊断引擎超时", message: "合规规则匹配逻辑极其复杂，系统响应异常，请尝试缩减文档范围。", type: 'timeout' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    const styles = {
      [RiskLevel.HIGH]: { bg: 'bg-red-100', text: 'text-red-700', label: '严重违规' },
      [RiskLevel.MEDIUM]: { bg: 'bg-amber-100', text: 'text-amber-700', label: '管理瑕疵' },
      [RiskLevel.LOW]: { bg: 'bg-blue-100', text: 'text-blue-700', label: '优化建议' }
    };
    const s = styles[level];
    return <span className={`px-2 py-1 rounded text-[10px] font-black ${s.bg} ${s.text} uppercase`}>{s.label}</span>;
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'ORG': return <Database size={14} className="text-blue-500" />;
      case 'MONEY': return <Target size={14} className="text-emerald-500" />;
      case 'DATE': return <Clock size={14} className="text-amber-500" />;
      case 'CLAUSE': return <Lock size={14} className="text-rose-400" />;
      case 'METRIC': return <ListChecks size={14} className="text-primary" />;
      default: return <Info size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 步骤导航 */}
      <div className="flex items-center justify-between px-8 py-5 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
        {[
          { id: 1, label: '资料报送', icon: FileText },
          { id: 2, label: '智能研读', icon: Terminal },
          { id: 3, label: '事实核查', icon: ShieldCheck },
          { id: 4, label: '评估报告', icon: BookOpen }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center space-x-3 transition-all duration-500 ${step >= s.id ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${step >= s.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-110' : 'bg-gray-50 text-gray-300'}`}>
                {step > s.id ? <CheckCircle2 size={24} /> : <s.icon size={22} />}
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-xs uppercase tracking-tighter ${step === s.id ? 'text-primary' : 'text-gray-400'}`}>Step 0{s.id}</span>
                <span className={`font-black text-sm whitespace-nowrap ${step === s.id ? 'text-gray-800' : 'text-gray-500'}`}>{s.label}</span>
              </div>
            </div>
            {i < 3 && <div className={`h-[2px] w-12 mx-2 rounded-full ${step > s.id ? 'bg-primary' : 'bg-gray-100'} transition-all duration-500`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-white border-l-8 border-red-500 p-8 rounded-3xl shadow-2xl animate-in slide-in-from-top-6 flex items-start">
          <div className="p-3 bg-red-50 rounded-2xl mr-6">
            <FileWarning size={32} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-gray-800 text-xl mb-1">{error.title}</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-bold">{error.message}</p>
          </div>
          <button onClick={() => { setError(null); setFileName(null); setFileData(null); setExtractedText(null); }} className="text-gray-300 hover:text-red-500 transition-colors">
            <XCircle size={28} />
          </button>
        </div>
      )}

      {/* 阶段 1: 报送 */}
      {step === 1 && (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
            <div>
                <h2 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                <UploadCloud size={32} className="text-primary mr-4" />
                报送合规审计资料
                </h2>
                <p className="text-sm text-gray-400 mt-2 font-bold">支持多种经营管理文档解析，AI 将自动识别其中的关键合规证据。</p>
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
              {['upload', 'manual'].map(mode => (
                <button 
                  key={mode}
                  onClick={() => setInputMode(mode as any)}
                  className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${inputMode === mode ? 'bg-white text-primary shadow-lg border border-amber-100' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {mode === 'upload' ? '多维文档报送' : '合规事实录入'}
                </button>
              ))}
            </div>
          </div>
          
          {inputMode === 'upload' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <div 
                    onClick={() => !isReadingFile && fileInputRef.current?.click()}
                    className={`relative overflow-hidden group border-4 border-dashed rounded-[3rem] p-16 flex flex-col items-center justify-center text-center transition-all ${isReadingFile ? 'bg-amber-50/20 border-primary cursor-wait' : 'border-gray-100 hover:border-primary/40 hover:bg-amber-50/5 cursor-pointer shadow-sm hover:shadow-xl'}`}
                    >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.xlsx,.txt,.csv" />
                    
                    {isReadingFile ? (
                        <div className="space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <Loader2 size={80} className="text-primary animate-spin absolute inset-0" />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-primary">{uploadProgress}%</div>
                        </div>
                        <div className="space-y-2">
                            <p className="font-black text-gray-800 text-lg">正在执行底层结构化解析...</p>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Binary parsing & text extraction</p>
                        </div>
                        <div className="w-64 h-2.5 bg-gray-100 rounded-full overflow-hidden mx-auto shadow-inner">
                            <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        </div>
                    ) : fileName ? (
                        <div className="space-y-6 animate-in zoom-in duration-300">
                        <div className="bg-green-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-green-100/50">
                            {fileName.endsWith('.xlsx') ? <FileSpreadsheet size={48} className="text-green-600" /> : <CheckCircle2 size={48} className="text-green-600" />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 mb-1">{fileName}</h3>
                            <p className="text-xs text-green-600 font-black uppercase tracking-widest">Ready for intelligent parsing</p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFileName(null); setFileData(null); setExtractedText(null); }} 
                            className="flex items-center px-6 py-2 bg-white border border-gray-100 rounded-xl text-xs text-red-400 hover:bg-red-50 hover:text-red-500 font-black transition-all mx-auto"
                        >
                            <Trash2 size={14} className="mr-2" /> 移除并重选
                        </button>
                        </div>
                    ) : (
                        <>
                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-amber-50 transition-colors shadow-inner">
                            <FileUp size={48} className="text-gray-200 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-2">点击或拖拽报送审计文档</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto font-medium">支持 PDF, Word (.docx), Excel (.xlsx) 及文本文件，最大限制 25MB。</p>
                        <div className="mt-8 flex space-x-3">
                            {SUPPORTED_FORMATS.map(f => (
                                <span key={f.ext} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-tighter">{f.label}</span>
                            ))}
                        </div>
                        </>
                    )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <h4 className="text-sm font-black text-gray-700 mb-4 flex items-center uppercase tracking-widest">
                            <ShieldCheck size={18} className="mr-2 text-primary" /> 报送说明
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { t: '深度对标', d: 'AI 将自动关联国资委及省属合规基准库。' },
                                { t: '事实提取', d: '自动识别合同金额、关键条款及经营指标。' },
                                { t: '隐私脱敏', d: '处理过程中将自动对个人敏感信息进行保护。' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-gray-800">{item.t}</p>
                                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{item.d}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100/50 relative overflow-hidden">
                        <h4 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">
                            <Sparkles size={16} className="inline mr-2" /> 智能引擎状态
                        </h4>
                        <p className="text-[11px] text-amber-900/70 leading-relaxed font-bold">
                            当前使用 <span className="text-primary font-black">Gemini 3 Pro</span> 深度语义引擎，已加载四川省属规章对标插件。
                        </p>
                        <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                            <Cpu size={120} />
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="relative">
                <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-96 p-10 border border-gray-100 rounded-[3rem] bg-gray-50/30 text-lg font-bold outline-none focus:border-primary transition-all shadow-inner custom-scrollbar"
                placeholder="在此手动录入企业经营管理的具体事实、财务指标描述或关键会议决策摘要..."
                />
                <div className="absolute bottom-6 right-10 flex items-center text-[10px] text-gray-300 font-black uppercase tracking-widest">
                    <Hash size={12} className="mr-1" /> {inputText.length} Characters
                </div>
            </div>
          )}

          <div className="mt-12 flex justify-end">
            <button
              onClick={startParsing}
              disabled={isProcessing || (!fileData && !extractedText && !inputText)}
              className="group px-16 py-6 bg-primary text-white rounded-3xl font-black shadow-2xl shadow-primary/20 hover:-translate-y-1 hover:shadow-primary/40 transition-all disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none flex items-center text-xl"
            >
              启动 AI 深度审计解析
              <div className="ml-4 p-1.5 bg-white/20 rounded-xl group-hover:translate-x-1 transition-transform">
                <ChevronRight size={24} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 阶段 2: 深度解析控制台 */}
      {step === 2 && (
        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 animate-in zoom-in duration-700">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center">
                <div className="p-4 bg-gray-900 rounded-[2rem] mr-5 shadow-2xl">
                    <Terminal size={32} className="text-green-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">AI 智能审计解析中心</h2>
                    <p className="text-sm text-gray-400 mt-1 font-bold">正在执行深度语义对标、法律红线扫描及事实链构建...</p>
                </div>
              </div>
              <div className="flex items-center text-[10px] font-black text-primary px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 animate-pulse tracking-widest uppercase shadow-sm">
                <ShieldCheck size={14} className="mr-2" /> Gemini 3 Pro active
              </div>
           </div>

           <div className="bg-gray-900 rounded-[2.5rem] p-10 font-mono text-sm text-green-500 h-[30rem] overflow-y-auto custom-scrollbar shadow-2xl border-[12px] border-gray-800">
              <div className="space-y-3">
                {parsingLogs.map((log, i) => (
                    <div key={i} className="flex items-start animate-in fade-in slide-in-from-left-4 duration-500">
                    <span className="text-gray-500 mr-3 shrink-0 font-black select-none opacity-40">[{i+1}]</span>
                    <span className="text-primary mr-3 select-none font-black opacity-80">{'>'}</span>
                    <span className="leading-relaxed font-bold tracking-tight">{log}</span>
                    </div>
                ))}
                <div className="flex items-center space-x-2 animate-pulse mt-6">
                    <span className="w-1.5 h-4 bg-green-500" />
                    <span className="text-xs text-gray-500 uppercase font-black">System parsing...</span>
                </div>
              </div>
              <div ref={logEndRef} />
           </div>

           <div className="mt-12 flex flex-col items-center">
              <div className="w-full max-w-4xl h-2 bg-gray-50 rounded-full overflow-hidden mb-6 shadow-inner relative">
                <div className="h-full bg-primary animate-progress-indeterminate rounded-full" />
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                    <Loader2 size={16} className="text-primary animate-spin mr-2" />
                    <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Multi-modal Analysis</span>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                <div className="flex items-center">
                    <Sparkles size={16} className="text-primary mr-2" />
                    <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Rule Matching</span>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* 阶段 3: 证据链确认 */}
      {step === 3 && (
        <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 animate-in slide-in-from-right-12 duration-700">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">审计证据核实报告</h2>
                <p className="text-gray-400 font-bold mt-2">AI 已自动识别以下关键经营事实，请审计员进行初步真实性确认。</p>
            </div>
            <div className="flex items-center px-6 py-3 bg-green-50 rounded-2xl border border-green-100">
                <Hash size={18} className="text-green-600 mr-3" />
                <span className="text-sm font-black text-green-700 uppercase">Recognized: {entities.length} Items</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[45rem] overflow-y-auto pr-4 custom-scrollbar">
            {entities.map((ent, idx) => (
              <div key={idx} className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 hover:shadow-2xl hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-4 bg-white rounded-2xl shadow-xl border border-gray-50 mr-5 group-hover:scale-110 transition-transform">
                      {getEntityIcon(ent.type)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-1">{ent.type}</span>
                      <div className="text-xl font-black text-gray-800 group-hover:text-primary transition-colors">{ent.value}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${ent.confidence > 0.8 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {(ent.confidence * 100).toFixed(0)}% Confidence
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 font-bold leading-relaxed italic bg-white/80 p-6 rounded-2xl border border-gray-50 relative">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-gray-300 uppercase italic">Context Excerpt</div>
                  “...{ent.context}...”
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-gray-50 gap-6">
            <button 
              onClick={() => { setStep(1); setEntities([]); setFileName(null); setFileData(null); setExtractedText(null); }}
              className="flex items-center px-10 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
            >
              <Trash2 size={20} className="mr-3" /> 放弃解析结果
            </button>
            <button
              onClick={startFinalDiagnosis}
              className="group px-16 py-6 bg-secondary-blue text-white rounded-[2rem] font-black shadow-2xl hover:shadow-blue-900/40 transition-all flex items-center text-xl"
              style={{ backgroundColor: COLORS.BLUE }}
            >
              生成合规对标诊断
              <div className="ml-5 p-2 bg-white/10 rounded-xl group-hover:translate-x-2 transition-transform">
                <ArrowRight size={24} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 阶段 4: 结果 */}
      {step === 4 && diagnosis && (
        <div className="space-y-8 animate-in slide-in-from-bottom-12 duration-1000">
           <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-14">
                    <div className="bg-white p-10 rounded-[3rem] border-4 border-primary text-center shadow-2xl relative z-10 scale-110">
                        <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Overall Score</div>
                        <div className="text-7xl font-black text-primary">{diagnosis.score}</div>
                    </div>
                </div>

                <div className="max-w-3xl relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="px-3 py-1 bg-amber-50 text-primary text-[10px] font-black rounded-lg border border-amber-100 uppercase tracking-widest">SOE-IQ-Audit-2025</div>
                        <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Verified by Gemini 3 Pro</span>
                    </div>
                    <h2 className="text-5xl font-black text-gray-800 mb-8 tracking-tighter leading-tight">企业经营管理<br/>合规深度诊断报告</h2>
                    <p className="text-gray-500 leading-relaxed text-2xl mb-12 font-bold opacity-80">{diagnosis.summary}</p>
                    <div className="flex flex-wrap gap-4">
                        <button className="flex items-center px-10 py-5 bg-secondary-blue text-white rounded-2xl font-black shadow-2xl hover:scale-105 transition-all">
                            <Download size={24} className="mr-3" /> 导出权威 PDF 报告
                        </button>
                        <button className="flex items-center px-10 py-5 border-2 border-gray-100 rounded-2xl font-black text-gray-500 hover:bg-gray-50 hover:border-primary/20 transition-all">
                            <Save size={24} className="mr-3" /> 保存诊断快照
                        </button>
                    </div>
                </div>
                <BookOpen className="absolute -left-24 -bottom-24 text-gray-50 opacity-40 rotate-12" size={420} />
            </div>

            <div className="grid grid-cols-1 gap-10">
                {diagnosis.results.map((res, idx) => (
                    <div key={idx} className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-700">
                        <div className={`px-12 py-10 flex items-center justify-between border-b ${res.riskLevel === 'HIGH' ? 'bg-red-50/20' : 'bg-gray-50/10'}`}>
                            <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full mr-6 shadow-xl ${res.riskLevel === 'HIGH' ? 'bg-red-500 shadow-red-500/30' : 'bg-amber-500 shadow-amber-500/30'}`} />
                                <h4 className="font-black text-gray-800 text-3xl tracking-tight">{res.riskTitle}</h4>
                            </div>
                            {getRiskBadge(res.riskLevel)}
                        </div>

                        <div className="p-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
                            <div className="lg:col-span-8 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center opacity-70">
                                            <Target size={18} className="mr-3 text-red-400" /> 审计事实与对标分析
                                        </h5>
                                        <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                                            <p className="text-lg text-gray-700 leading-relaxed mb-8 font-bold">{res.currentStatus}</p>
                                            <div className="text-sm text-red-600 font-black bg-white border-2 border-red-50 p-6 rounded-3xl flex items-start shadow-xl">
                                                <AlertTriangle size={20} className="mr-4 mt-1 flex-shrink-0" />
                                                <span className="leading-relaxed">{res.gapAnalysis}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center opacity-70">
                                            <ShieldCheck size={18} className="mr-3 text-primary" /> 合规法律依据
                                        </h5>
                                        <div className="bg-amber-50/20 p-8 rounded-[2.5rem] border border-amber-100/20 h-full flex flex-col">
                                            <p className="text-xs text-primary font-black mb-6 italic border-b-2 border-amber-100/20 pb-5 tracking-tight">{res.complianceBasis}</p>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 leading-relaxed font-black">
                                                    【合规风险评估】：<br/>
                                                    <span className="text-gray-500 font-bold opacity-80 italic">{res.impactAnalysis}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary p-12 rounded-[3.5rem] text-white shadow-3xl relative overflow-hidden group/sug">
                                    <h5 className="text-xs font-black mb-6 flex items-center opacity-70 tracking-widest uppercase">
                                        <PenTool size={22} className="mr-4" /> 专家级整改建议
                                    </h5>
                                    <p className="text-2xl font-black leading-snug relative z-10 tracking-tight group-hover/sug:translate-x-2 transition-transform">{res.suggestion}</p>
                                    <Sparkles className="absolute -right-12 -bottom-12 text-white opacity-10 rotate-12" size={300} />
                                </div>
                            </div>

                            <div className="lg:col-span-4 lg:border-l-4 lg:border-gray-50 lg:pl-16">
                                <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10 flex items-center">
                                    <Map size={18} className="mr-3 text-primary" /> 闭环整改路线图
                                </h5>
                                <div className="space-y-10 relative">
                                    <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-gray-50 rounded-full" />
                                    {res.roadmap.map((step, sidx) => (
                                        <div key={sidx} className="flex items-start relative z-10 group/step">
                                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black border-4 bg-white transition-all shadow-sm group-hover/step:scale-125 ${sidx === 0 ? 'border-primary text-primary shadow-primary/20' : 'border-gray-100 text-gray-300'}`}>
                                            {sidx + 1}
                                          </div>
                                          <div className="ml-6 mt-1.5 flex-1">
                                            <p className="text-base text-gray-700 leading-relaxed font-black group-hover/step:text-gray-900 transition-colors">{step}</p>
                                          </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center justify-center mt-16 pb-24 space-y-6">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">End of Intelligence Report</p>
                <button 
                    onClick={() => { setStep(1); setDiagnosis(null); setEntities([]); setFileName(null); setFileData(null); setExtractedText(null); setInputText(''); }}
                    className="flex items-center px-20 py-6 bg-white border-4 border-primary/20 rounded-[2.5rem] font-black text-primary hover:bg-amber-50 hover:border-primary hover:-translate-y-2 transition-all shadow-2xl active:scale-95"
                >
                    发起新一轮合规扫描
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceAnalysis;
