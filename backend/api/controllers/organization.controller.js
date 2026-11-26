import { Organization } from "../models/organization.schema.js";

export const createOrganization = async (req, res, next) => {
  try {
    const {
      legalName,
      dbaName,
      address,
      primaryContact,
      phoneNumber,
      website,
      identifiers,
    } = req.body;

    if (!legalName || !dbaName) {
      return res.status(400).json({
        message: "LegalName & DbaName is required",
      });
    }

    // Only compare fields that were actually sent. Including missing ones
    // ({ website: undefined }) matched every company without a website,
    // so a second company without one was rejected as a duplicate.
    const duplicateChecks = [{ dbaName }];
    if (phoneNumber) duplicateChecks.push({ phoneNumber });
    if (website) duplicateChecks.push({ website });

    const isCompany = await Organization.findOne({ $or: duplicateChecks })
    if(isCompany){
      return res.status(400).json({
        message:"Company already Exists",
      })
    }

    const organization = await Organization.create({
      legalName,
      dbaName,
      address,
      primaryContact,
      phoneNumber,
      website,
      identifiers,
      createdBy: req.user.id,
    });
    return res.status(201).json({
      message: " organization create successfully",
      data: organization,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};



export const getAllCompanies = async (req, res, next) => {
  try{
    // Skip soft-deleted / deactivated companies. An empty list is a normal
    // result, not an error.
    const companies = await Organization.find({ isActive: true, deletedAt: null })
    return res.status(200).json({
      data: companies,
    });

  }catch(err){
    return res.status(500).json({
      message: err.message,
    })
  }
}