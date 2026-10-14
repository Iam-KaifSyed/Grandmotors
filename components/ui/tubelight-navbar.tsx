"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Home,
  Wrench,
  Calendar,
  Info,
  Phone,
  Briefcase,
  FileText,
  User,
  Truck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  services: Wrench,
  service: Wrench,
  "doorstep service": Truck,
  doorstep: Truck,
  bookings: Calendar,
  booking: Calendar,
  "my bookings": Calendar,
  about: Info,
  contact: Phone,
  projects: Briefcase,
  resume: FileText,
  user: User,
}

export interface NavItem {
  name: string
  url: string
  icon?: LucideIcon | string
  badge?: string
}

export interface NavBarProps {
  items: NavItem[]
  className?: string
  currentPath?: string
}

function resolveIcon(item: NavItem): LucideIcon {
  if (typeof item.icon === "function") {
    return item.icon
  }
  if (
    typeof item.icon === "object" &&
    item.icon !== null &&
    "render" in item.icon &&
    typeof (item.icon as any).render === "function"
  ) {
    return item.icon
  }
  const key = item.name.toLowerCase().trim()
  return DEFAULT_ICON_MAP[key] || Home
}

function resolveActiveTab(items: NavItem[], currentPath?: string): string {
  const path = currentPath || (typeof window !== "undefined" ? window.location.pathname : "")
  const search = typeof window !== "undefined" ? window.location.search : ""
  const hash = typeof window !== "undefined" ? window.location.hash : ""

  if (search.includes("location=doorstep") || hash.includes("doorstep")) {
    const doorstepItem = items.find((item) => item.name.toLowerCase().includes("doorstep"))
    if (doorstepItem) return doorstepItem.name
  }

  if (path) {
    const match = items.find((item) => {
      const itemPath = item.url.split(/[?#]/)[0]
      return itemPath === path || (itemPath !== "/" && path.startsWith(itemPath))
    })
    if (match) return match.name
    return ""
  }
  return items[0]?.name || ""
}

export function NavBar({ items, className, currentPath }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(() => resolveActiveTab(items, currentPath))
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const sync = () => {
      const tab = resolveActiveTab(items)
      if (tab) setActiveTab(tab)
    }
    sync()
    window.addEventListener("popstate", sync)
    document.addEventListener("astro:page-load", sync)
    return () => {
      window.removeEventListener("popstate", sync)
      document.removeEventListener("astro:page-load", sync)
    }
  }, [items])

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:top-0 left-1/2 -translate-x-1/2 z-50 mb-6 sm:pt-6",
        className,
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 bg-black/60 border border-white/10 backdrop-blur-xl py-1 px-1.5 rounded-full shadow-2xl shadow-black/60">
        {items.map((item) => {
          const Icon = resolveIcon(item)
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs md:text-sm font-semibold tracking-wide px-3 sm:px-5 py-2 rounded-full transition-colors flex items-center gap-1.5",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-white/5 text-primary",
              )}
            >
              <span className="hidden md:inline-flex items-center gap-1.5">
                <span>{item.name}</span>
                {item.badge && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-[#B88952]/20 text-[#B88952] border border-[#B88952]/50 animate-amber-glow shadow-[0_0_8px_rgba(184,137,82,0.4)]">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="md:hidden relative flex items-center justify-center">
                <Icon size={18} strokeWidth={2.5} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#B88952] animate-amber-glow shadow-[0_0_6px_rgba(184,137,82,0.8)]" />
                )}
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full shadow-[0_0_12px_var(--color-primary)]">
                    <div className="absolute w-12 h-6 bg-primary/25 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/25 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/30 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
