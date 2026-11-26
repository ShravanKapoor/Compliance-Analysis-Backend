import { Framework } from "../models/framework.schema.js";
import { indexFramework } from "../../services/vectorStore.js";
import { embedTexts } from "../../utils/embeddings.js";
import { isQdrantConfigured } from "../../config/qdrant.js";
import { isObjectId } from "../../utils/requestHelpers.js";

// Store the framework's control vectors in Qdrant so analyses don't have to
// re-embed them. A failure here doesn't fail the request: the compliance
// engine indexes the framework on first use.
const tryIndex = async (framework) => {
  if (!isQdrantConfigured()) return { indexed: false, reason: "QDRANT_URL not set; controls are embedded during analysis" };
  try {
    await indexFramework(framework, { embedTexts });
    framework.vectorIndexed = true;
    framework.indexedAt = new Date();
    await framework.save();
    return { indexed: true };
  } catch (err) {
    console.error(`Indexing framework ${framework.shortCode} failed:`, err.message);
    return { indexed: false, reason: err.message };
  }
};

export const createFrameWork = async (req, res, next) => {
  try {
    const {
      name,
      shortCode,
      description,
      authority,
      country,
      version,
      industry,
      appliesTo,
      controls,
    } = req.body;

    if (
      !name ||
      !shortCode ||
      !description ||
      !authority ||
      !country ||
      !industry ||
      !controls ||
      !appliesTo
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // shortCode is the unique identifier. (Checking `version` as well wrongly
    // treated any two frameworks with the same version number as duplicates.)
    const IsframeworkExist = await Framework.findOne({
      shortCode: shortCode.toUpperCase().trim(),
    });
    if (IsframeworkExist) {
      return res.status(400).json({
        message: "Framework is already exist",
      });
    }

    const framework = await Framework.create({
      name,
      shortCode,
      description,
      version,
      authority,
      country,
      industry,
      controls,
      appliesTo,
      createdBy: req.user.id,
    });

    const indexing = await tryIndex(framework);

    return res.status(201).json({
      data: framework,
      indexing,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// Get Request 

export const getFramework = async (req, res, next) => {
  try {
    // Field is `isActive`; the old `isactive` filter matched nothing.
    // An empty list is a normal result, not an error.
    const framework = await Framework.find({ isActive: true });
    return res.status(200).json({
      data: framework,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

// POST /api/framework/:id/index  (admin) - re-embed and store a framework's controls
export const reindexFramework = async (req, res, next) => {
  try {
    if (!isQdrantConfigured()) {
      return res.status(400).json({ message: "Qdrant is not configured (QDRANT_URL)" });
    }
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid framework id" });
    const framework = await Framework.findById(req.params.id);
    if (!framework) return res.status(404).json({ message: "Framework not found" });
    const indexing = await tryIndex(framework);
    return res.status(indexing.indexed ? 200 : 502).json({ data: framework, indexing });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
