import React from "react";
import { Box, SvgIcon, Typography } from "@mui/material";

type DesktopOnlyOverlayProps = {
  visible: boolean;
};

export function DesktopOnlyOverlay({ visible }: DesktopOnlyOverlayProps) {
  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(10, 14, 20, 0.62)",
        color: "common.white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0.5,
        borderRadius: 3,
        textAlign: "center",
        px: 1,
      }}
    >
      <SvgIcon fontSize="small">
        <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4C2.9 3 2 3.9 2 5v11c0 1.1.9 2 2 2H0v2h24v-2h-4zm0-2H4V5h16v11z" />
      </SvgIcon>
      <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: "0.08em" }}>
        Desktop only
      </Typography>
    </Box>
  );
}
