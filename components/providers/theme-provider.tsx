"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  // Đảm bảo không có logic chèn script thủ công ở đây
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
