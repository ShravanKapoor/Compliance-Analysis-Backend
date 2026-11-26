/**
 * Chunks a MongoDB Framework document into smaller, precise pieces for vectorization.
 * In compliance analysis, the best way to chunk is by individual "Controls".
 *
 * Each chunk has a `controlKey` (the control's Mongo _id) that stays stable
 * even if the human-readable controlId is missing or duplicated.
 *
 * @param {Object} framework - The mongoose Framework document (or plain object)
 * @returns {Array<Object>} - An array of chunk objects containing the text and metadata
 */
export const controlKeyOf = (control, index) =>
  control._id ? control._id.toString() : `${control.controlId || "control"}#${index}`;

export const controlText = (framework, control) =>
  `Framework: ${framework.name} (${framework.shortCode})
Control ID: ${control.controlId || "N/A"} - ${control.title || "Untitled"}
Requirement: ${control.requirementText || "N/A"}
Description: ${control.description || "N/A"}
Risk Level: ${control.riskLevel || "medium"}
Mandatory: ${control.mandatory === false ? "No" : "Yes"}
Tags: ${control.tags && control.tags.length > 0 ? control.tags.join(", ") : "None"}`;

export const chunkFramework = (framework) => {
  const chunks = [];

  // If the framework has no controls, we can just vectorize its general description
  if (!framework.controls || framework.controls.length === 0) {
    const text = `Framework: ${framework.name} (${framework.shortCode})
Description: ${framework.description || "No description provided."}
Authority: ${framework.authority || "N/A"}`;

    chunks.push({
      text,
      metadata: {
        frameworkId: framework._id.toString(),
        frameworkUuid: framework.uuid,
        frameworkName: framework.name,
        shortCode: framework.shortCode,
        isGeneralDescription: true,
      },
    });
    return chunks;
  }

  // Iterate over every control and make it a dedicated chunk
  framework.controls.forEach((control, index) => {
    chunks.push({
      text: controlText(framework, control), // This is what we send to Hugging Face
      metadata: {
        // This is what we save in Qdrant as the Payload
        frameworkId: framework._id.toString(),
        frameworkUuid: framework.uuid,
        frameworkName: framework.name,
        shortCode: framework.shortCode,
        controlKey: controlKeyOf(control, index),
        controlId: control.controlId,
        controlTitle: control.title,
        riskLevel: control.riskLevel,
        isMandatory: control.mandatory !== false,
      },
    });
  });

  return chunks;
};
