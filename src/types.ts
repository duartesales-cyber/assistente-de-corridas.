/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AnalysisVerdict {
  GOOD = "GOOD",
  AVERAGE = "AVERAGE",
  POOR = "POOR"
}

export interface RideAnalysis {
  value: number;
  distance: number;
  duration?: number;
  perMile: number;
  verdict: AnalysisVerdict;
  service?: string;
  currency: string;
}

export interface AppState {
  isAnalyzing: boolean;
  result: RideAnalysis | null;
  error: string | null;
}
