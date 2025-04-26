import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: "icon" | "full" | false
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible = false, collapsed = false, onCollapsedChange, ...props }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(collapsed)

    React.useEffect(() => {
      setIsCollapsed(collapsed)
    }, [collapsed])

    React.useEffect(() => {
      onCollapsedChange?.(isCollapsed)
    }, [isCollapsed, onCollapsedChange])

    return (
      <div
        ref={ref}
        data-collapsed={isCollapsed}
        className={cn(
          "group relative flex flex-col gap-4 px-4 py-4 h-full duration-500 ease-in-out",
          isCollapsed && collapsible === "icon" && "items-center px-2",
          isCollapsed && collapsible === "full" && "w-[80px]",
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-6", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-auto", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute right-0 top-0 w-px h-full bg-border opacity-0 group-hover:opacity-100 transition-opacity",
      className
    )}
    {...props}
  />
))
SidebarRail.displayName = "SidebarRail"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} 