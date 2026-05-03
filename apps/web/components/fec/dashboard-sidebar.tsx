"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  ArrowLeftRight,
  CircleDollarSign,
  ClipboardCheck,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  RotateCcw,
  Truck,
  Users,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback } from "react"

import { ComparisonFecCard } from "@/components/fec/comparison-fec-card"
import { FormattedNumber } from "@/components/fec/formatted-number"
import { ThemeToggle } from "@/components/theme-toggle"
import { formatShortDate } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  {
    href: "/dashboard/insights",
    label: "Actions à mener",
    icon: ClipboardCheck,
  },
]

const ANALYSIS_NAV: NavItem[] = [
  { href: "/dashboard/revenus", label: "Revenus", icon: CircleDollarSign },
  { href: "/dashboard/charges", label: "Charges", icon: ReceiptText },
  { href: "/dashboard/tresorerie", label: "Trésorerie", icon: Wallet },
]

const COUNTERPARTY_NAV: NavItem[] = [
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/fournisseurs", label: "Fournisseurs", icon: Truck },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data, reset } = useFecStore()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href)

  const handleReset = useCallback(() => {
    reset()
    router.push("/upload")
  }, [reset, router])

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <span className="font-heading text-xs font-bold">c.</span>
          </div>
          <span className="font-heading text-base font-semibold tracking-tight">
            Clair
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analyse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ANALYSIS_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tiers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {COUNTERPARTY_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    render={<Link href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ThemeToggle />
        {data ? (
          <div className="mx-1 mb-1 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Période analysée
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatShortDate(data.period.startDate)} →{" "}
              {formatShortDate(data.period.endDate)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <FormattedNumber value={data.meta.rowCount} /> écritures
            </p>

            <Dialog>
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 w-full justify-start px-2 text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <ArrowLeftRight className="size-3.5" />
                <span>Changer de FEC</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importer un nouveau FEC ?</DialogTitle>
                  <DialogDescription>
                    Vos données actuelles seront supprimées de votre navigateur.
                    Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Annuler
                  </DialogClose>
                  <DialogClose
                    render={
                      <Button variant="destructive" onClick={handleReset} />
                    }
                  >
                    <RotateCcw />
                    Importer un nouveau FEC
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null}
        {data ? <ComparisonFecCard /> : null}
      </SidebarFooter>
    </Sidebar>
  )
}
