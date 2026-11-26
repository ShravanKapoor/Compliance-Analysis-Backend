import { useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Link, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNotifications } from "@toolpad/core/useNotifications";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorAlert, Loading, Page } from "../Components/common";

const EMPTY = {
  legalName: "", dbaName: "", phoneNumber: "", website: "",
  address: { street: "", city: "", state: "", zip: "", country: "" },
  primaryContact: { name: "", email: "" },
  identifiers: { dunsNumber: "", fdafei: "", labellerCode: "", cin: "", gstin: "", pan: "", cdsco: "" },
};

// Drop empty strings so the backend doesn't store or compare blanks.
const compact = (obj) =>
  Object.fromEntries(
    Object.entries(obj)
      .map(([k, v]) => [k, v && typeof v === "object" ? compact(v) : typeof v === "string" ? v.trim() : v])
      .filter(([, v]) => v !== "" && !(v && typeof v === "object" && Object.keys(v).length === 0)),
  );

function OrganizationDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (path) => (e) => {
    const [a, b] = path.split(".");
    setForm((f) => (b ? { ...f, [a]: { ...f[a], [b]: e.target.value } } : { ...f, [a]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const org = await api.createOrganization(compact(form));
      setForm(EMPTY);
      onCreated(org);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (path, label, props = {}) => (
    <Grid size={{ xs: 12, sm: props.half === false ? 12 : 6 }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={path.includes(".") ? form[path.split(".")[0]][path.split(".")[1]] : form[path]}
        onChange={set(path)}
        {...props}
        half={undefined}
      />
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" component="form" onSubmit={submit}>
      <DialogTitle>Add organization</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          {field("legalName", "Legal name", { required: true, autoFocus: true })}
          {field("dbaName", "Trading name (DBA)", { required: true })}
          {field("phoneNumber", "Phone")}
          {field("website", "Website")}
          <Grid size={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Address</Typography></Grid>
          {field("address.street", "Street", { half: false })}
          {field("address.city", "City")}
          {field("address.state", "State / region")}
          {field("address.zip", "Postal code")}
          {field("address.country", "Country")}
          <Grid size={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Primary contact</Typography></Grid>
          {field("primaryContact.name", "Name")}
          {field("primaryContact.email", "Email", { type: "email" })}
          <Grid size={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Regulatory identifiers (optional)</Typography></Grid>
          {field("identifiers.dunsNumber", "DUNS number")}
          {field("identifiers.fdafei", "FDA FEI")}
          {field("identifiers.labellerCode", "Labeller code")}
          {field("identifiers.cin", "CIN")}
          {field("identifiers.gstin", "GSTIN")}
          {field("identifiers.pan", "PAN")}
          {field("identifiers.cdsco", "CDSCO registration")}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={busy}>{busy ? "Saving…" : "Add organization"}</Button>
      </DialogActions>
    </Dialog>
  );
}

const Organizations = () => {
  const { data, error, loading, reload } = useApi(api.organizations);
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
      Add organization
    </Button>
  );

  return (
    <Page actions={addButton}>
      <ErrorAlert error={error} onRetry={reload} />
      {loading && !data ? (
        <Loading />
      ) : data?.length === 0 ? (
        <EmptyState
          title="No organizations yet"
          text="Add the companies whose products you want to check. Every product belongs to an organization."
          action={addButton}
        />
      ) : data ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Legal name</TableCell>
                <TableCell>Trading name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Website</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{o.legalName}</TableCell>
                  <TableCell>{o.dbaName}</TableCell>
                  <TableCell>{o.address?.country || "—"}</TableCell>
                  <TableCell>
                    {o.primaryContact?.name || "—"}
                    {o.primaryContact?.email && (
                      <Typography variant="body2" color="text.secondary">{o.primaryContact.email}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {o.website ? (
                      <Link href={/^https?:\/\//.test(o.website) ? o.website : `https://${o.website}`} target="_blank" rel="noopener noreferrer">
                        {o.website}
                      </Link>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
      <OrganizationDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(org) => {
          setOpen(false);
          notifications.show(`${org.legalName} added`, { severity: "success", autoHideDuration: 3000 });
          reload();
        }}
      />
    </Page>
  );
};

export default Organizations;
