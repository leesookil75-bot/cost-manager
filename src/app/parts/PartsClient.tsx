'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Part } from '@/lib/types';
import { addPart } from '@/lib/actions';

interface PartsClientProps {
    initialParts: Part[];
    categories: { mainCategories: (string|null)[]; subCategories: (string|null)[] };
}

export default function PartsClient({ initialParts, categories }: PartsClientProps) {
    const router = useRouter();
    const [parts, setParts] = useState<Part[]>(initialParts);
    const [isPending, startTransition] = useTransition();
    
    // Form state
    const [name, setName] = useState('');
    const [partCode, setPartCode] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [unitPrice, setUnitPrice] = useState<number | ''>('');
    const [specs, setSpecs] = useState('');

    const [mainCatFocused, setMainCatFocused] = useState(false);
    const [subCatFocused, setSubCatFocused] = useState(false);

    // Filter nulls and empty strings, then filter by current input
    const validMains = categories.mainCategories.filter(Boolean) as string[];
    const validSubs = categories.subCategories.filter(Boolean) as string[];

    const filteredMains = validMains.filter(c => c.toLowerCase().includes(mainCategory.toLowerCase()) && c !== mainCategory);
    const filteredSubs = validSubs.filter(c => c.toLowerCase().includes(subCategory.toLowerCase()) && c !== subCategory);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || unitPrice === '') return;

        startTransition(async () => {
            const formData = {
                name,
                part_code: partCode,
                main_category: mainCategory,
                sub_category: subCategory,
                unit_price: Number(unitPrice),
                specs
            };
            const res = await addPart(formData);
            
            if (res.success) {
                // Optimistic UI update could go here, or depend on revalidatePath
                // Since revalidatePath un-mounts/re-mounts on server components, the page will refresh initialParts
                alert('부품이 성공적으로 추가되었습니다.');
                // Reset form
                setName('');
                setPartCode('');
                setMainCategory('');
                setSubCategory('');
                setUnitPrice('');
                setSpecs('');
                router.refresh();
            } else {
                alert('추가 실패: ' + res.error);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl h-fit">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-indigo-400">⊕</span> 신규 부품 등록
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">상세 품명 <span className="text-red-400">*</span></label>
                        <input 
                            required 
                            type="text" 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="예: 자작합판 18T (1220x2440)"
                            value={name} onChange={e => setName(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-zinc-400 mb-1">대분류 태그</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="예: 목재"
                                value={mainCategory} onChange={e => setMainCategory(e.target.value)}
                                onFocus={() => setMainCatFocused(true)}
                                onBlur={() => setTimeout(() => setMainCatFocused(false), 200)}
                            />
                            {mainCatFocused && filteredMains.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {filteredMains.map(c => (
                                        <li key={c} className="px-4 py-2 hover:bg-indigo-600 cursor-pointer" onMouseDown={() => setMainCategory(c)}>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-zinc-400 mb-1">소분류 태그</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="예: 자작합판"
                                value={subCategory} onChange={e => setSubCategory(e.target.value)}
                                onFocus={() => setSubCatFocused(true)}
                                onBlur={() => setTimeout(() => setSubCatFocused(false), 200)}
                            />
                            {subCatFocused && filteredSubs.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {filteredSubs.map(c => (
                                        <li key={c} className="px-4 py-2 hover:bg-indigo-600 cursor-pointer" onMouseDown={() => setSubCategory(c)}>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">현재 단가(원) <span className="text-red-400">*</span></label>
                            <input 
                                required 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="0"
                                value={unitPrice} onChange={e => setUnitPrice(e.target.value ? Number(e.target.value) : '')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">자체 품번 (선택)</label>
                            <input 
                                type="text" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="P-WD-001"
                                value={partCode} onChange={e => setPartCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">추가 규격/메모</label>
                        <textarea 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="매입처: OO합판, 두께: 18mm"
                            value={specs} onChange={e => setSpecs(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isPending}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] disabled:opacity-50"
                    >
                        {isPending ? '저장 중...' : '부품 등록하기'}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-emerald-400">≡</span> 등록된 부품 목록
                    </h2>
                    <span className="text-zinc-500 text-sm">총 {initialParts.length}건</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-300">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-950 border-b border-zinc-800">
                            <tr>
                                <th className="px-4 py-3">분류 태그</th>
                                <th className="px-4 py-3">품명 (규격)</th>
                                <th className="px-4 py-3 text-right">단가(원)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialParts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-zinc-500">
                                        등록된 부품이 없습니다. 좌측에서 첫 부품을 등록해주세요.
                                    </td>
                                </tr>
                            ) : (
                                initialParts.map(part => (
                                    <tr key={part.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {part.main_category && (
                                                    <span className="px-2 py-1 bg-indigo-900/40 text-indigo-300 border border-indigo-800 rounded-md text-xs font-medium">
                                                        {part.main_category}
                                                    </span>
                                                )}
                                                {part.sub_category && (
                                                    <span className="px-2 py-1 bg-emerald-900/40 text-emerald-300 border border-emerald-800 rounded-md text-xs font-medium">
                                                        {part.sub_category}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{part.name}</div>
                                            {part.specs && <div className="text-xs text-zinc-500 mt-1">{part.specs}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-amber-400">
                                            {part.unit_price.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
