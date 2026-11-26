import { Product } from "../models/product.scheme.js";
import { Framework } from "../models/framework.schema.js";
import { ComplianceReport } from "../models/complianceReport.schema.js";
import { embedTexts } from "../../utils/embeddings.js";
import { getControlVectors } from "../../services/vectorStore.js";
import { isQdrantConfigured } from "../../config/qdrant.js";
import {
  createAssessor,
  runComplianceAnalysis,
  selectApplicableFrameworks,
} from "../../services/compliance/index.js";
import { isObjectId, isOwnerOrAdmin } from "../../utils/requestHelpers.js";

/** Errors from the embedding service or Qdrant: reported as 502, not as our bug. */
class UpstreamError extends Error {}
const upstream = (label, fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    throw new UpstreamError(`${label}: ${err.message}`);
  }
};

const markIndexed = (frameworkId) =>
  Framework.updateOne({ _id: frameworkId }, { vectorIndexed: true, indexedAt: new Date() });

// POST /api/compliance/analyze/:productId   body: { frameworkIds?: string[] }
export const analyzeProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!isObjectId(productId)) return res.status(400).json({ message: "Invalid product id" });

    const frameworkIds = req.body?.frameworkIds;
    if (frameworkIds !== undefined && (!Array.isArray(frameworkIds) || !frameworkIds.every(isObjectId))) {
      return res.status(400).json({ message: "frameworkIds must be an array of framework ids" });
    }

    const product = await Product.findOne({ _id: productId, isActive: true, deletedAt: null });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!isOwnerOrAdmin(product, req.user)) return res.status(403).json({ message: "Access Denied" });

    const frameworks = await Framework.find(frameworkIds?.length ? { _id: { $in: frameworkIds } } : { isActive: true });
    if (frameworkIds?.length && frameworks.length !== new Set(frameworkIds).size) {
      return res.status(404).json({ message: "One or more frameworks were not found" });
    }

    const { selected, skipped } = selectApplicableFrameworks(frameworks, product, { frameworkIds });
    const skippedFrameworks = skipped.map(({ framework, reason }) => ({
      framework: framework._id,
      name: framework.name,
      shortCode: framework.shortCode,
      reason,
    }));
    if (selected.length === 0) {
      return res.status(422).json({ message: "No applicable frameworks to check this product against", skippedFrameworks });
    }

    const embed = upstream("Embedding service", embedTexts);
    const result = await runComplianceAnalysis({
      product: product.toObject(),
      frameworks: selected.map((f) => f.toObject()),
      embedTexts: embed,
      getControlVectors: upstream("Vector store", async (framework) => {
        const out = await getControlVectors(framework, { embedTexts: embed });
        if (out.reindexed && isQdrantConfigured()) await markIndexed(framework._id);
        return out;
      }),
      assessor: createAssessor(),
    });

    const report = await ComplianceReport.create({
      ...result,
      product: product._id,
      company: product.company,
      createdBy: req.user.id,
      skippedFrameworks,
    });

    product.complianceScore = result.overallScore ?? 0;
    product.complianceStatus = result.status;
    product.lastAnalyzedAt = report.createdAt;
    product.lastReport = report._id;
    await product.save();

    return res.status(201).json({ message: "Analysis complete", data: report });
  } catch (err) {
    if (err instanceof UpstreamError) return res.status(502).json({ message: err.message });
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/compliance/reports?productId=<id>   (summaries, newest first)
export const getReports = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.productId) {
      if (!isObjectId(req.query.productId)) return res.status(400).json({ message: "Invalid product id" });
      filter.product = req.query.productId;
    }
    const reports = await ComplianceReport.find(filter)
      .select("-frameworks.controls")
      .populate("product", "productName productCode")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ data: reports });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/compliance/reports/:id   (full report with every control)
export const getReport = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid report id" });
    const report = await ComplianceReport.findById(req.params.id).populate("product", "productName productCode");
    if (!report) return res.status(404).json({ message: "Report not found" });
    return res.status(200).json({ data: report });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
