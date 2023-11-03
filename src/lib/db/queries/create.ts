
export function createQuery(table_name: string, columns: Array<string>): string {
    const sql_value_indexes: Array<string> = columns.map((_, index: number): string => `$${index + 1}`);

    return `INSERT INTO ${table_name} (${columns.join(', ')}) VALUES (${sql_value_indexes.join(', ')});`;
}

export function createManyToManyQuery(table_name: string, id_name_1: string, id_name_2: string, valueLength: number): string {
    let valuesTemplate: string = '';
    const indexLimit: number = valueLength / 2;

    for(let index: number = 0; index < indexLimit; index += 2) {
        const index1: number = index + 1;
        const index2: number = index + 2;

        valuesTemplate += `($${index1}, $${index2})`;
        valuesTemplate += index === (indexLimit - 1) ? ';' : ',';
    }

    return `INSERT INTO ${table_name} (${id_name_1}, ${id_name_2}) VALUES ${valuesTemplate}`;
}