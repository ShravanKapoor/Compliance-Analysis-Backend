import { useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  IconButton, LinearProgress, Link, List, ListItem, ListItemText, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useDialogs } from "@toolpad/core/useDialogs";
import { useNotifications } from "@toolpad/core/useNotifications";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { useRunAnalysis } from "../hooks/useRunAnalysis";
import { useAuth } from "../context/AuthContext";
import FrameworkPicker from "../Components/FrameworkPicker";
import { EmptyState, ErrorAlert, Loading, Page, ScoreMeter, StatusChip } from "../Components/common";
import { PRODUCT_TYPES, RISK_LABEL, formatDate } from "../utils/format";
import ReportsTable from "../Components/ReportsTable";

function Detail({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography component="div">{children || "—"}</Typography>
    </Box>
  );
}

export function RunAnalysisDialog({ open, onClose, product }) {
  const frameworks = useApi(api.frameworks);
  const [selection, setSelection] = useState(null);
  const { run, running, error } = useRunAnalysis();

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Run compliance analysis</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Check <strong>{product.productName}</strong> against:
        </Typography>
        <ErrorAlert error={frameworks.error} />
        <FrameworkPicker frameworks={frameworks.data || []} value={selection} onChange={setSelection} />
        {product.evidence?.length === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This product has no evidence yet, so every control will come out as a gap.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {running && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Analysing… this can take a minute when many controls are reviewed.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={running}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled={running || (selection !== null && selection.length === 0)}
          onClick={() => run(product._id, selection)}
        >
          Run analysis
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EvidenceCard({ product, canEdit, onChange }) {
  const [form, setForm] = useState({ title: "", content: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dialogs = useDialogs();
  const notifications = useNotifications();

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const evidence = await api.addEvidence(product._id, [form]);
      setForm({ title: "", content: "" });
      onChange(evidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    const ok = await dialogs.confirm(`Remove "${item.title || "this evidence"}"?`, { okText: "Remove", severity: "error" });
    if (!ok) return;
    try {
      onChange(await api.removeEvidence(product._id, item._id));
    } catch (err) {
      notifications.show(err.message, { severity: "error" });
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Evidence</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Statements and documents showing how the product meets requirements: test reports, procedures,
          certifications. The compliance engine compares these with each framework control.
        </Typography>
        {product.evidence.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>No evidence yet.</Alert>
        ) : (
          <List disablePadding sx={{ mb: 2 }}>
            {product.evidence.map((item) => (
              <ListItem
                key={item._id}
                divider
                alignItems="flex-start"
                secondaryAction={
                  canEdit && (
                    <Tooltip title="Remove">
                      <IconButton edge="end" aria-label={`Remove ${item.title || "evidence"}`} onClick={() => remove(item)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                <ListItemText
                  primary={item.title || "Untitled evidence"}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" sx={{ display: "block", whiteSpace: "pre-wrap" }}>
                        {item.content}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.secondary">
                        Added {formatDate(item.addedAt)}
                      </Typography>
                    </>
                  }
                  slotProps={{ primary: { sx: { fontWeight: 600 } }, secondary: { component: "div" } }}
                />
              </ListItem>
            ))}
          </List>
        )}
        {canEdit && (
          <Stack component="form" spacing={1.5} onSubmit={add}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField size="small" label="Title" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. Penetration test report PT-2026-03" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField
              size="small" multiline minRows={3} required label="What it shows"
              value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <Box>
              <Button type="submit" variant="outlined" disabled={busy || !form.content.trim()}>
                {busy ? "Adding…" : "Add evidence"}
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

const ProductDetail = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const product = useApi(() => api.product(id), [id]);
  const reports = useApi(() => api.reports(id), [id]);
  const [runOpen, setRunOpen] = useState(false);

  if (product.loading && !product.data) return <Page title="Product"><Loading /></Page>;
  if (product.error) {
    return (
      <Page title="Product" breadcrumbs={[{ title: "Products", path: "/products" }]}>
        <ErrorAlert error={product.error} onRetry={product.error.status !== 404 ? product.reload : undefined} />
      </Page>
    );
  }
  const p = product.data;
  const canEdit = isAdmin || String(p.createdBy) === String(user?.id);
  const r = p.regulatory || {};

  return (
    <Page
      title={p.productName}
      breadcrumbs={[{ title: "Products", path: "/products" }, { title: p.productName }]}
      actions={
        canEdit && (
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setRunOpen(true)}>
            Run analysis
          </Button>
        )
      }
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Compliance</Typography>
                <Stack spacing={2}>
                  <Box><StatusChip status={p.complianceStatus} size="medium" /></Box>
                  {p.lastAnalyzedAt ? (
                    <>
                      <ScoreMeter score={p.complianceScore} label="Latest score" />
                      <Typography variant="body2" color="text.secondary">
                        Analysed {formatDate(p.lastAnalyzedAt)}
                        {p.lastReport && (
                          <>
                            {" · "}
                            <Link component={RouterLink} to={`/reports/${p.lastReport}`}>View report</Link>
                          </>
                        )}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Not analysed yet.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Details</Typography>
                <Detail label="Organization">{p.company?.legalName}</Detail>
                <Detail label="Product code">{p.productCode}</Detail>
                <Detail label="Type">{PRODUCT_TYPES[p.productType]}</Detail>
                <Detail label="Description">{p.description}</Detail>
                <Detail label="Intended use">{r.intendedUse}</Detail>
                <Detail label="Device class">{r.deviceClass}</Detail>
                <Detail label="Risk category">{RISK_LABEL[r.riskCategory]}</Detail>
                <Detail label="Markets">
                  {r.market?.length ? (
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap", mt: 0.5 }}>
                      {r.market.map((m) => <Chip key={m} size="small" label={m} />)}
                    </Stack>
                  ) : null}
                </Detail>
                {p.images?.length > 0 && (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {p.images.map((img) => (
                      <Box
                        key={img.publicId || img.url}
                        component="a" href={img.url} target="_blank" rel="noopener noreferrer"
                        sx={{ width: 72, height: 72, borderRadius: 1, overflow: "hidden", border: 1, borderColor: "divider" }}
                      >
                        <Box component="img" src={img.url} alt={p.productName} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2}>
            <EvidenceCard product={p} canEdit={canEdit} onChange={(evidence) => product.setData({ ...p, evidence })} />
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Analysis history</Typography>
                <ErrorAlert error={reports.error} onRetry={reports.reload} />
                {reports.data?.length === 0 ? (
                  <EmptyState title="No analyses yet" text="Run an analysis to see how this product measures up." />
                ) : reports.data ? (
                  <ReportsTable reports={reports.data} hideProduct />
                ) : (
                  <Loading />
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {runOpen && <RunAnalysisDialog open onClose={() => setRunOpen(false)} product={p} />}
    </Page>
  );
};

export default ProductDetail;
