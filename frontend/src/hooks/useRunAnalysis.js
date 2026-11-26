import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@toolpad/core/useNotifications";
import { api } from "../api/api";

/** Runs an analysis and opens the resulting report. */
export function useRunAnalysis() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const run = async (productId, frameworkIds) => {
    setRunning(true);
    setError(null);
    try {
      const report = await api.analyze(productId, frameworkIds);
      notifications.show("Analysis complete", { severity: "success", autoHideDuration: 3000 });
      navigate(`/reports/${report._id}`);
      return report;
    } catch (err) {
      // 422 carries the reasons each framework was skipped
      const skipped = err.body?.skippedFrameworks;
      setError(
        skipped?.length
          ? `${err.message}: ${skipped.map((s) => `${s.shortCode} – ${s.reason}`).join("; ")}`
          : err.message,
      );
      return null;
    } finally {
      setRunning(false);
    }
  };

  return { run, running, error, clearError: () => setError(null) };
}
