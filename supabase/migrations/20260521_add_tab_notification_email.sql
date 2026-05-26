-- 1) Colonne pour stocker l'email de notification
ALTER TABLE public.tabs
ADD COLUMN IF NOT EXISTS notification_email TEXT;

COMMENT ON COLUMN public.tabs.notification_email IS
  'Adresse email pour notifier les nouveaux resultats de veille';

-- 2) Autoriser la mise a jour via la cle anon (le SELECT/INSERT existent deja en general)
DROP POLICY IF EXISTS tabs_update_anon ON public.tabs;

CREATE POLICY tabs_update_anon
  ON public.tabs
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
