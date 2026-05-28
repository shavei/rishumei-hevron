-- Local dev seed only (spec §4). Not used in staging/production.
-- Assumes migrations have run. Sets a known admin PIN (1234) and sample students.

update public.app_settings
   set value = to_jsonb(crypt('1234', gen_salt('bf')))
 where key = 'admin_pin';

insert into public.students (id_number, full_name, grade, class_id) values
  ('012345678', 'ישראל ישראלי', 'שיעור א', 'כיתה הרב משה'),
  ('023456789', 'יוסף כהן',     'שיעור א', 'כיתה הרב משה'),
  ('034567890', 'דוד לוי',      'שיעור ב', 'כיתה הרב יעקב'),
  ('045678901', 'משה פרץ',      'שיעור ג', 'כיתה הרב יצחק')
on conflict (id_number) do nothing;

-- a sample default (presence) registration in draft
insert into public.registrations (title, description, status, closes_at, questions_schema)
values (
  'שבת פרשת בא',
  'נא לאשר הגעה עד יום חמישי',
  'draft',
  now() + interval '5 days',
  '[
    {"id":"q_primary","type":"presence","label":"האם תישאר לשבת?","required":true,"conditional_on":null},
    {"id":"q_transport","type":"single_choice","label":"באיזה אזור תרצה הסעה?","required":false,
     "options":[{"value":"north","label":"צפון"},{"value":"center","label":"מרכז"},{"value":"south","label":"דרום"}],
     "conditional_on":{"question_id":"q_primary","equals":"present"}}
  ]'::jsonb
)
on conflict do nothing;
