import z from 'zod'

export const OverlayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome é obrigatório'),
  title: z.string().nullable().optional(),
  text: z.string().min(1, 'Texto é obrigatório')
})

export type Overlayer = z.infer<typeof OverlayerSchema>
