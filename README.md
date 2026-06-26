# FIFA 2026 Dashboard

Dashboard interativo em tempo real da Copa do Mundo FIFA 2026.

## Stack
- **Next.js 14** (App Router + SSR)
- **Supabase** (PostgreSQL + Realtime WebSockets)
- **football-data.org** API v4
- **Vercel** (deploy + cron jobs)

## Setup

### 1. Supabase — Executar Schema
No Supabase Dashboard → SQL Editor, cole e execute o conteúdo de `supabase/schema.sql`.

### 2. API Key — football-data.org
1. Acesse https://www.football-data.org/client/register
2. Registre-se gratuitamente (plano gratuito tem acesso à Copa do Mundo)
3. Copie sua API key e adicione em `.env.local`:
   ```
   FOOTBALL_DATA_API_KEY=sua_key_aqui
   ```

### 3. Variáveis de Ambiente (Vercel)
Configure no Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://philpvuvdsjzaqvjgvir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fqrlKy8iLPMhrGlJBfLMAQ_VnFplCBv
FOOTBALL_DATA_API_KEY=sua_key_aqui
ADMIN_USERNAME=jasantos
ADMIN_PASSWORD=123456
CRON_SECRET=fifa2026-cron-secret
NEXTAUTH_SECRET=fifa2026_secret_key_ultra_secure_2026
```

### 4. Rodar localmente
```bash
npm run dev
```

### 5. Sincronizar dados manualmente
Acesse `/admin` → aba "Sincronização" → "Executar Sync"

## Páginas
| Rota | Descrição |
|---|---|
| `/` | Home — jogos do dia, artilheiros |
| `/groups` | Fase de grupos — 12 grupos |
| `/bracket` | Mata-mata — chaveamento visual |
| `/match/[id]` | Detalhe ao vivo com eventos |
| `/teams` | Lista de seleções |
| `/team/[id]` | Perfil da seleção + elenco |
| `/admin` | Painel admin (jasantos/123456) |

## Realtime
Supabase Realtime atualiza placar, gols e cartões automaticamente sem reload.

## Cron (Vercel)
`vercel.json` configura sync automático a cada 2 minutos.
