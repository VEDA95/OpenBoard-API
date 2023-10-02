import { z } from 'zod';

export const helloWorldSchema = z.object({
    name: z.string().nonempty().trim()
});

export type HelloWorldSchema = z.infer<typeof helloWorldSchema>;