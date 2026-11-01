import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "@/lib/router";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { queryKeys } from "@/lib/queryKeys";
import { useCompany } from "@/context/CompanyContext";
import { useDialogActions } from "@/context/DialogContext";
import { useSidebar } from "@/context/SidebarContext";
import { useCompanyOrder } from "@/hooks/useCompanyOrder";
import { useCloudInstance } from "@/hooks/useCloudInstance";
import { cn } from "@/lib/utils";
import { CompanyPatternIcon } from "./CompanyPatternIcon";
import { AnimatedPaperclipIcon } from "./AnimatedPaperclipIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Company } from "@paperclipai/shared";

interface CompanyRailProps {
  className?: string;
}

export function CompanyRail({ className }: CompanyRailProps) {
  const { companies, selectedCompany, setSelectedCompanyId } = useCompany();
  const { openOnboarding } = useDialogActions();
  const { isMobile, setSidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const companyCreationManaged = Boolean(useCloudInstance());

  const sidebarCompanies = useMemo(
    () => companies.filter((company) => company.status !== "archived"),
    [companies],
  );

  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;

  const { orderedCompanies } = useCompanyOrder({
    companies: sidebarCompanies,
    userId: currentUserId,
  });

  function selectCompany(company: Company) {
    const pathPrefix = location.pathname.split("/")[1]?.toUpperCase();
    const isCompanyRoute = sidebarCompanies.some((sidebarCompany) => (
      sidebarCompany.issuePrefix.toUpperCase() === pathPrefix
    ));
    const shouldLeaveCurrentRoute =
      company.id !== selectedCompany?.id &&
      (location.pathname.startsWith("/instance/") || isCompanyRoute);

    setSelectedCompanyId(company.id);
    if (isMobile) setSidebarOpen(false);
    if (shouldLeaveCurrentRoute) {
      navigate(`/${company.issuePrefix}/dashboard`);
    }
  }

  function handleCreateCompany() {
    if (companyCreationManaged) return;
    if (isMobile) setSidebarOpen(false);
    openOnboarding({ initialStep: 1 });
  }

  return (
    <aside
      aria-label="Organizations rail"
      className={cn(
        "flex w-16 h-full min-h-0 flex-col items-center justify-between border-r border-sidebar-border bg-sidebar/95 py-3 select-none z-10 shrink-0",
        className,
      )}
    >
      {/* Top: Paperclip Brand Icon */}
      <div className="flex flex-col items-center gap-2 w-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard"
              className="flex size-10 items-center justify-center rounded-xl bg-accent/30 text-foreground transition-all hover:bg-accent/60 hover:scale-105 active:scale-95"
              aria-label="LuMekH"
            >
              <img src="/brand/lumekh-logo.png" alt="LuMekH" className="size-7 object-contain drop-shadow-sm" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            LuMekH
          </TooltipContent>
        </Tooltip>
        <div className="h-px w-6 bg-sidebar-border/80 my-1" />
      </div>

      {/* Middle: Company icons list */}
      <nav
        aria-label="Organizations"
        className="flex-1 w-full flex flex-col items-center gap-3 overflow-y-auto no-scrollbar py-1"
      >
        {orderedCompanies.map((company) => {
          const isSelected = company.id === selectedCompany?.id;
          return (
            <div key={company.id} className="group relative flex items-center justify-center w-full">
              {/* Active indicator bar */}
              <span
                className={cn(
                  "absolute left-0 w-1 rounded-r-full bg-foreground transition-all duration-200",
                  isSelected
                    ? "h-6 opacity-100"
                    : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-60",
                )}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => selectCompany(company)}
                    className={cn(
                      "relative size-10 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-sidebar shadow-sm opacity-100"
                        : "opacity-80 hover:opacity-100 hover:scale-105",
                    )}
                    aria-label={`Switch to ${company.name}`}
                  >
                    <CompanyPatternIcon
                      companyName={company.name}
                      logoUrl={company.logoUrl}
                      className="size-10 rounded-xl"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <p className="font-semibold text-xs text-foreground">{company.name}</p>
                  <p className="text-(length:--text-nano) text-muted-foreground">{company.issuePrefix}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Bottom: Add new business button */}
      {!companyCreationManaged && (
        <div className="pt-2 flex flex-col items-center w-full">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCreateCompany}
                className="flex size-10 items-center justify-center rounded-full border border-dashed border-sidebar-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Create organization"
              >
                <Plus className="size-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12}>
              New organization
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
