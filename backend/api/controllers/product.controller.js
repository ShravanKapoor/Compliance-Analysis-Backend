import { Product } from "../models/product.scheme.js";
import { Organization } from "../models/organization.schema.js";
import { BadRequest, isObjectId, isOwnerOrAdmin, parseJsonField } from "../../utils/requestHelpers.js";

const MAX_EVIDENCE_ITEMS = 50;
const MAX_EVIDENCE_CHARS = 20000;

/** Validate evidence items: [{ title?, content }] */
export const parseEvidence = (raw) => {
  const value = parseJsonField(raw, "evidence");
  if (value === undefined) return [];
  const items = Array.isArray(value) ? value : [value];
  if (items.length > MAX_EVIDENCE_ITEMS) throw new BadRequest(`At most ${MAX_EVIDENCE_ITEMS} evidence items per request`);
  return items.map((item, i) => {
    const content = typeof item?.content === "string" ? item.content.trim() : "";
    if (!content) throw new BadRequest(`evidence[${i}].content is required`);
    if (content.length > MAX_EVIDENCE_CHARS) {
      throw new BadRequest(`evidence[${i}].content is longer than ${MAX_EVIDENCE_CHARS} characters`);
    }
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 200) : undefined;
    return { title, content };
  });
};

const handleError = (res, err) =>
  err instanceof BadRequest || err.name === "ValidationError"
    ? res.status(400).json({ message: err.message })
    : res.status(500).json({ message: err.message });

const findActiveProduct = (id) => Product.findOne({ _id: id, isActive: true, deletedAt: null });

// POST /api/product/create  (JSON, or multipart with up to 5 "images")
export const createProduct = async (req, res, next) => {
  try {
    const { productName, productCode, description, productType, company } = req.body;
    if (!productName || !company) {
      return res.status(400).json({ message: "productName and company are required" });
    }
    if (!isObjectId(company)) {
      return res.status(400).json({ message: "company must be a valid id" });
    }
    const organization = await Organization.findOne({ _id: company, isActive: true, deletedAt: null });
    if (!organization) {
      return res.status(404).json({ message: "Company not found" });
    }

    // multer-storage-cloudinary puts the hosted URL in `path` and the Cloudinary public id in `filename`
    const images = (req.files || []).map((f) => ({ url: f.path, publicId: f.filename }));

    const product = await Product.create({
      productName,
      productCode,
      description,
      productType,
      company,
      images,
      regulatory: parseJsonField(req.body.regulatory, "regulatory"),
      evidence: parseEvidence(req.body.evidence),
      createdBy: req.user.id,
    });

    return res.status(201).json({ message: "Product created", data: product });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/product?company=<id>
export const getProducts = async (req, res, next) => {
  try {
    const filter = { isActive: true, deletedAt: null };
    if (req.query.company) {
      if (!isObjectId(req.query.company)) return res.status(400).json({ message: "company must be a valid id" });
      filter.company = req.query.company;
    }
    const products = await Product.find(filter).select("-evidence").sort({ createdAt: -1 });
    return res.status(200).json({ data: products });
  } catch (err) {
    return handleError(res, err);
  }
};

// GET /api/product/:id
export const getProduct = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product id" });
    const product = await findActiveProduct(req.params.id).populate("company", "legalName dbaName");
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ data: product });
  } catch (err) {
    return handleError(res, err);
  }
};

// POST /api/product/:id/evidence   body: { title?, content } or { evidence: [...] }
export const addEvidence = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product id" });
    const product = await findActiveProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!isOwnerOrAdmin(product, req.user)) return res.status(403).json({ message: "Access Denied" });

    const items = parseEvidence(req.body.evidence ?? req.body);
    if (product.evidence.length + items.length > 500) {
      return res.status(400).json({ message: "A product can have at most 500 evidence items" });
    }
    product.evidence.push(...items);
    await product.save();
    return res.status(201).json({ message: `${items.length} evidence item(s) added`, data: product.evidence });
  } catch (err) {
    return handleError(res, err);
  }
};

// DELETE /api/product/:id/evidence/:evidenceId
export const removeEvidence = async (req, res, next) => {
  try {
    const { id, evidenceId } = req.params;
    if (!isObjectId(id) || !isObjectId(evidenceId)) return res.status(400).json({ message: "Invalid id" });
    const product = await findActiveProduct(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!isOwnerOrAdmin(product, req.user)) return res.status(403).json({ message: "Access Denied" });
    const item = product.evidence.id(evidenceId);
    if (!item) return res.status(404).json({ message: "Evidence not found" });
    item.deleteOne();
    await product.save();
    return res.status(200).json({ message: "Evidence removed", data: product.evidence });
  } catch (err) {
    return handleError(res, err);
  }
};
