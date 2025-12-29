
import { GoogleGenAI, Type } from "@google/genai";
import { DiagnosisResult, RiskLevel, ExtractedEntity, ComplianceRule } from "../types";
import { MOCK_RULES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Intelligent Extraction Engine
 * Uses Gemini 3 Pro for complex document reasoning and cross-referencing.
 */
export const extractEntitiesFromDocument = async (
  input: string | { data: string; mimeType: string }
): Promise<ExtractedEntity[]> => {
  const parts: any[] = [];
  
  if (typeof input === 'string') {
    parts.push({ text: `分析以下文档内容，执行深度合规要素识别：\n${input.substring(0, 35000)}` });
  } else {
    parts.push({
      inlineData: {
        data: input.data,
        mimeType: input.mimeType
      }
    });
    parts.push({ text: "请作为国企高级合规官及法律审计专家，深度研读此文档。你需要识别出所有潜在的合规风险点、关键经营实体、财务数据、时间红线及核心合同条款。" });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...parts,
        {
          text: `
            【提取指令】
            请从提供的资料中精准提取并分类以下合规证据实体：

            1. ORG (组织与主体): 提取涉及的法人主体、子公司、分包商、关联方。特别注意提及的“四川东同建设集团”或“四川栎东公司”及其上下级关系。
            2. DATE (时间线): 关键的时间节点，如合同起止、项目周期、审计期限、决策会议日期。
            3. MONEY (财务数据): 涉及的具体金额、投资强度、研发投入、资产估值。标注其单位。
            4. CLAUSE (合规红线): 法律层面的约束性条款，如“禁止性规定”、“违约责任”、“董事会决策权限”、“一票否决权”等。
            5. METRIC (经营指标): 具体的KPI或监管指标，如“资产负债率”、“研发强度占比”、“能耗达标率”。

            【输出要求】
            - 返回格式：严格的 JSON 数组。
            - 包含字段：type (上述类别之一), value (提取的具体信息), context (包含该信息的原文段落，用于核查回溯), confidence (0.0-1.0的可信度评估)。
            - 深度要求：不要只做字面提取，要理解语义上的“约束”和“责任”。
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

  const text = response.text || "[]";
  return JSON.parse(text);
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
  const entitiesContext = confirmedEntities ? `【提取的审计事实记录】：\n${JSON.stringify(confirmedEntities)}` : "";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      你是一名服务于中国央国企（如四川东同集团、四川栎东公司）的合规风险管理专家。
      请根据提供的合规标准库和提取的事实证据，进行深度的对标诊断。
      
      【对标标准库】：
      ${rulesContext}
      
      【审计事实/证据】：
      ${entitiesContext}
      
      【补充提报信息】：
      ${userInput}
      
      【诊断工作指南】：
      1. 必须引用：每一个诊断项必须明确关联规则库中的 ID。
      2. 穿透分析：不仅指出违规，要分析违规对“国有资产安全”和“企业信用”的潜在影响。
      3. 风险定级：HIGH (直接违规且有法律后果), MEDIUM (程序瑕疵), LOW (管理建议)。
      4. 落地建议：建议应具备“可操作性”，例如具体的合同条款修改、内控流程嵌入点。
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
      请解读以下国资监管文件或企业内控办法，并结构化为规则条目。
      分类建议：'风险控制', '财务管理', '投资决策', '安全生产', '科技创新'。
      
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
