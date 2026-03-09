-- Create trigger function to notify admins when new properties are submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
BEGIN
  IF NEW.status = 'pending' THEN
    FOR admin_record IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        admin_record.user_id,
        'New Property Submitted',
        'A new property "' || NEW.title || '" in ' || NEW.city || ' has been submitted for review.',
        'info',
        '/admin/properties?status=pending'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_property_notify_admins ON public.properties;
CREATE TRIGGER on_new_property_notify_admins
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_property();

-- Create trigger function to notify admins when new landlord applications are submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_landlord_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  applicant_name TEXT;
BEGIN
  IF NEW.verification_status = 'pending' AND (OLD IS NULL OR OLD.verification_status IS DISTINCT FROM 'pending') THEN
    SELECT full_name INTO applicant_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    
    FOR admin_record IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        admin_record.user_id,
        'New Landlord Application',
        'A new landlord application from ' || COALESCE(applicant_name, 'Unknown') || ' is pending review.',
        'info',
        '/admin/landlords'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_landlord_application_notify_admins ON public.landlord_profiles;
CREATE TRIGGER on_new_landlord_application_notify_admins
  AFTER INSERT OR UPDATE ON public.landlord_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_landlord_application();