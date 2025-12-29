
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, RiskLevel, ExtractedEntity, ComplianceRule } from "../types";
import { MOCK_RULES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Intelligent Extraction Engine
 * Uses Gemini 3 Pro for complex document reasoning.
 */
export const extractEntitiesFromDocument = async (
  input: string | { data: string; mimeType: string }
): Promise<ExtractedEntity[]> => {
  const parts: any[] = [];
  
  if (typeof input === 'string') {
    parts.push({ text: `分析以下文档文本内容并提取合规关键要素：\n${input.substring(0, 30000)}` });
  } else {
    parts.push({
      inlineData: {
        data: input.data,
        mimeType: input.mimeType
      }
    });
    parts.push({ text: "请作为专业的国企合规审查专家，研读此文件，提取与经营管理合规相关的关键实体、核心条款和风险数据点。" });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded for high-quality extraction
    contents: {
      parts: [
        ...parts,
        {
          text: `
            【提取任务】
            请从文档中精准识别并分类以下合规要素：
            1. ORG (组织机构): 涉及的子公司、上级集团（如东同集团）、外部供应商、监管机构、控股关联方等。
            2. DATE (时间节点): 合同签署/到期日、项目起止时间、审计报告期、重大决策会议日期。
            3. MONEY (财务金额): 主营收入金额、单笔投资额、研发经费投入、资产重组估值、分包合同金额等。
            4. CLAUSE (核心条款): 法律红线条款、一票否决权、分包限制、违约惩罚机制、廉洁协议条款、保密义务。
            5. METRIC (监管指标): 研发投入强度(%)、资产负债率(%)、国有资产保值增值率、能源消耗定额指标。

            【输出要求】
            1. 以 JSON 数组格式返回。
            2. 必须包含字段: 
               - type: 指定的类别名。
               - value: 提取的具体值或短句。
               - context: 包含该要素的原文上下文片段（用于审计回溯）。
               - confidence: 提取的可信度分数 (0.0 到 1.0)。
            3. 确保提取的内容对国企经营管理具有合规性判断价值。
          `
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['ORG', 'DATE', 'MONEY', 'CLAUSE', 'METRIC'] },
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
  const rulesContext = MOCK_RULES.map(r => `[${r.id}] ${r.title}: ${r.content}`).join("\n");
  const entitiesContext = confirmedEntities ? `【确认的审计事实证据】：\n${JSON.stringify(confirmedEntities)}` : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      你是一名服务于中国央国企（如四川东同集团、四川栎东公司）的合规风险管理专家及法律顾问。
      请根据提供的合规标准和提取的事实证据，进行深度对标诊断。
      
      【权威对标标准库】：
      ${rulesContext}
      
      【审计事实/提取数据】：
      ${entitiesContext}
      
      【用户补充提报信息】：
      ${userInput}
      
      【诊断工作要求】：
      1. 关联规则：每一项诊断结果必须明确指向标准库中的具体规则 ID。
      2. 差距量化：如果涉及比例或金额，必须根据事实计算出与合规标准的具体偏差。
      3. 风险评估：划分为 HIGH（严重违规，影响国有资产安全或法律责任）、MEDIUM（程序不规范）、LOW（优化建议）。
      4. 穿透建议：建议必须具体、可执行，包含具体的规章制度完善路径、合同条款修订建议或内控流程嵌入点。
    `,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 }, // Increased budget for complex legal reasoning
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      请深度解读以下国资监管文件或企业内控办法，并将其结构化为规则条目。
      分类范畴：'风险控制', '财务管理', '投资决策', '安全生产', '科技创新'。
      
      解析内容：
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
