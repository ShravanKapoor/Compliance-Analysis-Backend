import mongoose from "mongoose";

const STATUSES = ["met", "partial", "not_met", "not_applicable"];

const controlResultSchema = new mongoose.Schema(
  {
    controlKey: String,
    controlId: String,
    title: String,
    riskLevel: String,
    mandatory: Boolean,
    status: { type: String, enum: STATUSES },
    rationale: String,
    remediation: String,
    assessedBy: { type: String, enum: ["claude", "similarity"] },
    evidence: [
      {
        _id: false,
        chunkId: String,
        source: String,
        excerpt: String,
        similarity: Number,
      },
    ],
  },
  { _id: false },
);

const complianceReportSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },

    // "claude": Claude judged each control. "similarity": evidence-similarity
    // fallback, which only shows whether matching evidence exists.
    method: { type: String, enum: ["claude", "similarity"], required: true },
    model: String,

    overallScore: Number, // 0-100, null when no control applied
    status: { type: String, enum: ["compliant", "non_compliant", "under_review"], required: true },

    frameworks: [
      {
        _id: false,
        framework: { type: mongoose.Schema.Types.ObjectId, ref: "Framework" },
        name: String,
        shortCode: String,
        version: String,
        score: Number,
        counts: { met: Number, partial: Number, not_met: Number, not_applicable: Number },
        controls: [controlResultSchema],
      },
    ],
    skippedFrameworks: [
      {
        _id: false,
        framework: { type: mongoose.Schema.Types.ObjectId, ref: "Framework" },
        name: String,
        shortCode: String,
        reason: String,
      },
    ],
    gaps: [
      {
        _id: false,
        frameworkShortCode: String,
        controlKey: String,
        controlId: String,
        title: String,
        status: String,
        riskLevel: String,
        mandatory: Boolean,
        remediation: String,
      },
    ],
    notes: [String],
  },
  { timestamps: true },
);

export const ComplianceReport = mongoose.model("ComplianceReport", complianceReportSchema);
