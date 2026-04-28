import { Toaster } from "@workspace/ui/components/sonner"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import "@workspace/ui/globals.css"
import { cn } from "@workspace/ui/lib/utils"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { FecStoreProvider } from "@/lib/fec/store"

const spaceGroteskHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
})

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Clair · La santé de votre entreprise, en clair",
  description:
    "Importez votre FEC, obtenez en quelques secondes un tableau de bord clair pour piloter votre entreprise : ventes, charges, trésorerie, marges, et actions concrètes à mener.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
        spaceGroteskHeading.variable
      )}
    >
      <body className="min-h-svh bg-background">
        <ThemeProvider>
          <TooltipProvider delay={150}>
            <FecStoreProvider>{children}</FecStoreProvider>
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
