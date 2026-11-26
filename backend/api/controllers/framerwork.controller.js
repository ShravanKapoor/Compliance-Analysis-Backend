import { Framework } from "../models/framework.schema.js";

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

    return res.status(201).json({
      data: framework,
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