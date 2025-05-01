CREATE OR REPLACE FUNCTION update_user_cart_updated_at()
RETURNS TRIGGER AS 279
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
279 LANGUAGE plpgsql;
