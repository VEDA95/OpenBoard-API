
export function createQuery(table_name: string, columns: Array<string>): string {
    const sql_value_indexes: Array<string> = columns.map((_, index: number): string => `$${index + 1}`);

    return `INSERT INTO ${table_name} (${columns.join(', ')}) VALUES (${sql_value_indexes.join(', ')});`;
}

export function createManyToManyQuery(table_name: string, id_name_1: string, id_name_2: string, values: Array<[string, string]>): string {
    let values_incrementor: number = 0;

    return `
        INSERT INTO ${table_name} (${id_name_1}, ${id_name_2})
        VALUES
            ${values.map((_, index: number): string => {
                const index1: number = index + values_incrementor + 1;
                const index2: number = index + values_incrementor + 2;
                let value_template_str: string = `($${index1}, $${index2})`;

                if(index === values.length - 1) {
                    value_template_str += ';';
                } else {
                    value_template_str += ', ';
                }

                ++values_incrementor;

                return value_template_str;
            })}
    `;
}