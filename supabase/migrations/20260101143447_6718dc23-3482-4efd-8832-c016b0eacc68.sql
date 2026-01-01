-- Update the handle_new_user function to assign landlord role based on account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_type text;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  
  -- Get the account type from metadata (default to 'user')
  account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'user');
  
  -- Assign role based on account type
  IF account_type = 'landlord' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'landlord');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$function$;