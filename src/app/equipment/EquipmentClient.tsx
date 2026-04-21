'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Equipment, Part } from '@/lib/types';
import { addEquipment, getEquipmentBOM, BOMDetails, addBOMItem, removeBOMItem } from '@/lib/actions';
import * as XLSX from 'xlsx';

interface Props {
    initialEquipments: Equipment[];
    allParts: Part[];
}

export default function EquipmentClient({ initialEquipments, allParts }: Props) {
    const router = useRouter();
    const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
    const [isPending, startTransition] = useTransition();
    
    // New Equipment Form
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    // Selected Equipment State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [bomItems, setBomItems] = useState<BOMDetails[]>([]);
    const [isBomLoading, setIsBomLoading] = useState(false);

    // BOM Add Form
    const [selectedPartId, setSelectedPartId] = useState('');
    const [qty, setQty] = useState<number | ''>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Reload equipments when BOM changes directly by refetching page.
    const reloadPage = () => router.refresh();

    const handleAddEquipment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        startTransition(async () => {
            const res = await addEquipment(name, code);
            if (res.success) {
                alert('기구가 등록되었습니다.');
                router.refresh();
            } else {
                alert('등록 실패: ' + res.error);
            }
        });
    };

    const loadBOM = async (id: string) => {
        setSelectedId(id);
        setIsBomLoading(true);
        const data = await getEquipmentBOM(id);
        setBomItems(data);
        setIsBomLoading(false);
    };

    const handleAddBOMItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !selectedPartId || qty === '' || qty <= 0) return;

        const res = await addBOMItem(selectedId, selectedPartId, Number(qty));
        if (res.success) {
            // Optimistic reload
            await loadBOM(selectedId);
            setQty('');
        } else {
            alert('실패: ' + res.error);
        }
    };

    const handleRemoveBOMItem = async (bomId: string) => {
        if (!confirm('BOM에서 해당 부품을 제외하시겠습니까?')) return;
        const res = await removeBOMItem(bomId);
        if (res.success && selectedId) {
            await loadBOM(selectedId);
        }
    };

    const handleExportExcel = () => {
        if (!selectedEquipment) return;
        
        // Prepare data rows
        const rows = bomItems.map((item, index) => ({
            'No.': index + 1,
            '분류 태그': item.main_category || '-',
            '부품명': item.part_name,
            '규격': item.specs || '',
            '개당 단가': item.unit_price,
            '투입 수량': item.required_qty,
            '합산 비용': item.total_price
        }));

        // Calculate totals
        const totalCost = bomItems.reduce((acc, curr) => acc + Number(curr.total_price), 0);
        
        rows.push({
            'No.': '총합',
            '분류 태그': '',
            '부품명': '',
            '규격': '',
            '개당 단가': '',
            '투입 수량': '',
            '합산 비용': totalCost
        } as any);

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'BOM 조립 명세서');

        // Extract to file
        const safeName = selectedEquipment.name.replace(/[^a-z0-9가-힣]/gi, '_');
        XLSX.writeFile(wb, `${safeName}_원가명세서.xlsx`);
    };

    const selectedEquipment = equipments.find(e => e.id === selectedId);

    // Filter parts for the dropdown
    const filteredParts = allParts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.main_category && p.main_category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatPrice = (p: number) => p.toLocaleString();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT PANE: Equipments List */}
            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-indigo-400">⊕</span> 새 기구 등록
                    </h2>
                    <form onSubmit={handleAddEquipment} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">기구명 (Product) <span className="text-red-400">*</span></label>
                            <input 
                                required type="text" placeholder="예: 리포머 프리미엄형"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">모델 코드</label>
                            <input 
                                type="text" placeholder="예: REF-PRO-01"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                                value={code} onChange={e => setCode(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={isPending} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors">
                            기구 만들기
                        </button>
                    </form>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-0 overflow-hidden shadow-md flex-1">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                        <h2 className="font-bold">기구 목록</h2>
                        <button onClick={reloadPage} className="text-xs px-2 py-1 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-300">↻ 새로고침</button>
                    </div>
                    <ul className="divide-y divide-zinc-800 max-h-[500px] overflow-y-auto">
                        {equipments.map(eq => (
                            <li 
                                key={eq.id} 
                                onClick={() => loadBOM(eq.id)}
                                className={`p-4 cursor-pointer transition-colors ${selectedId === eq.id ? 'bg-indigo-900/40 border-l-4 border-indigo-500' : 'hover:bg-zinc-800 border-l-4 border-transparent'}`}
                            >
                                <div className="font-bold text-white">{eq.name}</div>
                                <div className="text-xs text-zinc-500">{eq.code || '코드 없음'}</div>
                                <div className="mt-2 text-sm text-amber-400 font-semibold flex justify-between">
                                    <span>총 원가:</span> 
                                    <span>{formatPrice(Number(eq.total_cost || 0))} 원</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT PANE: BOM Details */}
            <div className="lg:col-span-8">
                {selectedId && selectedEquipment ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl flex flex-col h-full min-h-[600px]">
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedEquipment.name} <span className="text-sm font-normal text-zinc-500 ml-2">{selectedEquipment.code}</span></h2>
                                <div className="flex gap-4">
                                    <span className="text-indigo-300 bg-indigo-950 px-3 py-1 rounded border border-indigo-900 text-sm">총 예상 원가 <strong className="text-indigo-100 ml-1">{formatPrice(bomItems.reduce((acc, curr) => acc + Number(curr.total_price), 0))} 원</strong></span>
                                    <span className="text-emerald-300 bg-emerald-950 px-3 py-1 rounded border border-emerald-900 text-sm">구성 부품 수 <strong className="text-emerald-100 ml-1">{bomItems.length} 개</strong></span>
                                </div>
                            </div>
                            <button 
                                onClick={handleExportExcel}
                                disabled={bomItems.length === 0}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg whitespace-nowrap transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                📥 엑셀 내보내기 (.xlsx)
                            </button>
                        </div>

                        {/* Add parts to BOM */}
                        <div className="p-4 border-b border-zinc-800 bg-zinc-950">
                            <form onSubmit={handleAddBOMItem} className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden focus-within:border-indigo-500">
                                        <input 
                                            type="text"
                                            placeholder="부품 검색 (이름/분류)"
                                            className="w-1/3 px-3 py-2 bg-zinc-900/50 border-r border-zinc-700 text-white focus:outline-none text-sm placeholder-zinc-500"
                                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                        />
                                        <select 
                                            required
                                            className="w-2/3 px-3 py-2 bg-transparent text-white focus:outline-none text-sm"
                                            value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}
                                        >
                                            <option value="" className="text-zinc-500">조립할 자재를 선택하세요...</option>
                                            {filteredParts.map(p => (
                                                <option key={p.id} value={p.id} className="bg-zinc-800">
                                                    [{p.main_category}] {p.name} - {formatPrice(p.unit_price)}원
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="w-full sm:w-24">
                                    <input 
                                        required min="1" type="number" 
                                        placeholder="필요수량" title="투입 개수"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                                        value={qty} onChange={e => setQty(e.target.value ? Number(e.target.value) : '')}
                                    />
                                </div>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-lg whitespace-nowrap transition-colors shadow">
                                    BOM 추가
                                </button>
                            </form>
                        </div>

                        {/* BOM Table */}
                        <div className="flex-1 overflow-x-auto p-4">
                            {isBomLoading ? (
                                <div className="flex justify-center items-center h-40 text-zinc-500">로딩 중...</div>
                            ) : bomItems.length === 0 ? (
                                <div className="flex flex-col justify-center items-center h-40 space-y-3">
                                    <span className="text-4xl">🛠️</span>
                                    <p className="text-zinc-500">아직 원자재가 하나도 없습니다. 상단에서 추가해 주세요!</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-zinc-300">
                                    <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                                        <tr>
                                            <th className="pb-3 text-center">대분류</th>
                                            <th className="pb-3">부품명(규격)</th>
                                            <th className="pb-3 text-right">단가</th>
                                            <th className="pb-3 text-center">투입 개수</th>
                                            <th className="pb-3 text-right text-indigo-400">합산 비용</th>
                                            <th className="pb-3 text-center w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {bomItems.map(item => (
                                            <tr key={item.bom_id} className="hover:bg-zinc-800/30">
                                                <td className="py-3 text-center text-xs text-zinc-400">{item.main_category || '-'}</td>
                                                <td className="py-3">
                                                    <div className="font-medium text-white">{item.part_name}</div>
                                                    {item.specs && <div className="text-[10px] text-zinc-500">{item.specs}</div>}
                                                </td>
                                                <td className="py-3 text-right text-zinc-400">{formatPrice(item.unit_price)}</td>
                                                <td className="py-3 text-center">
                                                    <span className="px-2 py-1 bg-zinc-800 rounded font-bold text-emerald-400">x {item.required_qty}</span>
                                                </td>
                                                <td className="py-3 text-right font-bold text-amber-400">{formatPrice(item.total_price)}</td>
                                                <td className="py-3 text-center">
                                                    <button onClick={() => handleRemoveBOMItem(item.bom_id)} className="text-zinc-600 hover:text-red-400 p-1" title="BOM에서 제거">✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 border-dashed rounded-xl flex items-center justify-center h-full min-h-[400px]">
                        <p className="text-zinc-500 text-lg">👈 좌측에서 기구를 선택하시면 BOM 명세서가 나타납니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
