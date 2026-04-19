import Link from "next/link";
import { getDashboardStats } from "@/lib/actions";

export default async function Home() {
  const stats = await getDashboardStats();

  const formatPrice = (p: number) => p.toLocaleString();

  // Find the highest cost equipment for relative bar scaling
  const maxCost = stats?.equipments && stats.equipments.length > 0 
    ? Math.max(...stats.equipments.map(e => Number(e.total_cost || 0))) 
    : 0;

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">원가 분석 대시보드</h1>
        <p className="text-zinc-400 mt-2">필라테스 기구별 재료비 지표와 등록된 원자재 현황을 한눈에 파악합니다.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-medium text-zinc-400">등록된 완성품 기구</h3>
          <p className="text-3xl font-extrabold text-white mt-2">{stats?.equipments.length || 0} 개</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-medium text-zinc-400">관리 중인 원자재 (부품)</h3>
          <p className="text-3xl font-extrabold text-white mt-2">{stats?.totalParts || 0} 개</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-900/50 to-zinc-900 border border-indigo-500/30 rounded-xl p-6 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
          <h3 className="text-sm font-medium text-indigo-300">평균 기구 원가</h3>
          <p className="text-3xl font-extrabold text-white mt-2">
            {stats?.equipments.length ? formatPrice(Math.round(stats.equipments.reduce((acc, curr) => acc + Number(curr.total_cost), 0) / stats.equipments.length)) : 0} 원
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Cost Bar Chart Area */}
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-indigo-400">📊</span> 기구별 총 재료비 현황
            </h2>
            <Link href="/equipment" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">관리하기 &rarr;</Link>
          </div>
          
          <div className="space-y-6 mt-4">
            {!stats || stats.equipments.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                아직 등록된 기계 및 BOM이 없습니다.
              </div>
            ) : (
              stats.equipments.map(eq => {
                const costNumber = Number(eq.total_cost || 0);
                const percent = maxCost > 0 ? (costNumber / maxCost) * 100 : 0;
                return (
                  <div key={eq.id} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-white">{eq.name} <span className="text-xs font-normal text-zinc-500 ml-1">{eq.code}</span></span>
                      <span className="font-bold text-amber-400">{formatPrice(costNumber)} 원</span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-zinc-800 relative">
                      <div 
                        className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Expensive Parts List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-red-400">🔥</span> 최고가 원자재 TOP 5
            </h2>
            <Link href="/parts" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">단가 관리</Link>
          </div>
          
          <ul className="space-y-1">
            {!stats || stats.topParts.length === 0 ? (
              <li className="text-zinc-500 text-sm text-center py-4">데이터가 없습니다.</li>
            ) : (
              stats.topParts.map((part, index) => (
                <li key={index} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 px-2 rounded -mx-2 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xs font-bold w-4 text-center text-zinc-500">{index + 1}</span>
                    <span className="text-sm font-medium text-white truncate">{part.name}</span>
                  </div>
                  <span className="text-sm font-bold text-red-400 whitespace-nowrap ml-4">{formatPrice(Number(part.unit_price))} 원</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
