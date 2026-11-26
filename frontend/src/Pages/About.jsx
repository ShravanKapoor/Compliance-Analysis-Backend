import { Card, CardContent, Typography } from "@mui/material";
import { Page } from "../Components/common";

const About = () => (
  <Page>
    <Card variant="outlined" sx={{ maxWidth: 760 }}>
      <CardContent>
        <Typography paragraph>
          Compliance Analysis checks products against regulatory frameworks. Admins describe each framework as a list
          of controls (requirements). Teams add their organizations and products, attach evidence of how each product
          meets requirements, and run the compliance engine.
        </Typography>
        <Typography paragraph>
          The engine matches every control with the closest evidence and assesses it as met, partly met, not met or
          not applicable. The result is a risk-weighted score, a list of gaps with suggested fixes, and a report kept
          for every analysis.
        </Typography>
        <Typography color="text.secondary">
          Results support, and do not replace, review by a qualified regulatory professional.
        </Typography>
      </CardContent>
    </Card>
  </Page>
);

export default About;
