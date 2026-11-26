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
      createdBy,
      identifiers,
    } = req.body;

    if (!legalName || !dbaName) {
      return res.status(400).json({
        message: "LegalName & DbaName is required",
      });
    }

    const isCompanyExists = {
      $or:[{dbaName},{phoneNumber},{website}]
    }

    const isCompany = await Organization.findOne(isCompanyExists)
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
    const companies = await Organization.find()
    if(!companies || companies.length === 0){
      return res.status(400).json({
        message: "No Company availabe"
      })
    }
    return res.status(200).json({
      data: companies,
    });

  }catch(err){
    return res.status(500).json({
      message: err.message,
    })
  }
}