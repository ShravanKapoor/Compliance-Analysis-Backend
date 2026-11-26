import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { EmptyState, Page } from "../Components/common";

const NotFound = () => (
  <Page title="Page not found" breadcrumbs={[]}>
    <EmptyState
      title="This page doesn't exist"
      text="The link may be out of date."
      action={<Button component={RouterLink} to="/" variant="contained">Go to the dashboard</Button>}
    />
  </Page>
);

export default NotFound;
