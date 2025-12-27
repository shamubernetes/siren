import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AlertView } from './types'

type AlertFiltersProps = {
  searchText: string
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  view: AlertView
  onViewChange: (value: string) => void
  severityFilter: string
  onSeverityChange: (value: string | null) => void
  severityOptions: Array<string>
  filteredCount: number
  totalCount: number
}

export function AlertFilters({
  searchText,
  onSearchChange,
  view,
  onViewChange,
  severityFilter,
  onSeverityChange,
  severityOptions,
  filteredCount,
  totalCount,
}: AlertFiltersProps) {
  return (
    <section className="mt-4 rounded-lg border bg-card p-3 shadow-sm sm:mt-6 sm:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="relative w-full md:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search alerts"
            placeholder="Search labels / annotations…"
            value={searchText}
            onChange={onSearchChange}
            className="pl-9"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Tabs value={view} onValueChange={onViewChange}>
            <TabsList
              aria-label="Alert state filter"
              className="w-full sm:w-fit"
            >
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="firing">Firing</TabsTrigger>
              <TabsTrigger value="silenced">Silenced</TabsTrigger>
              <TabsTrigger value="inhibited">Inhibited</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={severityFilter} onValueChange={onSeverityChange}>
            <SelectTrigger
              className="w-full sm:w-44"
              aria-label="Filter by severity"
            >
              <SelectValue>Severity</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {severityOptions.map((sev: string) => (
                <SelectItem key={sev} value={sev}>
                  {sev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-3 sm:my-4" />

      <div className="text-xs text-muted-foreground sm:text-sm">
        Showing{' '}
        <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount}</span>
      </div>
    </section>
  )
}
