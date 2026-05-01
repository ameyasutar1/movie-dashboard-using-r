import { LayoutDashboard, BookOpen, FileText } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Workbench", url: "/", icon: LayoutDashboard, desc: "Interactive explorer" },
  { title: "The Story", url: "/story", icon: BookOpen, desc: "5 guided insights" },
  { title: "Methodology", url: "/method", icon: FileText, desc: "Sources & method" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-3 py-4">
        {!collapsed ? (
          <div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-accent">BMI</div>
            <div className="serif text-sm text-primary leading-tight mt-0.5">
              Bollywood Movie<br />Intelligence
            </div>
          </div>
        ) : (
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-accent text-center">BMI</div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="mono text-[10px] tracking-[0.2em] uppercase">Navigate</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="h-auto py-2.5">
                      <NavLink to={item.url} className="flex items-start gap-3">
                        <item.icon className="h-4 w-4 mt-0.5 shrink-0" />
                        {!collapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}