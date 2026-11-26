import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { PageContainer } from "@toolpad/core/PageContainer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import HelpIcon from "@mui/icons-material/Help";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { STATUS_LABEL } from "../utils/format";

// Every status is shown with an icon AND a label, never colour alone.
const STATUS = {
  // control results
  met: { label: STATUS_LABEL.met, color: "success", icon: <CheckCircleIcon /> },
  partial: { label: STATUS_LABEL.partial, color: "warning", icon: <RemoveCircleIcon /> },
  not_met: { label: STATUS_LABEL.not_met, color: "error", icon: <CancelIcon /> },
  not_applicable: { label: STATUS_LABEL.not_applicable, color: "default", icon: <DoNotDisturbOnIcon /> },
  // product / report status
  compliant: { label: STATUS_LABEL.compliant, color: "success", icon: <CheckCircleIcon /> },
  non_compliant: { label: STATUS_LABEL.non_compliant, color: "error", icon: <CancelIcon /> },
  under_review: { label: STATUS_LABEL.under_review, color: "warning", icon: <HelpIcon /> },
  draft: { label: STATUS_LABEL.draft, color: "default", icon: <EditNoteIcon /> },
};


export function StatusChip({ status, size = "small", ...props }) {
  const s = STATUS[status] ?? { label: status || "Unknown", color: "default", icon: <HelpIcon /> };
  return <Chip size={size} color={s.color} icon={s.icon} label={s.label} variant="outlined" {...props} />;
}




/** A score out of 100 as a figure plus a bar (a meter). */
export function ScoreMeter({ score, label, dense = false }) {
  const known = typeof score === "number";
  return (
    <Box sx={{ minWidth: dense ? 120 : 180 }}>
      {label && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <LinearProgress
          variant="determinate"
          value={known ? score : 0}
          aria-label={label ? `${label} score` : "Score"}
          sx={{ flex: 1, height: dense ? 6 : 8, borderRadius: 4 }}
        />
        <Typography variant={dense ? "body2" : "subtitle1"} sx={{ fontWeight: 700, minWidth: 40, textAlign: "right" }}>
          {known ? score : "—"}
        </Typography>
      </Stack>
    </Box>
  );
}

/** Big headline number for a report. */
export function HeroScore({ score }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Compliance score
      </Typography>
      <Typography sx={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
        {typeof score === "number" ? score : "—"}
        <Typography component="span" variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
          / 100
        </Typography>
      </Typography>
    </Box>
  );
}

export function StatTile({ label, value, hint, onClick }) {
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{ p: 2.5, height: "100%", cursor: onClick ? "pointer" : "default", "&:hover": onClick ? { borderColor: "primary.main" } : {} }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontSize: 36, fontWeight: 800, lineHeight: 1.2 }}>{value ?? "—"}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", py: 4, justifyContent: "center" }}>
      <CircularProgress size={22} />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
      sx={{ my: 2 }}
    >
      {error.message || String(error)}
    </Alert>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {text && (
        <Typography color="text.secondary" sx={{ mb: action ? 2 : 0, maxWidth: 520, mx: "auto" }}>
          {text}
        </Typography>
      )}
      {action}
    </Paper>
  );
}

/** Page with a title/breadcrumbs (from the navigation) and optional header actions. */
export function Page({ actions, children, ...props }) {
  return (
    <PageContainer
      maxWidth="xl"
      slotProps={actions ? { header: { slotProps: { toolbar: { children: actions } } } } : undefined}
      {...props}
    >
      {children}
    </PageContainer>
  );
}
