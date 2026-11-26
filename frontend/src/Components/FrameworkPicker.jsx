import { plural } from "../utils/format";
import { Box, Checkbox, FormControlLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Radio, RadioGroup, Typography } from "@mui/material";

/**
 * Choose which frameworks to check: automatic (the engine picks those that
 * apply to the product's markets) or a specific selection.
 * value: null for automatic, or an array of framework ids.
 */
export default function FrameworkPicker({ frameworks = [], value, onChange }) {
  const automatic = value === null;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <Box>
      <RadioGroup value={automatic ? "auto" : "pick"} onChange={(e) => onChange(e.target.value === "auto" ? null : [])}>
        <FormControlLabel
          value="auto"
          control={<Radio />}
          label={
            <span>
              <strong>Automatic</strong>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ display: "block" }}>
                Every active framework for products in the product&apos;s markets
              </Typography>
            </span>
          }
        />
        <FormControlLabel value="pick" control={<Radio />} label={<strong>Choose frameworks</strong>} />
      </RadioGroup>
      {!automatic && (
        <List dense sx={{ border: 1, borderColor: "divider", borderRadius: 1, mt: 1, maxHeight: 280, overflow: "auto" }}>
          {frameworks.length === 0 && (
            <ListItem>
              <ListItemText primary="No frameworks yet" secondary="An admin can add them under Rules & Policies." />
            </ListItem>
          )}
          {frameworks.map((f) => (
            <ListItemButton key={f._id} onClick={() => toggle(f._id)}>
              <ListItemIcon>
                <Checkbox edge="start" checked={value.includes(f._id)} tabIndex={-1} disableRipple inputProps={{ "aria-label": f.name }} />
              </ListItemIcon>
              <ListItemText
                primary={`${f.name} (${f.shortCode})`}
                secondary={[f.country, f.appliesTo?.join(", "), plural(f.controls?.length ?? 0, "control")].filter(Boolean).join(" · ")}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
