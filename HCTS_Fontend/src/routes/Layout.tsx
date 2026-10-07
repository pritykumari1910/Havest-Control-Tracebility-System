import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { RoleSelectDialog } from "@/components/RoleSelectDialog";
import { Outlet } from "react-router-dom";


export function AuthedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-white px-2 backdrop-blur sm:px-4">
            <SidebarTrigger className="shrink-0" />
            <AppHeader />
          </header>
          <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <RoleSelectDialog />
    </SidebarProvider>
  );
}

