// src/components/AppLayout.tsx
import { NavLink, Outlet } from "react-router-dom"
import { useAuth } from "@/app/AuthProvider"
import { Button } from "@/components/ui/button"
import {
  Home,
  Clock,
  Map,
  Calendar,
  Network,
  Settings,
  LogOut,
  NotebookPen
} from "lucide-react"
import { useMemo } from "react"

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

function initialsFrom(email?: string) {
  if (!email) return "U"
  const name = email.split("@")[0]
  const parts = name.split(/[.\s_-]/).filter(Boolean)
  const a = parts[0]?.[0] ?? name[0]
  const b = parts[1]?.[0]
  return (a + (b ?? "")).toUpperCase()
}

function NavItem({
  to,
  label,
  Icon,
  end,
}: {
  to: string
  label: string
  Icon: IconType
  end?: boolean
}) {
  return (
    <NavLink to={to} end={end} title={label}>
      {({ isActive }) => (
        <div
          className={[
            "group/item relative flex items-center gap-3 rounded-xl px-3 py-2",
            "text-slate-700 hover:bg-slate-100 transition-all duration-200",
            "hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]",
            isActive ? "bg-slate-900 text-white shadow-md animate-[slideIn_0.3s_ease-out]" : "",
          ].join(" ")}
        >
          {/* active indicator */}
          <span
            className={[
              "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-slate-900",
              isActive
                ? "scale-y-0 opacity-0"
                : "scale-y-0 opacity-0",
              "transition-all duration-300 origin-center",
              "group-hover/sidebar:scale-y-100 group-hover/sidebar:opacity-100",
            ].join(" ")}
          />
          <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/item:scale-110 group-hover/item:rotate-3" />
          {/* label reveals on hover */}
          <span
            className="
              pointer-events-none whitespace-nowrap
              opacity-0 -translate-x-1
              group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0
              transition-all duration-200 delay-75
            "
          >
            {label}
          </span>

          {/* subtle glow on hover (decorative) */}
          <span
            className="
              pointer-events-none
              absolute inset-0 rounded-xl
              opacity-0 group-hover/item:opacity-100
              transition-opacity duration-300
              [background:radial-gradient(120px_60px_at_left,theme(colors.slate.200/.5),transparent)]
            "
            aria-hidden
          />
          
          {/* shimmer effect when active */}
          {isActive && (
            <span
              className="
                pointer-events-none absolute inset-0 rounded-xl overflow-hidden
              "
              aria-hidden
            >
              <span className="absolute inset-0 animate-[shimmer_2s_ease-in-out_infinite] [background:linear-gradient(110deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%)]" />
            </span>
          )}
        </div>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const email = (user as any)?.email as string | undefined
  const initials = initialsFrom(email)

  const brand = useMemo(
    () => ({
      name: "Daily",
      icon: NotebookPen,
    }),
    []
  )

  return (
    <div className="min-h-screen flex bg-white text-slate-900">
      {/* SIDEBAR — collapsed by default; expands on hover */}
      <aside
        className="
          group/sidebar relative h-screen border-r bg-white/90 backdrop-blur
          w-16 hover:w-64 transition-[width] duration-300 ease-out overflow-x-hidden
          shadow-[inset_-1px_0_0_0_rgba(15,23,42,0.04)]
          hover:shadow-lg
          sticky top-0
        "
      >
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className="h-14 flex items-center border-b px-3 relative overflow-hidden">
            <div className="flex items-center gap-2 relative z-10">
              <div
                className="
                  h-8 w-8 grid place-items-center rounded-xl bg-slate-900 text-white
                  animate-[brandPop_0.7s_ease-out]
                  group-hover/sidebar:rotate-[-5deg] transition-transform duration-300
                  shadow-sm
                "
              >
                <brand.icon className="h-4 w-4" />
              </div>
              <span
                className="
                  font-semibold tracking-tight
                  opacity-0 -translate-x-1
                  group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0
                  transition-all duration-200 delay-100
                "
              >
                {brand.name}
              </span>
            </div>
            {/* Subtle background wave animation */}
            <span
              className="
                pointer-events-none absolute inset-0 opacity-0
                group-hover/sidebar:opacity-100 transition-opacity duration-500
                bg-gradient-to-r from-slate-50/0 via-slate-50 to-slate-50/0
                animate-[wave_3s_ease-in-out_infinite]
              "
              aria-hidden
            />
          </div>

          {/* Nav */}
          <nav className="p-2 space-y-1">
            <NavItem to="/overview" end label="Overview" Icon={Home} />
            <NavItem to="/now" label="Now" Icon={Clock} />
            <NavItem to="/atlas" label="Atlas" Icon={Map} />
            <NavItem to="/shukan" label="Shukan" Icon={Calendar} />
            <NavItem to="/nexo" label="Nexo" Icon={Network} />
          </nav>

          {/* push footer to the very bottom */}
          <div className="mt-auto" />

          {/* Settings (Dojo) section */}
          <div className="p-2 border-t border-slate-100">
            <NavItem to="/dojo" label="Dojo" Icon={Settings} />
          </div>

          {/* User + Sign out (STICKY bottom) */}
          <div className="border-t p-3 bg-gradient-to-t from-slate-50/50 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="
                h-10 w-10 grid place-items-center rounded-full 
                bg-gradient-to-br from-slate-700 to-slate-900 
                text-white font-semibold text-sm
                shadow-sm ring-1 ring-slate-900/10
                transition-all duration-300
                group-hover/sidebar:scale-95 group-hover/sidebar:shadow-md
                hover:ring-2 hover:ring-slate-400
                shrink-0
                animate-[pulse_3s_ease-in-out_infinite]
              ">
                {initials}
              </div>
              <div
                className="
                  min-w-0
                  opacity-0 -translate-x-1 scale-95
                  group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0 group-hover/sidebar:scale-100
                  transition-all duration-300 delay-100
                "
              >
                <p className="text-sm font-medium truncate">Logged in</p>
                {email && <p className="text-xs text-slate-500 truncate">{email}</p>}
              </div>
            </div>

            <Button
              variant="outline"
              className="
                w-full justify-start gap-2
                active:scale-[0.98] transition-all duration-200
                hover:bg-red-50 hover:text-red-600 hover:border-red-200
                group/logout
              "
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 transition-transform duration-200 group-hover/logout:translate-x-[-2px]" />
              <span
                className="
                  opacity-0 -translate-x-1
                  group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0
                  transition-all duration-200 delay-100
                "
              >
                Sign out
              </span>
            </Button>
          </div>
        </div>

        {/* subtle animated edge highlight */}
        <span
          aria-hidden
          className="
            pointer-events-none absolute right-0 top-0 h-full w-px
            bg-gradient-to-b from-transparent via-slate-300 to-transparent
            animate-[edgeGlow_2.4s_ease-in-out_infinite]
          "
        />
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      {/* Local keyframes for the fun bits */}
      <style>{`
        @keyframes brandPop {
          0% { transform: scale(.8) rotate(-6deg); opacity: .0 }
          60% { transform: scale(1.05) rotate(2deg); opacity: 1 }
          100% { transform: scale(1) rotate(0) }
        }
        @keyframes edgeGlow {
          0%,100% { opacity: .35 }
          50% { opacity: .7 }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
        @keyframes slideIn {
          0% { transform: translateX(-10px); opacity: 0.5 }
          100% { transform: translateX(0); opacity: 1 }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(-100%) }
          50% { transform: translateX(100%) }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(51, 65, 85, 0.1) }
          50% { box-shadow: 0 0 0 4px rgba(51, 65, 85, 0.05) }
        }
      `}</style>
    </div>
  )
}
