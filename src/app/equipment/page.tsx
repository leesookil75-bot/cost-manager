import { getEquipments, getParts } from '@/lib/actions';
import EquipmentClient from './EquipmentClient';

export const dynamic = 'force-dynamic';

export default async function EquipmentPage() {
    const equipments = await getEquipments();
    const parts = await getParts(); // Loaded once to be used in the BOM selector

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">기구 및 BOM 명세서</h1>
                <p className="text-zinc-400 mt-2">생산할 기구(완성품)를 등록하고, 각 기구에 들어가는 원자재(BOM)를 매핑하여 실시간 총 원가를 확인합니다.</p>
            </header>

            <main>
                <EquipmentClient initialEquipments={equipments} allParts={parts} />
            </main>
        </div>
    );
}
