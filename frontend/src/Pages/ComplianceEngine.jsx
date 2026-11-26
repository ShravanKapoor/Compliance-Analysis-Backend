import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, FormControl, Grid, InputLabel, LinearProgress, Link, MenuItem, Select,
  Step, StepContent, StepLabel, Stepper, Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { useRunAnalysis } from "../hooks/useRunAnalysis";
import { useAuth } from "../context/AuthContext";
import FrameworkPicker from "../Components/FrameworkPicker";
import ReportsTable from "../Components/ReportsTable";
import { ErrorAlert, Page } from "../Components/common";

const HOW = [
  ["Select frameworks", "Active frameworks that cover products and one of the product's markets, or the ones you choose."],
  ["Gather evidence", "The product's profile and evidence items are split into passages and turned into embeddings."],
  ["Match", "Each control is paired with the closest evidence passages."],
  ["Assess", "With an Anthropic API key on the backend, Claude decides whether each control is met, partly met, not met or not applicable, and explains why. Without one, an evidence-match check is used and the report needs review."],
  ["Score", "A 0–100 score weighted by risk. Compliant means 80 or more with no mandatory control unmet."],
];

const ComplianceEngine = () => {
  const { user, isAdmin } = useAuth();
  const products = useApi(() => api.products());
  const frameworks = useApi(api.frameworks);
  const recent = useApi(() => api.reports());
  const [productId, setProductId] = useState("");
  const [selection, setSelection] = useState(null);
  const { run, running, error } = useRunAnalysis();

  const product = products.data?.find((p) => p._id === productId);
  const canRun = product && (isAdmin || String(product.createdBy) === String(user?.id));

  return (
    <Page>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Run an analysis</Typography>
              <ErrorAlert error={products.error || frameworks.error} />
              <Stepper orientation="vertical" nonLinear activeStep={-1}>
                <Step active expanded>
                  <StepLabel>Choose a product</StepLabel>
                  <StepContent>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <InputLabel id="engine-product">Product</InputLabel>
                      <Select labelId="engine-product" label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
                        {(products.data || []).map((p) => (
                          <MenuItem key={p._id} value={p._id}>
                            {p.productName}{p.company?.legalName ? ` · ${p.company.legalName}` : ""}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {products.data?.length === 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        No products yet. <Link component={RouterLink} to="/products">Add one</Link>.
                      </Typography>
                    )}
                    {product && !canRun && (
                      <Alert severity="info" sx={{ mt: 1 }}>Only the product&apos;s creator or an admin can run an analysis.</Alert>
                    )}
                    {product && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <Link component={RouterLink} to={`/products/${product._id}`}>Review its evidence</Link> before running.
                      </Typography>
                    )}
                  </StepContent>
                </Step>
                <Step active expanded>
                  <StepLabel>Choose frameworks</StepLabel>
                  <StepContent>
                    <FrameworkPicker frameworks={frameworks.data || []} value={selection} onChange={setSelection} />
                  </StepContent>
                </Step>
                <Step active expanded>
                  <StepLabel>Run</StepLabel>
                  <StepContent>
                    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      disabled={!canRun || running || (selection !== null && selection.length === 0)}
                      onClick={() => run(productId, selection)}
                    >
                      Run analysis
                    </Button>
                    {running && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Analysing… this can take a minute when many controls are reviewed.
                        </Typography>
                      </Box>
                    )}
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>How it works</Typography>
              <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
                {HOW.map(([title, text]) => (
                  <Box component="li" key={title} sx={{ mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                    <Typography variant="body2" color="text.secondary">{text}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>Recent analyses</Typography>
          <ErrorAlert error={recent.error} onRetry={recent.reload} />
          {recent.data?.length ? (
            <ReportsTable reports={recent.data.slice(0, 5)} />
          ) : (
            recent.data && <Typography color="text.secondary">None yet.</Typography>
          )}
        </Grid>
      </Grid>
    </Page>
  );
};

export default ComplianceEngine;
