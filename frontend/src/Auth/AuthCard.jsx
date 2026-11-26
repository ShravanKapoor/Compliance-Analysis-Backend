import { Box, Paper, Stack, Typography } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 420 }}>
        <Stack spacing={1} sx={{ alignItems: "center", mb: 3, textAlign: "center" }}>
          <VerifiedUserIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {subtitle && <Typography color="text.secondary">{subtitle}</Typography>}
        </Stack>
        {children}
      </Paper>
    </Box>
  );
}
