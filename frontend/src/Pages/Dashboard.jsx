import { useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Grid, LinearProgress, Link, List, ListItem, ListItemText, Stack, Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import ReportsTable from "../Components/ReportsTable";
import { ErrorAlert, Loading, Page, StatTile, StatusChip } from "../Components/common";

const PRODUCT_STATUSES = ["compliant", "non_compliant", "under_review", "draft"];

const loadAll = async () => {
  const [products, organizations, frameworks, reports] = await Promise.all([
    api.products(), api.organizations(), api.frameworks(), api.reports(),
  ]);
  return { products, organizations, frameworks, reports };
};

function GettingStarted({ data }) {
  const steps = [
    ["Add an organization", data.organizations.length > 0, "/organization"],
    ["Add a framework with controls (admin)", data.frameworks.length > 0, "/rules-and-policies"],
    ["Add a product and its evidence", data.products.length > 0, "/products"],
    ["Run the compliance engine", data.reports.length > 0, "/compliance-engine"],
  ];
  if (steps.every(([, done]) => done)) return null;
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Getting started</Typography>
        <List dense disablePadding>
          {steps.map(([label, done, to]) => (
            <ListItem key={label} disableGutters>
              {done ? (
                <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} aria-label="Done" />
              ) : (
                <RadioButtonUncheckedIcon color="disabled" sx={{ mr: 1 }} aria-label="To do" />
              )}
              <ListItemText primary={done ? label : <Link component={RouterLink} to={to}>{label}</Link>} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(loadAll);
  const navigate = useNavigate();

  // Gaps from each product's most recent report (reports come newest first)
  const openGaps = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    const gaps = [];
    for (const r of data.reports) {
      const pid = r.product?._id;
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      for (const g of r.gaps || []) {
        if (g.mandatory) gaps.push({ ...g, reportId: r._id, productName: r.product.productName });
      }
    }
    return gaps;
  }, [data]);

  if (loading && !data) return <Page><Loading /></Page>;
  if (error) return <Page><ErrorAlert error={error} onRetry={reload} /></Page>;

  const counts = Object.fromEntries(PRODUCT_STATUSES.map((s) => [s, 0]));
  data.products.forEach((p) => (counts[p.complianceStatus] = (counts[p.complianceStatus] ?? 0) + 1));
  const total = data.products.length;

  return (
    <Page title={`Welcome, ${user?.userName || ""}`} breadcrumbs={[]}>
      <GettingStarted data={data} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><StatTile label="Products" value={total} onClick={() => navigate("/products")} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatTile label="Organizations" value={data.organizations.length} onClick={() => navigate("/organization")} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatTile label="Frameworks" value={data.frameworks.length} onClick={() => navigate("/rules-and-policies")} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><StatTile label="Analyses" value={data.reports.length} onClick={() => navigate("/reports")} /></Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Products by status</Typography>
              {total === 0 ? (
                <Typography color="text.secondary">No products yet.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {PRODUCT_STATUSES.map((s) => (
                    <Box key={s}>
                      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <StatusChip status={s} />
                        <Typography sx={{ fontWeight: 700 }}>{counts[s]}</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(100 * counts[s]) / total}
                        aria-label={`${counts[s]} of ${total} products`}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6">Open mandatory gaps</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>From each product&apos;s latest analysis</Typography>
              {openGaps.length === 0 ? (
                <Typography color="text.secondary">{data.reports.length ? "None. Nice work." : "Run an analysis to see gaps."}</Typography>
              ) : (
                <List dense disablePadding>
                  {openGaps.slice(0, 8).map((g) => (
                    <ListItem key={`${g.reportId}-${g.controlKey}`} disableGutters>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", width: "100%" }}>
                        <StatusChip status={g.status} />
                        <ListItemText
                          sx={{ m: 0 }}
                          primary={<Link component={RouterLink} to={`/reports/${g.reportId}`}>{g.productName}: {g.frameworkShortCode} {g.controlId} {g.title}</Link>}
                          secondary={g.remediation}
                        />
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Recent analyses</Typography>
        <Button component={RouterLink} to="/compliance-engine">Run an analysis</Button>
      </Stack>
      {data.reports.length ? (
        <ReportsTable reports={data.reports.slice(0, 5)} />
      ) : (
        <Typography color="text.secondary">None yet.</Typography>
      )}
    </Page>
  );
};

export default Dashboard;
