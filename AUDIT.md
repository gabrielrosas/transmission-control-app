# Auditoria do projeto

Levantamento de pontos de refatoração, segurança e performance no `transmission-control-app`. Cada item tem prioridade, descrição do problema, impacto, e proposta de fix.

Guia de prioridade:
- 🔴 **Alta** — bug real ou risco de segurança não-trivial
- 🟡 **Média** — problema mensurável mas sem urgência (qualidade de código, perf moderada)
- 🟢 **Baixa** — limpeza, polimento

---

## 🔴 Alta prioridade

### 1. Stale closure no setup de PTZ

**Onde:** [src/renderer/src/hooks/ptz/hooks.ts:113-129](src/renderer/src/hooks/ptz/hooks.ts#L113-L129)

```tsx
useEffect(() => {
  window.ptz.init(config)
  const unsubEvents = window.ptz.onLogs((event) => {
    if (event.configId === config.id) { … }
  })
  const unsub = window.ptz.onConnected((id) => {
    if (id === config.id) setConnected(true)
  })
  return () => { unsub(); unsubEvents() }
}, [])  // ⚠️ deps vazias mas usa `config` no closure
```

**Impacto:** se o usuário editar a câmera (mudar IP/porta) enquanto o card está aberto, os listeners IPC continuam comparando contra o `config.id` antigo. Status de conexão pode mentir, eventos podem ser ignorados.

**Fix:** trocar `[]` por `[config.id]` (ou `[config]` se houver mais campos relevantes). O `unsub` retornado já limpa o listener antigo antes do novo registrar.

**Esforço:** 5 minutos. Lint já flaga isso, então também elimina um warning permanente.

---

### 2. Senhas em plaintext no Firestore

**Onde:**
- `obsConfig.password` ([schemas/OBSConfig.ts](src/renderer/src/schemas/OBSConfig.ts))
- `cameraPTZConfig[].password` ([schemas/CameraPTZ.ts](src/renderer/src/schemas/CameraPTZ.ts))

**Impacto:** se a conta Firebase for comprometida (ou alguém ganhar acesso de leitura ao projeto), todas as senhas de OBS WebSocket e câmeras ONVIF do usuário ficam expostas. Como são credenciais de equipamentos de LAN, o blast radius é local — mas ainda é dado sensível.

**Mitigação atual:** as regras Firestore travam acesso pra outros usuários (`request.auth.uid == userId`). Então o risco é "se a SUA conta vazar".

**Fix possível (curto prazo):** aceitar como está, mas documentar no AGENTS.md como risco conhecido. ✅ Já está documentado.

**Fix possível (longo prazo):** cifragem client-side com chave derivada da senha do usuário (PBKDF2 + AES-GCM). Trade-off: precisa relogar pra decifrar, e muda de chave quando o usuário troca de senha (rotacionar tudo). Não-trivial.

**Esforço:** algumas horas para o caminho longo prazo.

---

### 3. Regras Firestore fora do repo

**Problema:** as security rules vivem só no Firebase Console. Sem versionamento, sem code review, sem PR, fácil de driftar entre o que o código espera e o que está deployado.

**Fix:** criar `firestore.rules` na raiz do repo. Manter em sync via Firebase CLI:

```bash
npm i -D firebase-tools
firebase deploy --only firestore:rules
```

Estado atual das regras (com tudo que foi adicionado no histórico de configs e na integração overlays.uno — note que `overlays.uno` não é coleção, vive dentro de `configs/{userId}`):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /configs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /configs_history/{userId}/versions/{configId} {
      allow read, create: if request.auth != null && request.auth.uid == userId;
      // update/delete proibidos: histórico é write-once
    }

    match /configs_history_names/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Coleções legadas do overlayer custom (substituído pela integração overlays.uno).
    // Sem código vivo escrevendo nelas — pode remover quando confirmar que não há
    // dados úteis pra preservar.
    match /overlayers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /overlayers_outputs/{userId} {
      allow read;  // intencional: era browser-source público
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Esforço:** 10 minutos pro setup inicial; paga dividendos sempre.

---

### 4. Dependências squat (`fs`, `path`, `url`)

**Onde:** [package.json](package.json)

```json
"fs": "^0.0.1-security",
"path": "^0.12.7",
"url": "^0.11.4",
```

**Problema:** esses **não** são built-ins do Node — são pacotes npm que ocuparam os nomes. O código realmente usa os módulos nativos (`import { mkdir } from 'fs/promises'`, `import { join } from 'path'`), que funcionam sem essas entradas no `package.json`.

**Riscos:** ruído + risco de supply-chain (em teoria, alguém pode publicar uma versão maliciosa de um pacote desses).

**Fix:**

```bash
npm uninstall fs path url
npm run typecheck  # confirmar que nada quebrou
npm run build      # idem
```

**Esforço:** 1-2 minutos. Reversível trivialmente.

---

## 🟡 Média prioridade

### 5. Semântica confusa no polling de posição PTZ

**Onde:** [src/renderer/src/hooks/ptz/hooks.ts:131-142](src/renderer/src/hooks/ptz/hooks.ts#L131-L142)

```tsx
useEffect(() => {
  if (connected && config && config.positionRefreshTime) {
    const timer = setInterval(() => {
      window.ptz.getPosition(config.id).then(setPosition)
    }, config.transitionTime || 5000)
    return () => clearInterval(timer)
  }
}, [config, connected])
```

**Problema:** o intervalo do polling usa `config.transitionTime`. Se você quer animação rápida (`transitionTime: 200`), a posição fica sendo lida 5x por segundo por câmera — IPC + chamada ONVIF. Para 3 câmeras, 15 polls/segundo. Pesado e não-óbvio.

**Fix:** introduzir um campo separado no `CameraPTZConfigSchema`, tipo `positionPollInterval: number` (default 2000ms), e usar ele aqui em vez de `transitionTime`. Ou clamp mínimo: `Math.max(config.transitionTime ?? 5000, 1000)`.

**Esforço:** 15 minutos (incluindo update do schema, form, defaults).

---

### 6. `delay(2000)` hardcoded no fluxo OBS

**Onde:** [src/renderer/src/hooks/obs.ts:64](src/renderer/src/hooks/obs.ts#L64)

```tsx
.on('ConnectionOpened', () => {
  delay(2000).then(() => {
    OBSConnectionStore.connection!.call('GetSceneList').then(...)
  })
})
```

**Problema:** espera 2 segundos arbitrários antes de pedir a lista de cenas. Em conexões rápidas, perde 2 segundos toda vez. Em conexões lentas, ainda pode falhar.

**Fix:** o `obs-websocket-js` tem um evento `Identified` que dispara quando a sessão está pronta. Reagir a ele em vez de timeout fixo. Alternativa: try/catch + retry curto (200ms × 5).

**Esforço:** 15 minutos.

---

### 7. Componentes React no diretório `hooks/`

**Onde:**
- [src/renderer/src/hooks/ptz/Manager.tsx](src/renderer/src/hooks/ptz/Manager.tsx) — provider + dialog (componente)
- [src/renderer/src/hooks/ptz/Control.tsx](src/renderer/src/hooks/ptz/Control.tsx) — provider (componente)

**Problema:** `hooks/` deveria conter hooks. Componentes (que retornam JSX) deveriam ficar em `components/` ou `providers/`. Convenção quebrada confunde leitores novos.

**Fix:** mover:
- `hooks/ptz/Manager.tsx` → `providers/PTZManagerProvider.tsx`
- `hooks/ptz/Control.tsx` → `providers/PTZControl.tsx`

E ajustar imports.

**Esforço:** 15 minutos.

---

### 8. `hooks/ptz/hooks.ts` com 470+ linhas

**Onde:** [src/renderer/src/hooks/ptz/hooks.ts](src/renderer/src/hooks/ptz/hooks.ts)

**Problema:** mistura tudo num só arquivo: contexts, types, alias manager, `useInitPTZ` (camera-level), `useInitPTZPreset` (preset-level, ~140 linhas com goto/loadImage/clear), e múltiplos seletores pequenos.

**Fix:** split por responsabilidade:

```
hooks/ptz/
├── contexts.ts        # PTZContext, PTZPresetContext, PTZManagerContext + types
├── useInitPTZ.ts      # camera-level: connect, fetch presets, presets-hidden
├── useInitPTZPreset.ts # preset-level: goto, loadImage, clearImage
├── selectors.ts       # useSelectedPreset, useGotoPreset, useImagePreset, etc.
└── index.ts           # re-exports
```

**Esforço:** 30-45 minutos. Maior valor: facilita o próximo bug fix.

---

### 9. Aliases e hidden órfãos quando câmera é deletada

**Onde:** [src/renderer/src/routes/settings/ptz.tsx:92-103](src/renderer/src/routes/settings/ptz.tsx#L92-L103) (`deleteCamera`)

**Problema:** quando uma câmera é apagada:
- `presetsAlias` mantém entradas com chaves `${cameraId}-${presetId}` apontando pra câmera inexistente.
- `presetsHidden[cameraId]` mantém o array.
- Pasta de imagens em disco (`userData/images/ptz-{cameraId}/`) também não é apagada.

**Fix:** no `deleteCamera`, limpar:
- Filtrar `presetsAlias` removendo chaves que começam com `${cameraId}-`
- `delete newPresetsHidden[cameraId]`
- Chamar `window.imageCache.clearFolder({ folder: \`ptz-${cameraId}\` })`

Tudo num único `setConfig` (uma versão de histórico só).

**Esforço:** 15 minutos.

---

## 🟢 Baixa prioridade

### 10. `console.log` espalhados

15+ ocorrências em código de produção. Sugestão: criar `logger.ts` que usa `import.meta.env.DEV` pra ativar/desativar, ou apenas remover os mais ruidosos. Os logs verbose recém-adicionados em [src/main/Overlays.ts](src/main/Overlays.ts) também caem aqui — úteis pra debug, mas pesados pra produção.

**Esforço:** 10-20 minutos dependendo do escopo.

---

### 11. Sem Content-Security-Policy

**Onde:** [src/renderer/index.html](src/renderer/index.html) não tem `<meta http-equiv="Content-Security-Policy" ...>`.

**Impacto:** baixo, porque o app é local (`file://` em produção, dev server controlado em desenvolvimento) e Electron já tem `contextIsolation: true` por default. Defesa em profundidade.

**Fix:**
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://app.overlays.uno wss://*.firebaseio.com" />
```

(Ajustar conforme as origens que o app precisa — Firebase, OBS WebSocket local, overlays.uno, etc. Vai precisar de iteração.)

**Esforço:** 30 minutos com testes.

---

### 12. `app.disableHardwareAcceleration()` sem motivo documentado

**Onde:** [src/main/index.ts:93](src/main/index.ts#L93)

**Problema:** desabilita aceleração de GPU. Pode ter sido por bug específico (frequente em Electron) ou esquecido no código boilerplate.

**Fix:** se você sabe o motivo, comentar inline. Se não, testar removendo num PR de validação.

**Esforço:** depende. Validação 30 minutos.

---

### 13. Cache de imagens no disco sem GC

**Onde:** [src/main/ImageCache.ts](src/main/ImageCache.ts) escreve em `userData/images/{folder}/`. Câmeras deletadas deixam pastas pra trás.

**Fix:** já mencionado no item 9 (incluir `clearFolder` no delete da câmera).

---

### 14. Singletons globais com `static`

**Onde:**
- `OBSConnectionStore` ([hooks/obs.ts](src/renderer/src/hooks/obs.ts))
- `CamStore` ([main/Cam.ts](src/main/Cam.ts))

**Problema:** classes com static members + estado mutável global. Difícil de testar (sem mocks). Como não há testes hoje, é mais teórico.

**Fix:** se um dia adicionar testes, refatorar pra dependency injection. Sem testes, deixar como está.

---

## ✅ Já feito (em sessões anteriores)

- **Código morto do overlayer custom** — `hooks/overlayer.ts`, `schemas/Overlayer.ts` apagados; `routes/home/overlayers.tsx` reescrito como controle do overlays.uno.

---

## Sugestão de ordem de ataque

Se quiser fazer uma "limpa" rápida com alto retorno:

1. **#4** — Remover squat deps (1 min)
2. **#1** — Corrigir stale closure (5 min)
3. **#3** — Comitar `firestore.rules` (10 min)
4. **#9** — Cleanup ao deletar câmera (15 min)

Total: ~30 minutos, e o repositório fica significativamente mais limpo + um bug real corrigido.

Depois disso, escolher entre:
- **#7 + #8** — Reorganização de `hooks/ptz/` (45-60 min, prepara terreno pra novas features)
- **#2** — Cifragem de senhas (várias horas, escopo de feature dedicada)
- **#5 + #6** — Polir os pollings/timeouts do PTZ e OBS (30 min cada)
