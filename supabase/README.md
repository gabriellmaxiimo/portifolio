# Catálogo de filmes, séries e animes

As páginas buscam filmes e séries no TMDB e animes no AniList. As avaliações
inteiras de 0 a 100 e o estado da lista pessoal (`watchlist` para “Minha lista”)
são persistidos em `public.media_ratings`;
os títulos consultados
pela conta administradora são guardados em `public.media_catalog_cache` como
cache de contingência. Qualquer visitante pode ler as avaliações e o cache;
apenas usuários autenticados incluídos em `public.media_admins` podem alterá-los.

## Configuração

1. Crie um projeto Supabase.
2. No SQL Editor do projeto, execute
   [`migrations/202610190001_media_ratings.sql`](./migrations/202610190001_media_ratings.sql).
3. Em **Authentication → Providers**, habilite GitHub e informe o Client ID e o
   Client Secret de uma GitHub OAuth App. Configure o callback OAuth da aplicação
   GitHub como `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Em **Authentication → URL Configuration**, defina a URL pública do site e
   inclua os endereços locais (`http://127.0.0.1:5173` e
   `http://localhost:5173`) e o domínio de produção em Redirect URLs.
5. Copie `.env.example` para `.env.local` e preencha:

   ```dotenv
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   TMDB_API_READ_ACCESS_TOKEN=<tmdb-read-access-token>
   ```

   URL e chave publishable/anon do Supabase são usadas no navegador; nunca
   configure uma `service_role` no frontend. As políticas RLS da migração são
   obrigatórias. O token do TMDB é usado somente pelo endpoint servidor.
6. Em produção, cadastre as duas variáveis `VITE_SUPABASE_*` no ambiente de
   build e `TMDB_API_READ_ACCESS_TOKEN` nas variáveis de ambiente das funções
   Vercel; faça um novo deploy após configurá-las.
7. Entre uma vez no site com a sua conta GitHub. No SQL Editor, localize o seu
   UUID de autenticação pelo nome da conta GitHub:

   ```sql
   select id, raw_user_meta_data ->> 'user_name' as github_username
   from auth.users
   where raw_user_meta_data ->> 'user_name' = '<seu-usuario-github>';
   ```

   Insira o UUID retornado na lista de administradores:

   ```sql
   insert into public.media_admins (user_id)
   values ('<uuid-retornado>')
   on conflict (user_id) do nothing;
   ```

Somente faça esse cadastro para a sua própria conta. A tabela de administradores
não permite que visitantes se adicionem; o acesso a escrita é concedido pelas
políticas RLS com base no UUID autenticado.
