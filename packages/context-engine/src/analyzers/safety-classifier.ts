// ============================================================
// @pgos/context-engine — Safety Classifier
// Classifies project source files into 4 safety zones based on testing risk.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { SafetyClassification, FileClassification } from '@pgos/core';

export function classifyFileSafety(
  mockRoot: string,
  files: ParsedFile[],
  criticalFilesList: string[] = []
): SafetyClassification {
  const safeFiles: FileClassification[] = [];
  const cautionFiles: FileClassification[] = [];
  const criticalFiles: FileClassification[] = [];
  const doNotModifyZones: FileClassification[] = [];

  for (const f of files) {
    const isCriticalInList = criticalFilesList.some(cf => f.path.includes(cf) || cf.includes(f.path));
    
    const classification: FileClassification = {
      path: f.path,
      zone: f.zone,
      reason: f.zoneReason,
      blastRadius: f.zone === 'critical' ? 7 : f.zone === 'caution' ? 3 : 0,
      requiredTests: f.zone === 'critical' ? ['unit', 'integration'] : f.zone === 'caution' ? ['unit'] : [],
      riskLevel: f.zone === 'critical' ? 'critical' : f.zone === 'caution' ? 'medium' : 'low',
    };

    if (isCriticalInList || f.zone === 'critical') {
      classification.zone = 'critical';
      classification.riskLevel = 'critical';
      classification.blastRadius = 8;
      classification.requiredTests = ['unit', 'integration'];
      criticalFiles.push(classification);
    } else if (f.zone === 'safe') {
      safeFiles.push(classification);
    } else {
      cautionFiles.push(classification);
    }
  }

  return {
    safeFiles,
    cautionFiles,
    criticalFiles,
    doNotModifyZones,
  };
}
