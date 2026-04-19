import { getParts, getCategories } from '@/lib/actions';
import PartsClient from './PartsClient';

export default async function PartsPage() {
    const parts = await getParts();
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">원자재(부품) 관리</h1>
                <p className="text-zinc-400 mt-2">필라테스 기구 제작에 필요한 모든 자재의 단가와 카테고리를 관리합니다. (동적 태그 적용)</p>
            </header>

            <main>
                <PartsClient initialParts={parts} categories={categories} />
            </main>
        </div>
    );
}
