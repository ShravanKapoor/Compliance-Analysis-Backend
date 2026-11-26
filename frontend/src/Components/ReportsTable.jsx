import { useNavigate } from "react-router-dom";
import { Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ScoreMeter, StatusChip } from "./common";
import { formatDate, METHOD_LABEL } from "../utils/format";

export default function ReportsTable({ reports, hideProduct = false }) {
  const navigate = useNavigate();
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            {!hideProduct && <TableCell>Product</TableCell>}
            <TableCell>Frameworks</TableCell>
            <TableCell>Status</TableCell>
            <TableCell sx={{ minWidth: 150 }}>Score</TableCell>
            <TableCell>Gaps</TableCell>
            <TableCell>Method</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r._id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/reports/${r._id}`)}>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(r.createdAt)}</TableCell>
              {!hideProduct && (
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.product?.productName || "Deleted product"}</Typography>
                </TableCell>
              )}
              <TableCell>{r.frameworks?.map((f) => f.shortCode).join(", ") || "—"}</TableCell>
              <TableCell><StatusChip status={r.status} /></TableCell>
              <TableCell><ScoreMeter score={r.overallScore} dense /></TableCell>
              <TableCell>{r.gaps?.length ?? 0}</TableCell>
              <TableCell><Chip size="small" variant="outlined" label={METHOD_LABEL[r.method] || r.method} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
