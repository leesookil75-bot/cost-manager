'use server';

import { sql } from '@vercel/postgres';
import { Part, Equipment, BOM } from './types';
import { revalidatePath } from 'next/cache';

// ========= PARTS =========
export async function getParts(): Promise<Part[]> {
    try {
        const { rows } = await sql<Part>`SELECT * FROM pc_parts ORDER BY main_category ASC, created_at DESC;`;
        return rows;
    } catch (error) {
        console.error('Failed to fetch parts:', error);
        return [];
    }
}

export async function addPart(data: {
    name: string;
    part_code?: string;
    main_category?: string;
    sub_category?: string;
    unit_price: number;
    specs?: string;
}) {
    try {
        await sql`
            INSERT INTO pc_parts (name, part_code, main_category, sub_category, unit_price, specs)
            VALUES (${data.name}, ${data.part_code || null}, ${data.main_category || null}, ${data.sub_category || null}, ${data.unit_price}, ${data.specs || null})
        `;
        revalidatePath('/parts');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get unique categories for dynamic tagging
export async function getCategories() {
    try {
        const mainRows = await sql`SELECT DISTINCT main_category FROM pc_parts WHERE main_category IS NOT NULL AND main_category != '';`;
        const subRows = await sql`SELECT DISTINCT sub_category FROM pc_parts WHERE sub_category IS NOT NULL AND sub_category != '';`;
        
        return {
            mainCategories: mainRows.rows.map(r => r.main_category),
            subCategories: subRows.rows.map(r => r.sub_category)
        };
    } catch (error) {
        return { mainCategories: [], subCategories: [] };
    }
}

// ========= EQUIPMENT & BOM =========
export async function getEquipments() {
    try {
        const { rows } = await sql`
            SELECT 
                e.*, 
                COALESCE(SUM(b.required_qty * p.unit_price), 0) as total_cost 
            FROM pc_equipment e 
            LEFT JOIN pc_equipment_bom b ON e.id = b.equipment_id 
            LEFT JOIN pc_parts p ON b.part_id = p.id 
            GROUP BY e.id
            ORDER BY e.created_at DESC;
        `;
        return rows as Equipment[];
    } catch (error) {
        console.error('Failed to fetch equipments:', error);
        return [];
    }
}

export async function addEquipment(name: string, code: string) {
    try {
        await sql`INSERT INTO pc_equipment (name, code) VALUES (${name}, ${code})`;
        revalidatePath('/equipment');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export interface BOMDetails {
    bom_id: string;
    part_id: string;
    part_name: string;
    specs: string | null;
    main_category: string | null;
    sub_category: string | null;
    unit_price: number;
    required_qty: number;
    total_price: number;
}

export async function getEquipmentBOM(equipmentId: string): Promise<BOMDetails[]> {
    try {
        const { rows } = await sql`
            SELECT 
                b.id as bom_id, b.part_id, b.required_qty,
                p.name as part_name, p.specs, p.main_category, p.sub_category, p.unit_price,
                (b.required_qty * p.unit_price) as total_price
            FROM pc_equipment_bom b
            JOIN pc_parts p ON b.part_id = p.id
            WHERE b.equipment_id = ${equipmentId}
            ORDER BY p.main_category ASC, p.name ASC;
        `;
        return rows as BOMDetails[];
    } catch (error) {
        return [];
    }
}

export async function addBOMItem(equipmentId: string, partId: string, qty: number) {
    try {
        // Check if exists, update qty if does
        const existing = await sql`SELECT id, required_qty FROM pc_equipment_bom WHERE equipment_id = ${equipmentId} AND part_id = ${partId}`;
        
        if ((existing.rowCount ?? 0) > 0) {
            await sql`UPDATE pc_equipment_bom SET required_qty = ${qty} WHERE id = ${existing.rows[0].id}`;
        } else {
            await sql`INSERT INTO pc_equipment_bom (equipment_id, part_id, required_qty) VALUES (${equipmentId}, ${partId}, ${qty})`;
        }
        revalidatePath('/equipment');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeBOMItem(bomId: string) {
    try {
        await sql`DELETE FROM pc_equipment_bom WHERE id = ${bomId}`;
        revalidatePath('/equipment');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ========= DASHBOARD =========
export async function getDashboardStats() {
    try {
        // Get Total equipments with their BOM costs
        const equipments = await getEquipments();
        
        // Get Total parts count
        const partsCountRow = await sql`SELECT COUNT(*) as count FROM pc_parts`;
        const totalParts = Number(partsCountRow.rows[0].count);

        // Get Top 3 most expensive parts
        const topPartsRow = await sql`SELECT name, unit_price FROM pc_parts ORDER BY unit_price DESC LIMIT 5`;

        return {
            equipments,
            totalParts,
            topParts: topPartsRow.rows as { name: string; unit_price: number }[]
        };
    } catch (error) {
        console.error('Stats Error:', error);
        return null;
    }
}
