-- PostgreSQL trigger to automatically sync provider price on services changes
CREATE OR REPLACE FUNCTION sync_provider_price() RETURNS trigger AS $$
DECLARE
  provider_id text;
BEGIN
  provider_id := COALESCE(NEW.artist_id, NEW.studio_id, OLD.artist_id, OLD.studio_id);
  UPDATE profiles
  SET price = COALESCE(
        (SELECT MIN(price) FROM services
         WHERE artist_id = provider_id OR studio_id = provider_id), 0),
      updated_at = NOW()
  WHERE user_id = provider_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER services_price_sync
AFTER INSERT OR UPDATE OF price OR DELETE ON services
FOR EACH ROW EXECUTE FUNCTION sync_provider_price();
