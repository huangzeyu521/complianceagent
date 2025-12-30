

import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, RiskLevel, ExtractedEntity, ComplianceRule } from "../types";
import { MOCK_RULES } from "../constants";

/**
 * 内部辅助函数：获取 AI 实例
 * 仅在实际调用 API 时初始化，避免顶层初始化失败导致白屏
 */


// 找到这行或类似的
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);


// 修改为：
const API_KEY = "AIzaSyBx9yuY-D0QvvJiatH2T-DLXYOCFJfEeY0"; // 直接粘贴你的有效Key

if (!API_KEY) {
  throw new Error("检测到 API Key 尚未配置。");
}

export const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Intelligent Extraction Engine
 * Uses Gemini 3 Pro for complex document reasoning.
 */
export const extractEntitiesFromDocument = async (
  input: string | { data: string; mimeType: string }
): Promise<ExtractedEntity[]> => {
  const ai = getAIInstance();
  const parts: any[] = [];
  
  if (typeof input === 'string') {
    parts.push({ text: `分析以下文档文本内容并提取合规关键要素：\n${input.substring(0, 35000)}` });
  } else {
    parts.push({
      inlineData: {
        data: input.data,
        mimeType: input.mimeType
      }
    });
    parts.push({ text: "请作为专业的国企合规审查专家，深度研读此文件，提取与经营管理合规相关的关键实体、核心条款、风险数据点，特别是涉及“三重一大”决策和国有资产安全的内容。" });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...parts,
        {
          text: `
            【深度提取任务】
            请从文档中精准识别并分类以下合规要素：
            1. ORG (组织机构): 涉及的子公司、关联方、供应商、监管机构。
            2. DATE (时间节点): 合同签署/到期、审计期、会议日期。
            3. MONEY (财务金额): 交易金额、投资额、研发强度、评估价值。
            4. CLAUSE (核心条款): 法律红线、违约责任、一票否决权、排他性条款。
            5. METRIC (监管指标): 资产负债率、研发投入占比、能源消耗指标。
            6. DECISION (决策层级): 识别事项是否经过党委会、董事会或经理办公会，是否符合“三重一大”流程。
            7. RISK (潜在风险点): 文档中暗示的程序瑕疵、越权审批、利益冲突或国有资产流失隐患。

            【输出要求】
            1. 以 JSON 数组格式返回。
            2. 字段要求: type (大写枚举), value (具体事实), context (原文线索), confidence (0.0-1.0)。
            3. 重点挖掘文档中隐含的合规冲突。
          `
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 2000 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['ORG', 'DATE', 'MONEY', 'CLAUSE', 'METRIC', 'DECISION', 'RISK'] },
            value: { type: Type.STRING },
            context: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["type", "value", "context", "confidence"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

/**
 * Depth Compliance Diagnosis Engine
 */
export const performComplianceDiagnosis = async (
  userInput: string, 
  confirmedEntities?: ExtractedEntity[]
): Promise<{ 
  score: number, 
  summary: string, 
  riskHeatmap: { category: string, value: number }[],
  results: DiagnosisResult[] 
}> => {
  const ai = getAIInstance();
  const rulesContext = MOCK_RULES.map(r => `[${r.id}] ${r.title}: ${r.content}`).join("\n");
  const entitiesContext = confirmedEntities ? `【确认的审计事实证据】：\n${JSON.stringify(confirmedEntities)}` : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      你是一名服务于中国央国企的合规风险管理专家。请根据合规标准和提取的事实证据进行深度对标。
      
      【对标标准库】：
      ${rulesContext}
      
      【审计事实】：
      ${entitiesContext}
      
      【诊断要求】：
      1. 必须穿透分析：挖掘表面数据背后的程序违规。
      2. 风险定级：HIGH (严重违规), MEDIUM (瑕疵), LOW (建议)。
      3. 必须给出具体整改路线图。
    `,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          riskHeatmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          },
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                riskTitle: { type: Type.STRING },
                riskLevel: { type: Type.STRING, enum: Object.values(RiskLevel) },
                currentStatus: { type: Type.STRING },
                complianceBasis: { type: Type.STRING },
                gapAnalysis: { type: Type.STRING },
                impactAnalysis: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                roadmap: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["riskTitle", "riskLevel", "currentStatus", "complianceBasis", "gapAnalysis", "impactAnalysis", "suggestion", "roadmap"]
            }
          }
        },
        required: ["score", "summary", "riskHeatmap", "results"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * Intelligent Regulation Interpreter
 */
export const interpretComplianceDocument = async (text: string): Promise<ComplianceRule> => {
  const ai = getAIInstance();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      解读以下文件并结构化为规则条目。分类：'风险控制', '财务管理', '投资决策', '安全生产', '科技创新'。
      ${text.substring(0, 20000)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          source: { type: Type.STRING }
        },
        required: ["id", "category", "title", "content", "source"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
