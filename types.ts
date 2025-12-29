
export enum RiskLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface ComplianceRule {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
}

export interface ExtractedEntity {
  type: 'ORG' | 'DATE' | 'MONEY' | 'CLAUSE' | 'METRIC' | 'DECISION' | 'RISK';
  value: string;
  context: string;
  confidence: number;
}

export interface DiagnosisResult {
  riskTitle: string;
  riskLevel: RiskLevel;
  currentStatus: string;
  complianceBasis: string;
  gapAnalysis: string;
  suggestion: string;
  impactAnalysis: string;
  roadmap: string[];
}

export interface ComplianceReport {
  id: string;
  enterpriseName: string;
  date: string;
  overallScore: number;
  summary: string;
  results: DiagnosisResult[];
  riskHeatmap: { category: string, value: number }[];
  entities: ExtractedEntity[];
}

export interface AnalysisVersion {
  id: string;
  timestamp: string;
  fileName?: string;
  status: 'pending' | 'completed' | 'failed';
  reportId?: string;
}
