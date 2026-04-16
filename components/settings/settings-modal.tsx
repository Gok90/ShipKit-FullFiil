'use client'

import { useState, useEffect } from 'react'
import { X, Volume2, VolumeX, Play, Trash2, Plus, Database, Download, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import { useAudio } from '@/hooks/use-audio'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, updateSettings, colors, packTypes, aliases, addAlias, removeAlias } = useShipKit()
  const { playTone, getAvailableVoices } = useAudio()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  
  // Local state for form
  const [storeName, setStoreName] = useState('')
  const [primaryZoneName, setPrimaryZoneName] = useState('')
  const [secondaryZoneName, setSecondaryZoneName] = useState('')
  const [carrierCloseWeekday, setCarrierCloseWeekday] = useState('')
  const [carrierCloseSaturday, setCarrierCloseSaturday] = useState('')
  const [carrierCloseSunday, setCarrierCloseSunday] = useState('')
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(15)
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [restockTargetDays, setRestockTargetDays] = useState(14)
  const [printerFormat, setPrinterFormat] = useState<'thermal_4x6' | 'standard_8x11'>('thermal_4x6')
  const [audioMode, setAudioMode] = useState<'tones' | 'voice'>('tones')
  const [voiceId, setVoiceId] = useState('')
  const [audioVolume, setAudioVolume] = useState(80)
  const [audioMuted, setAudioMuted] = useState(false)
  
  // Alias form state
  const [newAliasName, setNewAliasName] = useState('')
  const [newAliasColorId, setNewAliasColorId] = useState('')
  const [newAliasPackTypeId, setNewAliasPackTypeId] = useState('')
  
  // Load settings into form
  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName)
      setPrimaryZoneName(settings.primaryZoneName)
      setSecondaryZoneName(settings.secondaryZoneName)
      setCarrierCloseWeekday(settings.carrierCloseWeekday ?? '')
      setCarrierCloseSaturday(settings.carrierCloseSaturday ?? '')
      setCarrierCloseSunday(settings.carrierCloseSunday ?? '')
      setTravelTimeMinutes(settings.travelTimeMinutes)
      setLowStockThreshold(settings.lowStockThreshold)
      setRestockTargetDays(settings.restockTargetDays)
      setPrinterFormat(settings.printerFormat)
      setAudioMode(settings.audioMode)
      setVoiceId(settings.voiceId ?? '')
      setAudioVolume(settings.audioVolume)
      setAudioMuted(settings.audioMuted)
    }
  }, [settings])
  
  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      setVoices(getAvailableVoices())
    }
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
    }
  }, [getAvailableVoices])
  
  const handleSave = async () => {
    await updateSettings({
      storeName,
      primaryZoneName,
      secondaryZoneName,
      carrierCloseWeekday: carrierCloseWeekday || null,
      carrierCloseSaturday: carrierCloseSaturday || null,
      carrierCloseSunday: carrierCloseSunday || null,
      travelTimeMinutes,
      lowStockThreshold,
      restockTargetDays,
      printerFormat,
      audioMode,
      voiceId: voiceId || null,
      audioVolume,
      audioMuted
    })
    onOpenChange(false)
  }
  
  const handleAddAlias = async () => {
    if (!newAliasName || !newAliasColorId || !newAliasPackTypeId) return
    await addAlias(newAliasName, newAliasColorId, newAliasPackTypeId)
    setNewAliasName('')
    setNewAliasColorId('')
    setNewAliasPackTypeId('')
  }
  
  const handleVolumePreview = (value: number[]) => {
    setAudioVolume(value[0])
    playTone(440, 0.1)
  }
  
  const getColorName = (colorId: string) => colors.find(c => c.id === colorId)?.name ?? 'Unknown'
  const getPackTypeName = (packTypeId: string) => packTypes.find(p => p.id === packTypeId)?.name ?? 'Unknown'
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="carrier">Carrier</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="aliases">Aliases</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryZone">Primary Zone Name</Label>
                <Input
                  id="primaryZone"
                  value={primaryZoneName}
                  onChange={(e) => setPrimaryZoneName(e.target.value)}
                  placeholder="Manifest"
                />
                <p className="text-xs text-muted-foreground">For expected packages from CSV</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryZone">Secondary Zone Name</Label>
                <Input
                  id="secondaryZone"
                  value={secondaryZoneName}
                  onChange={(e) => setSecondaryZoneName(e.target.value)}
                  placeholder="Clerk Counter"
                />
                <p className="text-xs text-muted-foreground">For unexpected packages</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lowStock">Low Stock Threshold</Label>
                <Input
                  id="lowStock"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restockDays">Restock Target Days</Label>
                <Input
                  id="restockDays"
                  type="number"
                  min="1"
                  value={restockTargetDays}
                  onChange={(e) => setRestockTargetDays(parseInt(e.target.value) || 14)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Label Printer Format</Label>
              <Select value={printerFormat} onValueChange={(v) => setPrinterFormat(v as typeof printerFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal_4x6">4x6" Thermal (Recommended)</SelectItem>
                  <SelectItem value="standard_8x11">8.5x11" Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* Carrier Tab */}
          <TabsContent value="carrier" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Carrier Close Times</Label>
              <p className="text-xs text-muted-foreground">When your carrier stops accepting packages</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closeWeekday">Weekday</Label>
                <Input
                  id="closeWeekday"
                  type="time"
                  value={carrierCloseWeekday}
                  onChange={(e) => setCarrierCloseWeekday(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeSaturday">Saturday</Label>
                <Input
                  id="closeSaturday"
                  type="time"
                  value={carrierCloseSaturday}
                  onChange={(e) => setCarrierCloseSaturday(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeSunday">Sunday</Label>
                <Input
                  id="closeSunday"
                  type="time"
                  value={carrierCloseSunday}
                  onChange={(e) => setCarrierCloseSunday(e.target.value)}
                  placeholder="Closed"
                />
                <p className="text-xs text-muted-foreground">Leave empty if closed</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="travelTime">Travel Time to Carrier (minutes)</Label>
              <Input
                id="travelTime"
                type="number"
                min="0"
                value={travelTimeMinutes}
                onChange={(e) => setTravelTimeMinutes(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Deadline will be calculated as close time minus travel time
              </p>
            </div>
          </TabsContent>
          
          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Mute All Audio</Label>
                <p className="text-xs text-muted-foreground">Silence all sounds and voice</p>
              </div>
              <Switch
                checked={audioMuted}
                onCheckedChange={setAudioMuted}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Audio Mode</Label>
              <Select value={audioMode} onValueChange={(v) => setAudioMode(v as typeof audioMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tones">Tones (Pentatonic)</SelectItem>
                  <SelectItem value="voice">Spoken Words</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {audioMode === 'voice' && (
              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.slice(0, 10).map(voice => (
                      <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{audioVolume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[audioVolume]}
                  onValueChange={handleVolumePreview}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => playTone(440, 0.2)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Preview Sound
            </Button>
          </TabsContent>
          
          {/* Aliases Tab */}
          <TabsContent value="aliases" className="space-y-4 mt-4">
            <div>
              <Label>Variant Alias Manager</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Map TikTok&apos;s variant names to your inventory. These aliases are always visible as pills.
              </p>
            </div>
            
            {/* Existing Aliases */}
            <div className="flex flex-wrap gap-2">
              {aliases.map(alias => (
                <Badge
                  key={alias.id}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <span className="text-xs">
                    {alias.tiktokName} → {getColorName(alias.colorId)} / {getPackTypeName(alias.packTypeId)}
                  </span>
                  <button
                    onClick={() => removeAlias(alias.id)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {aliases.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No aliases defined yet. Add one below.
                </p>
              )}
            </div>
            
            {/* Add Alias Form */}
            <div className="p-4 rounded-lg border bg-secondary/30 space-y-3">
              <Label>Add New Alias</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  placeholder="TikTok variant name"
                  value={newAliasName}
                  onChange={(e) => setNewAliasName(e.target.value)}
                />
                <Select value={newAliasColorId} onValueChange={setNewAliasColorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newAliasPackTypeId} onValueChange={setNewAliasPackTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pack Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {packTypes.map(packType => (
                      <SelectItem key={packType.id} value={packType.id}>
                        {packType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddAlias}
                disabled={!newAliasName || !newAliasColorId || !newAliasPackTypeId}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Alias
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Data Section */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="w-4 h-4" />
              <span>Storage: 2.1 / 5.0 MB</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
