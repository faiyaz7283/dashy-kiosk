/**
 * Root application shell — full-viewport layout with header, sidebar, status bar,
 * and content area.
 *
 * The shell provides the structural layout that all features render within.
 * Auto-hide behavior shows/hides shell elements based on cursor proximity to edges.
 * The content area fills the entire viewport with shell elements overlaying on top.
 *
 * Layout structure:
 * - Header: top edge, full width, fixed height (auto-hide)
 * - Sidebar: left edge, collapsible (icon-only / expanded), auto-hide
 * - Status bar: bottom edge, full width, fixed height (auto-hide)
 * - Content: fills entire viewport, shell elements overlay on top
 */

import { useState, useCallback, useMemo } from 'react'
import { useUiScale } from '@/shared/hooks/useUiScale'
import { useAutoHide } from '@/shared/hooks/useAutoHide'
import { useSidebarState } from '@/shared/hooks/useSidebarState'
import { useTheme, type ThemeMode } from '@/shared/hooks/useTheme'
import { useViewNavigation } from '@/shared/hooks/useViewNavigation'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { useWeatherData } from '@/features/weather/hooks/useWeatherData'
import { useChoresData } from '@/features/chores/hooks/useChoresData'
import { useChoreActions } from '@/features/chores/hooks/useChoreActions'
import { CalendarDataProvider, useCalendarContext } from '@/features/calendar/context'
import { Header } from './Header'
import { Sidebar, type Feature } from './Sidebar'
import { StatusBar } from './StatusBar'
import type { ChoresViewMode } from './HeaderChores'
import { DayView } from '@/features/calendar/views/DayView'
import { WeekView } from '@/features/calendar/views/WeekView'
import { MonthView } from '@/features/calendar/views/MonthView'
import { YearView } from '@/features/calendar/views/YearView'
import { findFirstAdult } from '@/shared/utils/family'
import { ChoresView } from '@/features/chores/views/ChoresView'
import type { CalendarView } from '@/types'
import type { ChoreInstance, MasterChore } from '@/types/chores'
import type { FamilyMember } from '@/types/family'

/**
 * Root application layout component.
 *
 * Applies UI scaling, manages shell state (auto-hide, sidebar, theme, view),
 * and renders the interactive shell with Header, Sidebar, and StatusBar.
 *
 * @returns The full-viewport application shell with interactive navigation.
 */
export default function AppShell() {
  useUiScale()

  const [activeFeature, setActiveFeature] = useState<Feature>('calendar')
  const { isExpanded: isSidebarExpanded, toggle: toggleSidebar } = useSidebarState()
  const { mode: themeMode, cycleMode } = useTheme()
  const { currentView, setCurrentView, currentDate, navigatePrevious, navigateNext, navigateToday } = useViewNavigation()

  const { members } = useFamilyData()
  const { lastRefresh: weatherLastRefresh } = useWeatherData()
  const { data: choresData, isLoading: choresLoading, refetch: refetchChores } = useChoresData()

  return (
    <CalendarDataProvider currentView={currentView} currentDate={currentDate}>
      <AppShellContent
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        isSidebarExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
        themeMode={themeMode}
        cycleMode={cycleMode}
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentDate={currentDate}
        navigatePrevious={navigatePrevious}
        navigateNext={navigateNext}
        navigateToday={navigateToday}
        members={members}
        weatherLastRefresh={weatherLastRefresh}
        choresData={choresData}
        choresLoading={choresLoading}
        refetchChores={refetchChores}
      />
    </CalendarDataProvider>
  )
}

/**
 * Inner AppShell component that has access to calendar context.
 *
 * Separated from AppShell to allow CalendarDataProvider to wrap it.
 */
interface AppShellContentProps {
  activeFeature: Feature
  setActiveFeature: (feature: Feature) => void
  isSidebarExpanded: boolean
  toggleSidebar: () => void
  themeMode: ThemeMode
  cycleMode: () => void
  currentView: CalendarView
  setCurrentView: (view: CalendarView) => void
  currentDate: Temporal.PlainDate
  navigatePrevious: () => void
  navigateNext: () => void
  navigateToday: () => void
  members: FamilyMember[]
  weatherLastRefresh: number | null
  choresData: ReturnType<typeof useChoresData>['data']
  choresLoading: boolean
  refetchChores: () => void
}

function AppShellContent({
  activeFeature,
  setActiveFeature,
  isSidebarExpanded,
  toggleSidebar,
  themeMode,
  cycleMode,
  currentView,
  setCurrentView,
  currentDate,
  navigatePrevious,
  navigateNext,
  navigateToday,
  members,
  weatherLastRefresh,
  choresData,
  choresLoading,
  refetchChores,
}: AppShellContentProps) {
  const { events, lastRefresh: calendarLastRefresh, refetch: refetchCalendar } = useCalendarContext()
  const choreActions = useChoreActions(refetchChores)

  // Instance action handlers
  const actorId = useMemo(() => {
    const adult = findFirstAdult(members)
    return adult?.key ?? members[0]?.key ?? 'unknown'
  }, [members])

  const handleStartInstance = useCallback(
    async (instance: ChoreInstance) => {
      try {
        await choreActions.updateInstanceStatus(instance.id, 'in_progress', actorId)
      } catch (error) {
        console.error('Failed to start instance:', error)
      }
    },
    [choreActions, actorId],
  )

  const handleCompleteInstance = useCallback(
    async (instance: ChoreInstance) => {
      try {
        await choreActions.updateInstanceStatus(instance.id, 'completed', actorId)
      } catch (error) {
        console.error('Failed to complete instance:', error)
      }
    },
    [choreActions, actorId],
  )

  const handleViewTemplate = useCallback(
    (master: MasterChore) => {
      setEditingMaster(master)
      setShowMasterModal(true)
    },
    [],
  )

  // Chores view state
  const [choresViewMode, setChoresViewMode] = useState<ChoresViewMode>('board')
  const [selectedMasterIds, setSelectedMasterIds] = useState<Set<string>>(new Set())
  const [showMasterModal, setShowMasterModal] = useState(false)
  const [editingMaster, setEditingMaster] = useState<MasterChore | null>(null)

  // Auto-hide behavior
  const { isVisible: isHeaderVisible, elementRef: headerRef } = useAutoHide({ edge: 'top' })
  const { isVisible: isSidebarVisible, elementRef: sidebarRef } = useAutoHide({ edge: 'left' })
  const { isVisible: isStatusBarVisible, elementRef: statusBarRef } = useAutoHide({ edge: 'bottom' })

  // Feature navigation
  const handleFeatureChange = useCallback((feature: Feature) => {
    setActiveFeature(feature)
  }, [setActiveFeature])

  // Sidebar add chore → switch to chores + manage-current view
  const handleSidebarAddChore = useCallback(() => {
    setActiveFeature('chores')
    setChoresViewMode('manage-current')
  }, [setActiveFeature])

  // Chores selection
  const handleToggleSelect = useCallback((masterId: string) => {
    setSelectedMasterIds((prev) => {
      const next = new Set(prev)
      if (next.has(masterId)) {
        next.delete(masterId)
      } else {
        next.add(masterId)
      }
      return next
    })
  }, [])

  // Compute selectable IDs for the current view
  const selectableIds = useMemo(() => {
    if (!choresData) return []
    if (choresViewMode === 'manage-current') {
      return choresData.master_chores
        .filter((m) => m.status === 'active' || m.status === 'inactive')
        .map((m) => m.id)
    }
    if (choresViewMode === 'manage-archived') {
      return choresData.master_chores
        .filter((m) => m.status === 'archived')
        .map((m) => m.id)
    }
    return []
  }, [choresData, choresViewMode])

  const handleSelectAll = useCallback(() => {
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedMasterIds.has(id))
    if (allSelected) {
      setSelectedMasterIds(new Set())
    } else {
      setSelectedMasterIds(new Set(selectableIds))
    }
  }, [selectableIds, selectedMasterIds])

  const handleClearSelection = useCallback(() => {
    setSelectedMasterIds(new Set())
  }, [])

  // Clear selection when view mode changes
  const handleViewChange = useCallback((mode: ChoresViewMode) => {
    setChoresViewMode(mode)
    setSelectedMasterIds(new Set())
  }, [])

  // Bulk actions
  const selectedIdsArray = useMemo(() => Array.from(selectedMasterIds), [selectedMasterIds])

  const handlePauseSelected = useCallback(async () => {
    if (selectedIdsArray.length === 0) return
    await choreActions.bulkUpdateMasterStatus(selectedIdsArray, 'inactive')
    handleClearSelection()
  }, [selectedIdsArray, choreActions, handleClearSelection])

  const handleArchiveSelected = useCallback(async () => {
    if (selectedIdsArray.length === 0) return
    await choreActions.bulkUpdateMasterStatus(selectedIdsArray, 'archived')
    handleClearSelection()
  }, [selectedIdsArray, choreActions, handleClearSelection])

  const handleRestoreSelected = useCallback(async () => {
    if (selectedIdsArray.length === 0) return
    await choreActions.bulkUpdateMasterStatus(selectedIdsArray, 'active')
    handleClearSelection()
  }, [selectedIdsArray, choreActions, handleClearSelection])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIdsArray.length === 0) return
    await Promise.all(selectedIdsArray.map((id) => choreActions.deleteMaster(id)))
    handleClearSelection()
  }, [selectedIdsArray, choreActions, handleClearSelection])

  // Master chore modal
  const handleCreateMaster = useCallback(() => {
    setEditingMaster(null)
    setShowMasterModal(true)
  }, [])

  const handleEditMaster = useCallback((master: MasterChore) => {
    setEditingMaster(master)
    setShowMasterModal(true)
  }, [])

  const handleCloseMasterModal = useCallback(() => {
    setShowMasterModal(false)
    setEditingMaster(null)
  }, [])

  const handleMasterSuccess = useCallback(() => {
    setShowMasterModal(false)
    setEditingMaster(null)
  }, [])

  // Per-card actions (for manage views)
  const handleToggleStatus = useCallback(
    async (master: MasterChore) => {
      const newStatus = master.status === 'active' ? 'inactive' : 'active'
      await choreActions.bulkUpdateMasterStatus([master.id], newStatus)
    },
    [choreActions],
  )

  const handleArchive = useCallback(
    async (master: MasterChore) => {
      await choreActions.bulkUpdateMasterStatus([master.id], 'archived')
    },
    [choreActions],
  )

  const handleRestore = useCallback(
    async (master: MasterChore) => {
      await choreActions.bulkUpdateMasterStatus([master.id], 'active')
    },
    [choreActions],
  )

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg font-sans text-text-primary">
      {/* Header with auto-hide */}
      <div
        ref={headerRef}
        className={`absolute top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <Header
          activeFeature={activeFeature}
          currentView={currentView}
          onViewChange={setCurrentView}
          onToday={navigateToday}
          members={members}
          events={events}
          choresViewMode={choresViewMode}
          onChoresViewChange={handleViewChange}
          selectedMasterCount={selectedMasterIds.size}
          onSelectAll={handleSelectAll}
          onPauseSelected={handlePauseSelected}
          onArchiveSelected={handleArchiveSelected}
          onRestoreSelected={handleRestoreSelected}
          onDeleteSelected={handleDeleteSelected}
          onCreateMaster={handleCreateMaster}
        />
      </div>

      {/* Sidebar with auto-hide — adjusts top/bottom to avoid header/status bar overlap */}
      <div
        ref={sidebarRef}
        className={`absolute left-0 z-40 transition-all duration-400 ease-in-out ${
          isSidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          top: isHeaderVisible ? 'var(--shell-header-height)' : 0,
          bottom: isStatusBarVisible ? 'var(--shell-status-bar-height)' : 0,
        }}
      >
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
          activeFeature={activeFeature}
          onFeatureChange={handleFeatureChange}
          onRefreshCalendar={refetchCalendar}
          onAddChore={handleSidebarAddChore}
        />
      </div>

      {/* Status bar with auto-hide */}
      <div
        ref={statusBarRef}
        className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
          isStatusBarVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <StatusBar
          activeFeature={activeFeature}
          themeMode={themeMode}
          onThemeCycle={cycleMode}
          calendarLastRefresh={calendarLastRefresh}
          weatherLastRefresh={weatherLastRefresh}
        />
      </div>

      {/* Main content area — fills entire viewport, shell elements overlay on top */}
      <main className="flex h-full w-full flex-col">
        {activeFeature === 'calendar' && (
          <>
            {currentView === 'day' && (
              <DayView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'week' && (
              <WeekView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'month' && (
              <MonthView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'year' && (
              <YearView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
          </>
        )}
        {activeFeature === 'chores' && (
          <ChoresView
            members={members}
            viewMode={choresViewMode}
            data={choresData}
            isLoading={choresLoading}
            error={null}
            selectedIds={selectedMasterIds}
            onToggleSelect={handleToggleSelect}
            onEditMaster={handleEditMaster}
            onToggleStatus={handleToggleStatus}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onStartInstance={handleStartInstance}
            onCompleteInstance={handleCompleteInstance}
            onViewTemplate={handleViewTemplate}
            showMasterModal={showMasterModal}
            editingMaster={editingMaster}
            onCloseMasterModal={handleCloseMasterModal}
            onMasterSuccess={handleMasterSuccess}
            refetch={refetchChores}
          />
        )}
      </main>
    </div>
  )
}
