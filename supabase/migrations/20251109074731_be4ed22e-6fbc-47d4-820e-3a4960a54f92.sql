-- Enable realtime for transactions table
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;