import { useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormGroup, Grid, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SyncIcon from "@mui/icons-material/Sync";
import { useNotifications } from "@toolpad/core/useNotifications";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { EmptyState, ErrorAlert, Loading, Page } from "../Components/common";
import { RISK_LABEL, formatDate, plural } from "../utils/format";

const newControl = () => ({ controlId: "", title: "", requirementText: "", description: "", riskLevel: "medium", mandatory: true, tags: "" });
const EMPTY = {
  name: "", shortCode: "", version: "1.0", authority: "", country: "", industry: "", description: "",
  appliesTo: ["product"], controls: [newControl()],
};

function FrameworkDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setControl = (i, key, value) =>
    setForm({ ...form, controls: form.controls.map((c, j) => (j === i ? { ...c, [key]: value } : c)) });
  const toggleApplies = (v) =>
    setForm({ ...form, appliesTo: form.appliesTo.includes(v) ? form.appliesTo.filter((x) => x !== v) : [...form.appliesTo, v] });

  const submit = async (e) => {
    e.preventDefault();
    if (form.appliesTo.length === 0) return setError("Choose what the framework applies to");
    setBusy(true);
    setError(null);
    try {
      const res = await api.createFramework({
        ...form,
        controls: form.controls.map((c) => ({
          ...c,
          tags: c.tags.split(",").map((t) => t.trim()).filter(Boolean),
        })),
      });
      setForm(EMPTY);
      onCreated(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" component="form" onSubmit={submit}>
      <DialogTitle>Add framework</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" required autoFocus label="Name" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. Medical Device Software" value={form.name} onChange={set("name")} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" required label="Short code" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. IEC62304" value={form.shortCode} onChange={set("shortCode")} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" label="Version" value={form.version} onChange={set("version")} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" required label="Authority" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. FDA" value={form.authority} onChange={set("authority")} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" required label="Country / market" helperText="Use “Global” for every market" value={form.country} onChange={set("country")} /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" required label="Industry" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. Healthcare" value={form.industry} onChange={set("industry")} /></Grid>
          <Grid size={12}><TextField fullWidth size="small" required multiline minRows={2} label="Description" value={form.description} onChange={set("description")} /></Grid>
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary">Applies to</Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox checked={form.appliesTo.includes("product")} onChange={() => toggleApplies("product")} />} label="Products" />
              <FormControlLabel control={<Checkbox checked={form.appliesTo.includes("company")} onChange={() => toggleApplies("company")} />} label="Companies" />
            </FormGroup>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Controls ({form.controls.length})</Typography>
        <Stack spacing={2}>
          {form.controls.map((c, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 3 }}><TextField fullWidth size="small" required label="Control ID" value={c.controlId} onChange={(e) => setControl(i, "controlId", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField fullWidth size="small" required label="Title" value={c.title} onChange={(e) => setControl(i, "title", e.target.value)} />
                    <Tooltip title="Remove control">
                      <span>
                        <IconButton aria-label={`Remove control ${i + 1}`} disabled={form.controls.length === 1} onClick={() => setForm({ ...form, controls: form.controls.filter((_, j) => j !== i) })}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Grid>
                <Grid size={12}><TextField fullWidth size="small" required multiline label="Requirement" value={c.requirementText} onChange={(e) => setControl(i, "requirementText", e.target.value)} /></Grid>
                <Grid size={12}><TextField fullWidth size="small" multiline label="Guidance (optional)" value={c.description} onChange={(e) => setControl(i, "description", e.target.value)} /></Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`risk-${i}`}>Risk</InputLabel>
                    <Select labelId={`risk-${i}`} label="Risk" value={c.riskLevel} onChange={(e) => setControl(i, "riskLevel", e.target.value)}>
                      {["low", "medium", "high"].map((r) => <MenuItem key={r} value={r}>{RISK_LABEL[r]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FormControlLabel control={<Checkbox checked={c.mandatory} onChange={(e) => setControl(i, "mandatory", e.target.checked)} />} label="Mandatory" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="Tags" slotProps={{ inputLabel: { shrink: true } }} placeholder="comma, separated" value={c.tags} onChange={(e) => setControl(i, "tags", e.target.value)} /></Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Button startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={() => setForm({ ...form, controls: [...form.controls, newControl()] })}>
          Add control
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={busy}>{busy ? "Saving…" : "Add framework"}</Button>
      </DialogActions>
    </Dialog>
  );
}

const RuleAndPolicies = () => {
  const { isAdmin } = useAuth();
  const { data, error, loading, reload } = useApi(api.frameworks);
  const [open, setOpen] = useState(false);
  const [reindexing, setReindexing] = useState(null);
  const notifications = useNotifications();

  const reindex = async (f) => {
    setReindexing(f._id);
    try {
      await api.reindexFramework(f._id);
      notifications.show(`${f.shortCode} re-indexed`, { severity: "success", autoHideDuration: 3000 });
      reload();
    } catch (err) {
      notifications.show(err.message, { severity: "error" });
    } finally {
      setReindexing(null);
    }
  };

  const addButton = isAdmin && (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add framework</Button>
  );

  return (
    <Page actions={addButton}>
      <Typography color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
        Regulatory frameworks and the controls products are checked against. A framework applies to a product when
        it covers products and one of the product&apos;s markets.
      </Typography>
      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <EmptyState
          title="No frameworks yet"
          text={isAdmin ? "Add a framework and its controls to start checking products." : "An admin needs to add frameworks before products can be checked."}
          action={addButton || undefined}
        />
      ) : (
        data?.map((f) => (
          <Accordion key={f._id} variant="outlined" disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, width: "100%", pr: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{f.name} ({f.shortCode})</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[f.authority, f.country, f.industry, f.version && `v${f.version}`].filter(Boolean).join(" · ")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  {f.appliesTo?.map((a) => <Chip key={a} size="small" label={a === "product" ? "Products" : "Companies"} />)}
                  <Chip size="small" variant="outlined" label={plural(f.controls?.length ?? 0, "control")} />
                  {f.vectorIndexed && (
                    <Tooltip title={`Indexed ${formatDate(f.indexedAt)}`}>
                      <Chip size="small" variant="outlined" label="Indexed" />
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {f.description && <Typography sx={{ mb: 2 }}>{f.description}</Typography>}
              {isAdmin && (
                <Button size="small" startIcon={<SyncIcon />} disabled={reindexing === f._id} onClick={() => reindex(f)} sx={{ mb: 1 }}>
                  {reindexing === f._id ? "Re-indexing…" : "Re-index controls"}
                </Button>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Control</TableCell>
                      <TableCell>Risk</TableCell>
                      <TableCell>Mandatory</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {f.controls?.map((c) => (
                      <TableRow key={c._id} sx={{ verticalAlign: "top" }}>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>{c.controlId}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.title}</Typography>
                          <Typography variant="body2">{c.requirementText}</Typography>
                          {c.description && <Typography variant="body2" color="text.secondary">{c.description}</Typography>}
                          {c.tags?.length > 0 && (
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                              {c.tags.map((t) => <Chip key={t} size="small" variant="outlined" label={t} />)}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>{RISK_LABEL[c.riskLevel] || "—"}</TableCell>
                        <TableCell>{c.mandatory === false ? "No" : "Yes"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}
      <FrameworkDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(res) => {
          setOpen(false);
          const note = res.indexing?.indexed === false && res.indexing.reason ? ` (not indexed: ${res.indexing.reason})` : "";
          notifications.show(`${res.data.shortCode} added${note}`, { severity: "success", autoHideDuration: 5000 });
          reload();
        }}
      />
    </Page>
  );
};

export default RuleAndPolicies;
