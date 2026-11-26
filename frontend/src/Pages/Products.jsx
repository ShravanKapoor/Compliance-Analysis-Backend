import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNotifications } from "@toolpad/core/useNotifications";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorAlert, Loading, Page, ScoreMeter, StatusChip } from "../Components/common";
import { PRODUCT_TYPES, formatDate } from "../utils/format";

const MARKETS = ["United States", "European Union", "United Kingdom", "India", "Canada", "Australia", "Japan", "Global"];
const EMPTY = {
  productName: "", productCode: "", productType: "", company: "", description: "",
  intendedUse: "", deviceClass: "", riskCategory: "", market: [],
  evidenceTitle: "", evidenceContent: "",
};

function ProductDialog({ open, onClose, onCreated, organizations }) {
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const key of ["productName", "productCode", "productType", "company", "description"]) {
        if (form[key].trim()) fd.append(key, form[key].trim());
      }
      const regulatory = {
        intendedUse: form.intendedUse.trim() || undefined,
        deviceClass: form.deviceClass.trim() || undefined,
        riskCategory: form.riskCategory || undefined,
        market: form.market,
      };
      fd.append("regulatory", JSON.stringify(regulatory));
      if (form.evidenceContent.trim()) {
        fd.append("evidence", JSON.stringify([{ title: form.evidenceTitle, content: form.evidenceContent }]));
      }
      images.forEach((file) => fd.append("images", file));
      const product = await api.createProduct(fd);
      setForm(EMPTY);
      setImages([]);
      onCreated(product);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" component="form" onSubmit={submit}>
      <DialogTitle>Add product</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {organizations.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>Add an organization first: every product belongs to one.</Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Product name" required autoFocus value={form.productName} onChange={set("productName")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel id="company-label">Organization</InputLabel>
              <Select labelId="company-label" label="Organization" value={form.company} onChange={set("company")}>
                {organizations.map((o) => (
                  <MenuItem key={o._id} value={o._id}>{o.legalName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Product code" value={form.productCode} onChange={set("productCode")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-label">Product type</InputLabel>
              <Select labelId="type-label" label="Product type" value={form.productType} onChange={set("productType")}>
                <MenuItem value="">—</MenuItem>
                {Object.entries(PRODUCT_TYPES).map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" multiline minRows={2} label="Description" value={form.description} onChange={set("description")} />
          </Grid>

          <Grid size={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Regulatory</Typography></Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" label="Intended use" value={form.intendedUse} onChange={set("intendedUse")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Device class" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. Class II" value={form.deviceClass} onChange={set("deviceClass")} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="risk-label">Risk category</InputLabel>
              <Select labelId="risk-label" label="Risk category" value={form.riskCategory} onChange={set("riskCategory")}>
                <MenuItem value="">—</MenuItem>
                {["low", "medium", "high", "critical"].map((r) => (
                  <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={12}>
            <Autocomplete
              multiple
              freeSolo
              options={MARKETS}
              value={form.market}
              onChange={(_, market) => setForm({ ...form, market })}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return <Chip key={key} size="small" label={option} {...itemProps} />;
                })
              }
              renderInput={(params) => (
                <TextField {...params} size="small" label="Markets" helperText="Used to pick the frameworks that apply. Type to add others." />
              )}
            />
          </Grid>

          <Grid size={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>First evidence item (optional)</Typography></Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" label="Title" slotProps={{ inputLabel: { shrink: true } }} placeholder="e.g. Software validation report" value={form.evidenceTitle} onChange={set("evidenceTitle")} />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth size="small" multiline minRows={3} label="What it shows"
              slotProps={{ inputLabel: { shrink: true } }} placeholder="Describe how the product meets a requirement: tests performed, documents, certifications…"
              value={form.evidenceContent} onChange={set("evidenceContent")}
            />
          </Grid>

          <Grid size={12}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Button variant="outlined" component="label">
                Add images
                <input
                  hidden type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {images.length ? images.map((f) => f.name).join(", ") : "Up to 5 images or PDFs"}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={busy || organizations.length === 0}>
          {busy ? "Saving…" : "Add product"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const Products = () => {
  const [company, setCompany] = useState("");
  const products = useApi(() => api.products(company), [company]);
  const orgs = useApi(api.organizations);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notifications = useNotifications();

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
      Add product
    </Button>
  );

  return (
    <Page actions={addButton}>
      <FormControl size="small" sx={{ minWidth: 240, mb: 2 }}>
        <InputLabel id="filter-company">Organization</InputLabel>
        <Select labelId="filter-company" label="Organization" value={company} onChange={(e) => setCompany(e.target.value)}>
          <MenuItem value="">All organizations</MenuItem>
          {(orgs.data || []).map((o) => (
            <MenuItem key={o._id} value={o._id}>{o.legalName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <ErrorAlert error={products.error} onRetry={products.reload} />
      {products.loading && !products.data ? (
        <Loading />
      ) : products.data?.length === 0 ? (
        <EmptyState
          title={company ? "No products for this organization" : "No products yet"}
          text="Add a product, attach evidence of how it meets requirements, then run the compliance engine."
          action={addButton}
        />
      ) : products.data ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Score</TableCell>
                <TableCell>Last analysed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.data.map((p) => (
                <TableRow key={p._id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/products/${p._id}`)}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{p.productName}</Typography>
                    {p.productCode && <Typography variant="body2" color="text.secondary">{p.productCode}</Typography>}
                  </TableCell>
                  <TableCell>{p.company?.legalName || "—"}</TableCell>
                  <TableCell>{PRODUCT_TYPES[p.productType] || "—"}</TableCell>
                  <TableCell><StatusChip status={p.complianceStatus} /></TableCell>
                  <TableCell>{p.lastAnalyzedAt ? <ScoreMeter score={p.complianceScore} dense /> : "—"}</TableCell>
                  <TableCell>{formatDate(p.lastAnalyzedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <ProductDialog
        open={open}
        organizations={orgs.data || []}
        onClose={() => setOpen(false)}
        onCreated={(p) => {
          setOpen(false);
          notifications.show(`${p.productName} added`, { severity: "success", autoHideDuration: 3000 });
          navigate(`/products/${p._id}`);
        }}
      />
    </Page>
  );
};

export default Products;
