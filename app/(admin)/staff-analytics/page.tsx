import dynamic from 'next/dynamic'

const AiStaffPerformance = dynamic(() => import('@/components/ai-staff-performance').then(mod => mod.AiStaffPerformance))

export default function StaffAnalyticsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <AiStaffPerformance />
        </div>
      </div>
    </div>
  )
}
