import { createManyToManyQuery } from './create';


export function updateQuery(tableName: string, idName: string, columns: Array<string>): string {
    return `
        UPDATE ${tableName}
        SET ${
            columns
                .map((item: string, index: number): string => `${item} = $${index + 2}`)
                .join(', ')
        }
        WHERE ${idName} = $1;
    `;
};

export function updateManyToMany(
    tableName: string,
    idName1: string,
    idName2: string,
    addValuesLength: number,
    removeValuesLength: number,
    useId1: boolean = false): [string, string] {
    const addManyToManyQuery: string = createManyToManyQuery(tableName, idName1, idName2, addValuesLength);
    const idName: string = useId1 ? idName1 : idName2;
    let whereIndexes: Array<string> = [];

    for(let index = 1; index < removeValuesLength; index++) {
        whereIndexes = [...whereIndexes, `$${index + 1}`];
    }

    const removeManyToMany: string = `
        DELETE FROM ${tableName}
        WHERE ${idName1} = $1
        WHERE ${idName} IN (${whereIndexes.join(', ')});
    `;

    return [addManyToManyQuery, removeManyToMany];
}