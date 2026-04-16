"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Package, Clock, Printer, Truck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import type { Settings } from "@/lib/types"

interface SetupWizardProps {
  open: boolean
  onComplete: () => void
}

const STEPS = [
  { id: 1, title: "Store Name", icon: Package },
  { id: 2, title: "Carrier Times", icon: Clock },
  { id: 3, title: "Zone Names", icon: Truck },
  { id: 4, title: "Printer", icon: Printer },
  { id: 5, title: "Complete", icon: CheckCircle2 },
]

export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Partial<Settings>>({
    storeName: "",
    primaryZoneName: "Manifest",
    secondaryZoneName: "Clerk Counter",
    carrierCloseWeekday: "17:00",
    carrierCloseSaturday: "14:00",
    carrierCloseSunday: null,
    travelTimeMinutes: 15,
    printerFormat: "thermal_4x6",
  })
  
  if (!open) return null

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    setError(null)
    
    if (step < 5) {
      setStep(step + 1)
    } else {
      // Save settings to database
      setIsSubmitting(true)
      try {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...settings, setupComplete: true })
        })
        if (response.ok) {
          onComplete()
        } else {
          const data = await response.json().catch(() => ({}))
          setError(data.error || `Failed to save (HTTP ${response.status})`)
        }
      } catch (err) {
        console.error('Failed to save settings:', err)
        setError('Network error. Please check your connection and try again.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return settings.storeName && settings.storeName.trim().length > 0
      case 2:
        return settings.carrierCloseWeekday
      case 3:
        return settings.primaryZoneName && settings.secondaryZoneName
      case 4:
        return settings.printerFormat
      default:
        return true
    }
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  step >= s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <s.icon className="w-5 h-5" />
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-1",
                    step > s.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Welcome to ShipKit"}
              {step === 2 && "Carrier Schedule"}
              {step === 3 && "Name Your Zones"}
              {step === 4 && "Printer Setup"}
              {step === 5 && "You're All Set!"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Let's get your fulfillment station set up in just a few steps."}
              {step === 2 && "When does your carrier close for pickup?"}
              {step === 3 && "What do you call your sorting zones?"}
              {step === 4 && "What kind of label printer do you use?"}
              {step === 5 && "Your ShipKit is configured and ready to go."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Store Name */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    placeholder="My TikTok Shop"
                    value={settings.storeName || ""}
                    onChange={(e) => updateSettings({ storeName: e.target.value })}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">
                    This appears in your batch history and exports.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Carrier Times */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekday">Weekdays</Label>
                    <Input
                      id="weekday"
                      type="time"
                      value={settings.carrierCloseWeekday || "17:00"}
                      onChange={(e) => updateSettings({ carrierCloseWeekday: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturday">Saturday</Label>
                    <Input
                      id="saturday"
                      type="time"
                      value={settings.carrierCloseSaturday || "14:00"}
                      onChange={(e) => updateSettings({ carrierCloseSaturday: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sunday">Sunday</Label>
                    <Input
                      id="sunday"
                      type="time"
                      value={settings.carrierCloseSunday || ""}
                      onChange={(e) => updateSettings({ carrierCloseSunday: e.target.value || null })}
                      placeholder="Closed"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty if closed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travel">Travel Time (minutes)</Label>
                  <Input
                    id="travel"
                    type="number"
                    min={0}
                    max={120}
                    value={settings.travelTimeMinutes || 15}
                    onChange={(e) => updateSettings({ travelTimeMinutes: parseInt(e.target.value) || 0 })}
                    className="w-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    How long it takes you to get to the carrier drop-off.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Zone Names */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Zone Name</Label>
                  <Input
                    id="primary"
                    placeholder="Manifest"
                    value={settings.primaryZoneName || ""}
                    onChange={(e) => updateSettings({ primaryZoneName: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Where packages from the CSV manifest go (e.g., "Manifest", "Sort Zone", "FedEx Bin")
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary">Secondary Zone Name</Label>
                  <Input
                    id="secondary"
                    placeholder="Clerk Counter"
                    value={settings.secondaryZoneName || ""}
                    onChange={(e) => updateSettings({ secondaryZoneName: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Where packages NOT in the CSV go (e.g., "Clerk Counter", "Counter", "Drop Location")
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Printer */}
            {step === 4 && (
              <div className="space-y-4">
                <RadioGroup
                  value={settings.printerFormat || "thermal_4x6"}
                  onValueChange={(value) => updateSettings({ printerFormat: value as "thermal_4x6" | "standard_8x11" })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="thermal_4x6" id="thermal" />
                    <Label htmlFor="thermal" className="flex-1 cursor-pointer">
                      <div className="font-medium">4x6" Thermal Printer</div>
                      <div className="text-sm text-muted-foreground">
                        Standard shipping label printer (recommended)
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="standard_8x11" id="standard" />
                    <Label htmlFor="standard" className="flex-1 cursor-pointer">
                      <div className="font-medium">8.5x11" Standard Printer</div>
                      <div className="text-sm text-muted-foreground">
                        Regular paper printer with cut labels
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 5 && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">{settings.storeName} is ready!</p>
                  <p className="text-muted-foreground">
                    Drop your TikTok files to start your first batch.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-left space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Primary Zone:</span> {settings.primaryZoneName}</p>
                  <p><span className="text-muted-foreground">Secondary Zone:</span> {settings.secondaryZoneName}</p>
                  <p><span className="text-muted-foreground">Carrier Close:</span> {settings.carrierCloseWeekday} (weekdays)</p>
                  <p><span className="text-muted-foreground">Printer:</span> {settings.printerFormat === "thermal_4x6" ? "4x6\" Thermal" : "8.5x11\" Standard"}</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? "Saving..." : step === 5 ? "Start Using ShipKit" : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
