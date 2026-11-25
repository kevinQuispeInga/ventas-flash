-- Supabase supports pg_cron. This closes auctions even with no browsers open.
create extension if not exists pg_cron;
select cron.schedule('ventas-flash-close-auctions','* * * * *','select private.close_expired_auctions()');
