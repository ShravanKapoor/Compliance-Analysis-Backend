import { useState } from "react";
import { Button, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useApi } from "../hooks/useApi";
import { EmptyState, ErrorAlert, Loading, Page } from "../Components/common";
import ReportsTable from "../Components/ReportsTable";

const Reports = () => {
  const [productId, setProductId] = useState("");
  const reports = useApi(() => api.reports(productId), [productId]);
  const products = useApi(() => api.products());
  const navigate = useNavigate();

  return (
    <Page>
      <FormControl size="small" sx={{ minWidth: 240, mb: 2 }}>
        <InputLabel id="filter-product">Product</InputLabel>
        <Select labelId="filter-product" label="Product" value={productId} onChange={(e) => setProductId(e.target.value)}>
          <MenuItem value="">All products</MenuItem>
          {(products.data || []).map((p) => (
            <MenuItem key={p._id} value={p._id}>{p.productName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <ErrorAlert error={reports.error} onRetry={reports.reload} />
      {reports.loading && !reports.data ? (
        <Loading />
      ) : reports.data?.length === 0 ? (
        <EmptyState
          title="No reports yet"
          text="Reports appear here each time a product is analysed."
          action={<Button variant="contained" onClick={() => navigate("/compliance-engine")}>Open the compliance engine</Button>}
        />
      ) : reports.data ? (
        <ReportsTable reports={reports.data} />
      ) : null}
    </Page>
  );
};

export default Reports;
