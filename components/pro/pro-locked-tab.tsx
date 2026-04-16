"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, BarChart3, Calculator, ShoppingCart, Boxes, Zap } from "lucide-react"

interface ProLockedTabProps {
  tabName: "analytics" | "finance" | "reorder"
}

const TAB_INFO = {
  analytics: {
    title: "Analytics",
    description: "Track revenue, shipping volume, and performance trends over time.",
    icon: BarChart3,
    features: [
      "Revenue charts with quarterly CSV import",
      "US state distribution heatmap",
      "Day-of-week shipping patterns",
      "Time period filters (7d, 2w, 1mo, etc.)",
      "Automatic shipping volume tracking",
    ],
  },
  finance: {
    title: "Finance",
    description: "Calculate profitability, track taxes, and prepare for quarterly filings.",
    icon: Calculator,
    features: [
      "Profitability engine with COGS tracking",
      "1099-K threshold monitoring",
      "Schedule C deduction categories",
      "Monthly P&L statements",
      "IRS quarterly due date reminders",
    ],
  },
  reorder: {
    title: "Reorder",
    description: "Never run out of stock with velocity-based reorder suggestions.",
    icon: ShoppingCart,
    features: [
      "Low stock alerts with days remaining",
      "Shipping velocity calculations",
      "Suggested reorder quantities",
      "Supplier profile management",
      "Component BOM tracking",
    ],
  },
}

export function ProLockedTab({ tabName }: ProLockedTabProps) {
  const info = TAB_INFO[tabName]
  const Icon = info.icon

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {info.title}
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              PRO
            </span>
          </CardTitle>
          <CardDescription className="text-base">
            {info.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {info.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button className="w-full" size="lg" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Pro features are currently in development.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview Cards */}
      <div className="mt-6 grid gap-4">
        {tabName === "analytics" && (
          <Card className="border-dashed border-muted-foreground/20 bg-muted/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-5 h-5 text-warning" />
                <span className="font-medium">Shipping Volume (Free Preview)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Basic shipping volume is automatically tracked with every Ship & Archive. 
                Upgrade to Pro for full revenue analytics and CSV import.
              </p>
            </CardContent>
          </Card>
        )}
        
        {tabName === "reorder" && (
          <Card className="border-dashed border-muted-foreground/20 bg-muted/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Boxes className="w-5 h-5 text-warning" />
                <span className="font-medium">Low Stock Alerts (Free)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The Inventory tab already shows LOW and OUT badges. 
                Pro adds velocity-based predictions and supplier management.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
