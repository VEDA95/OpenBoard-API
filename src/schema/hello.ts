import { z } from 'zod';
import type { ZodObject, ZodRawShape } from 'zod';

export const helloWorldSchema: ZodObject<ZodRawShape> = z.object({
    name: z.string().min(1, 'the name cannot be empty...')
});

export type HelloWorldSchema = z.infer<typeof helloWorldSchema>;