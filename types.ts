export interface Detection {
  id: string;
  patternName: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  confidence: number;
  boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
  psychology: {
    bias: string;
    effect: string;
    emotion: string;
  };
  redesign: {
    suggestion: string;
    principle: string;
    impact: string;
  };
}

export interface AnalysisResult {
  overallTrustScore: number;
  darkPatternRiskScore: number;
  regulatoryRisks: string[];
  executiveSummary: string;
  detections: Detection[];
}

export interface ScanSession {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
  result: AnalysisResult | null;
  timestamp: number;
}