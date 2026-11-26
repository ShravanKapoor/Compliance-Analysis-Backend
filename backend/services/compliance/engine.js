// The compliance engine: compares a product's evidence with the controls of
// each applicable framework and produces a scored report.
//
// It works on plain objects and takes its I/O (embedding, vector lookup,
// assessor) as arguments, so it can be tested without a database or network.
import { buildEvidenceChunks } from "./evidence.js";
import { matchControls } from "./matching.js";
import { collectGaps, countStatuses, deriveStatus, scoreControls } from "./scoring.js";
import { controlKeyOf } from "../../utils/chunking.js";

/**
 * @param {Object} args
 * @param {Object} args.product
 * @param {Array}  args.frameworks           frameworks to check (already selected)
 * @param {(texts: string[]) => Promise<number[][]>} args.embedTexts
 * @param {(framework) => Promise<{entries: Array<{controlKey, vector}>}>} args.getControlVectors
 * @param {{method: string, model: string|null, assess: Function}} args.assessor
 */
export const runComplianceAnalysis = async ({ product, frameworks, embedTexts, getControlVectors, assessor }) => {
  const notes = [];
  const chunks = buildEvidenceChunks(product);
  const vectors = await embedTexts(chunks.map((c) => c.text));
  const evidence = chunks.map((c, i) => ({ ...c, vector: vectors[i] }));
  if (evidence.length === 1) {
    notes.push("The product has no evidence items; only its profile was compared with the controls. Add evidence to get meaningful results.");
  }
  const evidenceById = new Map(evidence.map((e) => [e.id, e]));

  const frameworkResults = [];
  for (const framework of frameworks) {
    const { entries } = await getControlVectors(framework);
    const vectorByKey = new Map(entries.map((e) => [e.controlKey, e.vector]));
    const controls = framework.controls.map((c, i) => ({
      controlKey: controlKeyOf(c, i),
      controlId: c.controlId,
      title: c.title,
      requirementText: c.requirementText,
      description: c.description,
      riskLevel: c.riskLevel || "medium",
      mandatory: c.mandatory !== false,
    }));
    const matches = matchControls(
      controls.map((c) => ({ controlKey: c.controlKey, vector: vectorByKey.get(c.controlKey) })),
      evidence,
    );
    controls.forEach((c) => (c.matches = matches.get(c.controlKey)));

    const { results, notes: assessorNotes } = await assessor.assess({ product, framework, controls, evidence });
    notes.push(...assessorNotes);
    const resultByKey = new Map(results.map((r) => [r.controlKey, r]));

    const controlResults = controls.map((c) => {
      const r = resultByKey.get(c.controlKey);
      return {
        controlKey: c.controlKey,
        controlId: c.controlId,
        title: c.title,
        riskLevel: c.riskLevel,
        mandatory: c.mandatory,
        status: r.status,
        rationale: r.rationale,
        remediation: r.remediation || "",
        assessedBy: r.assessedBy || assessor.method,
        evidence: (r.evidenceIds.length ? r.evidenceIds : c.matches.slice(0, 1).map((m) => m.chunkId))
          .map((id) => {
            const e = evidenceById.get(id);
            const m = c.matches.find((x) => x.chunkId === id);
            return e && { chunkId: id, source: e.source, excerpt: e.text.slice(0, 300), similarity: m ? Number(m.score.toFixed(3)) : null };
          })
          .filter(Boolean),
      };
    });

    frameworkResults.push({
      framework: framework._id,
      name: framework.name,
      shortCode: framework.shortCode,
      version: framework.version,
      score: scoreControls(controlResults),
      counts: countStatuses(controlResults),
      controls: controlResults,
    });
  }

  const allControls = frameworkResults.flatMap((f) => f.controls);
  const overallScore = scoreControls(allControls);
  return {
    method: assessor.method,
    model: assessor.model,
    overallScore,
    status: deriveStatus({ method: assessor.method, score: overallScore, controls: allControls }),
    frameworks: frameworkResults,
    gaps: collectGaps(frameworkResults),
    notes,
  };
};
