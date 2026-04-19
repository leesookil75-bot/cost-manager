export interface Part {
    id: string;
    part_code: string | null;
    name: string;
    main_category: string | null;
    sub_category: string | null;
    unit_price: number;
    specs: string | null;
    created_at: string;
}

export interface Equipment {
    id: string;
    name: string;
    code: string | null;
    created_at: string;
    total_cost?: number; // Added for BOM calculation
}

export interface BOM {
    id: string;
    equipment_id: string;
    part_id: string;
    required_qty: number;
}
