import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Accordion, AccordionDetails, AccordionSummary, Alert, Box, Card, CardContent, Chip, Grid, Link, List,
  ListItem, ListItemText, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { ErrorAlert, HeroScore, Loading, Page, ScoreMeter, StatusChip } from "../Components/common";
import { METHOD_LABEL, RISK_LABEL, formatDate, plural, statusLabel } from "../utils/format";

const FILTERS = ["all", "not_met", "partial", "met", "not_applicable"];

function ControlsTable({ controls }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Control</TableCell>
            <TableCell>Status</TableCell>
            <TableCell sx={{ minWidth: 260 }}>Assessment</TableCell>
            <TableCell sx={{ minWidth: 200 }}>Evidence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controls.map((c) => (
            <TableRow key={c.controlKey} sx={{ verticalAlign: "top" }}>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.controlId || "—"}</Typography>
                <Typography variant="body2">{c.title}</Typography>
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                  <Chip size="small" variant="outlined" label={`${RISK_LABEL[c.riskLevel] || c.riskLevel} risk`} />
                  {c.mandatory && <Chip size="small" variant="outlined" label="Mandatory" />}
                </Stack>
              </TableCell>
              <TableCell>
                <StatusChip status={c.status} />
                {c.assessedBy === "similarity" && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    evidence match
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2">{c.rationale}</Typography>
                {c.remediation && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>To fix:</strong> {c.remediation}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                {c.evidence?.length ? (
                  c.evidence.map((e) => (
                    <Tooltip key={e.chunkId} title={e.excerpt} placement="left">
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.source}</Typography>
                        {typeof e.similarity === "number" && (
                          <Typography variant="caption" color="text.secondary">similarity {e.similarity.toFixed(2)}</Typography>
                        )}
                      </Box>
                    </Tooltip>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">None</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const ReportDetail = () => {
  const { id } = useParams();
  const report = useApi(() => api.report(id), [id]);
  const [filter, setFilter] = useState("all");

  const frameworks = useMemo(
    () =>
      (report.data?.frameworks || []).map((f) => ({
        ...f,
        visible: filter === "all" ? f.controls : f.controls.filter((c) => c.status === filter),
      })),
    [report.data, filter],
  );

  const crumbs = [{ title: "Reports", path: "/reports" }];
  if (report.loading && !report.data) return <Page title="Report" breadcrumbs={crumbs}><Loading /></Page>;
  if (report.error) {
    return <Page title="Report" breadcrumbs={crumbs}><ErrorAlert error={report.error} onRetry={report.reload} /></Page>;
  }
  const r = report.data;
  const productName = r.product?.productName || "Deleted product";
  const title = `${productName} report`;
  const totals = r.frameworks.reduce(
    (acc, f) => {
      for (const k of Object.keys(acc)) acc[k] += f.counts?.[k] ?? 0;
      return acc;
    },
    { met: 0, partial: 0, not_met: 0, not_applicable: 0 },
  );

  return (
    <Page title={title} breadcrumbs={[...crumbs, { title: formatDate(r.createdAt) }]}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <HeroScore score={r.overallScore} />
                <Box><StatusChip status={r.status} size="medium" /></Box>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(r.createdAt)}
                  <br />
                  {r.product ? (
                    <Link component={RouterLink} to={`/products/${r.product._id}`}>{productName}</Link>
                  ) : productName}
                  {" · "}
                  {METHOD_LABEL[r.method] || r.method}
                  {r.model ? ` (${r.model})` : ""}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Frameworks</Typography>
              <Stack spacing={2}>
                {r.frameworks.map((f) => (
                  <ScoreMeter key={f.shortCode} score={f.score} label={`${f.name} (${f.shortCode})`} />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: "wrap" }}>
                {Object.entries(totals).map(([status, n]) => (
                  <StatusChip key={status} status={status} label={`${statusLabel(status)}: ${n}`} />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {r.method === "similarity" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This report is an <strong>evidence match</strong>: it shows whether evidence related to each control
          exists, not whether it proves compliance. Review the results, or set an Anthropic API key on the backend
          so Claude assesses each control.
        </Alert>
      )}
      {r.notes?.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {r.notes.map((n, i) => <div key={i}>{n}</div>)}
        </Alert>
      )}

      {r.gaps?.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">Gaps to close ({r.gaps.length})</Typography>
            <Typography variant="body2" color="text.secondary">Mandatory and high-risk controls first.</Typography>
            <List dense>
              {r.gaps.slice(0, 10).map((g) => (
                <ListItem key={`${g.frameworkShortCode}-${g.controlKey}`} disableGutters>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", width: "100%" }}>
                    <StatusChip status={g.status} />
                    <ListItemText
                      sx={{ m: 0 }}
                      primary={
                        <span>
                          {g.frameworkShortCode} {g.controlId}: {g.title}
                          {g.mandatory && (
                            <Tooltip title="Mandatory">
                              <PriorityHighIcon fontSize="inherit" color="error" sx={{ ml: 0.5, verticalAlign: "middle" }} aria-label="Mandatory" />
                            </Tooltip>
                          )}
                        </span>
                      }
                      secondary={g.remediation}
                    />
                  </Stack>
                </ListItem>
              ))}
            </List>
            {r.gaps.length > 10 && (
              <Typography variant="body2" color="text.secondary">
                {r.gaps.length - 10} more below. Use the “Not met” and “Partial” filters.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">All controls</Typography>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} aria-label="Filter controls by status">
          {FILTERS.map((f) => (
            <ToggleButton key={f} value={f}>{f === "all" ? "All" : statusLabel(f)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {frameworks.map((f) => (
        <Accordion key={f.shortCode} defaultExpanded={r.frameworks.length === 1} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", width: "100%", pr: 1 }}>
              <Typography sx={{ fontWeight: 600, flex: 1 }}>
                {f.name} ({f.shortCode}{f.version ? ` v${f.version}` : ""})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {f.visible.length} of {plural(f.controls.length, "control")}
              </Typography>
              <Typography sx={{ fontWeight: 700, minWidth: 36, textAlign: "right" }}>{f.score ?? "—"}</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {f.visible.length ? (
              <ControlsTable controls={f.visible} />
            ) : (
              <Typography color="text.secondary" sx={{ p: 2 }}>No controls with this status.</Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {r.skippedFrameworks?.length > 0 && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Not checked</Typography>
            <List dense disablePadding>
              {r.skippedFrameworks.map((s) => (
                <ListItem key={s.shortCode} disableGutters>
                  <ListItemText primary={`${s.name} (${s.shortCode})`} secondary={s.reason} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Page>
  );
};

export default ReportDetail;
