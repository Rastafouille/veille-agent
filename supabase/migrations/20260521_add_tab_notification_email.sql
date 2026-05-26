-- Email de notification par onglet utilisateur
ALTER TABLE tabs
ADD COLUMN IF NOT EXISTS notification_email TEXT;

COMMENT ON COLUMN tabs.notification_email IS
  'Adresse email pour notifier les nouveaux resultats de veille';
