import { genSalt, hash, compare } from 'bcryptjs';

export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
    const salt: string = await genSalt(rounds);

    return await hash(password, salt);
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    return await compare(password, hash);
}