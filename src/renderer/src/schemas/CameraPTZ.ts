import z from 'zod'

export const CameraPTZConfigSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome é obrigatório'),
  user: z.string().min(1, 'Usuário é obrigatório'),
  ip: z
    .string()
    .min(1, 'Endereço IP é obrigatório')
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Endereço IP inválido'
    ),
  port: z
    .string()
    .min(1, 'Porta é obrigatória')
    .regex(/^\d+$/, 'Porta deve conter apenas números')
    .refine((val) => {
      const port = parseInt(val)
      return port >= 1 && port <= 65535
    }, 'Porta deve estar entre 1 e 65535'),
  password: z.string().min(1, 'Senha é obrigatória'),

  sceneId: z.string().nullable().optional()
})

export type CameraPTZConfig = z.infer<typeof CameraPTZConfigSchema>
