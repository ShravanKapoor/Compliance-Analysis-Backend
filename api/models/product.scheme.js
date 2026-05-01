import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    tags: [
      {
        label: String,
      },
    ],

    regulatory: {
      deviceClass: String,
      riskCategory: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      intendedUse: String,
      market: [String],
      approvals: [
        {
          authority: String,
          approvalNumber: String,
          approvalDate: Date,
        },
      ],
    },

    complianceStatus: {
      type: String,
      enum: ["draft", "under_review", "compliant", "non_compliant"],
      default: "draft",
    },

    complianceScore: {
      type: Number,
      default: 0,
    },

    vectorIndexed: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;