-- Migración: Normaliza deptSpecialties (skills antiguas → nuevas) en prefs_skills_lite
-- Ejecutar una sola vez. Basado en SKILL_MIGRATION_MAP de catalogs.js

UPDATE public_profiles
SET prefs_skills_lite = jsonb_set(
  prefs_skills_lite,
  '{deptSpecialties}',
  COALESCE(
    (
      SELECT jsonb_agg(mapped ORDER BY mapped)
      FROM (
        SELECT DISTINCT (
          CASE LOWER(TRIM(elem))
            -- Deck
            WHEN 'line handling & mooring' THEN 'Line handling / mooring'
            WHEN 'rib/tender operations' THEN 'Tender ops (RIB)'
            WHEN 'driving large tenders (10m+)' THEN 'Large tender driving (10m+)'
            WHEN 'crane/davit operations' THEN 'Crane / davit ops'
            WHEN 'jet skis & water toys' THEN 'Jet skis & water toys'
            WHEN 'watersports instruction' THEN 'Watersports assist'
            WHEN 'bridge/navigation support' THEN 'Nav support / chartwork'
            WHEN 'chartwork & passage planning' THEN 'Passage planning support'
            WHEN 'watchkeeping (bridge)' THEN 'Bridge watch / lookout'
            WHEN 'anchoring ops' THEN 'Anchoring ops'
            WHEN 'fendering & docking prep' THEN 'Docking prep (fenders / lines)'
            WHEN 'gangway & passerelle ops' THEN 'Docking prep (fenders / lines)'
            WHEN 'exterior washdown & detailing' THEN 'Exterior washdown / detailing'
            WHEN 'teak care & restoration' THEN 'Teak care'
            WHEN 'paint & varnish' THEN 'Paint & varnish'
            WHEN 'caulking & deck repairs' THEN 'Caulking / deck repairs'
            WHEN 'isps/security awareness' THEN 'ISPS awareness'
            WHEN 'safety drills (mob/abandon ship)' THEN 'MOB / fire / abandon drills'
            WHEN 'first aid / medical support' THEN 'First aid support'
            WHEN 'drone photography / media' THEN 'Drone ops (basic)'
            WHEN 'guest logistics & concierge' THEN 'Guest media assist'
            -- Engine
            WHEN 'diesel engines – diagnostics & service' THEN 'Diesel diagnostics & repair'
            WHEN 'generators – service & load management' THEN 'Generator control systems'
            WHEN 'shaft/propulsion alignment' THEN 'Gearbox / shaft alignment'
            WHEN 'stabilizers & thrusters' THEN 'Stabilizers & thrusters service'
            WHEN 'electrical systems (ac/dc)' THEN 'Electrical fault finding (AC/DC)'
            WHEN 'electronics & instrumentation' THEN 'AV / IT yacht networks'
            WHEN 'battery systems & chargers' THEN 'Lithium battery safety & service'
            WHEN 'alarm/monitoring systems' THEN 'PLC fault diagnostics'
            WHEN 'hydraulics' THEN 'Hydraulic fault diagnostics'
            WHEN 'piping & plumbing' THEN 'Sanitary systems repair'
            WHEN 'fuel systems & polishing' THEN 'Fuel system troubleshooting'
            WHEN 'hvac & refrigeration' THEN 'HVAC fault diagnostics'
            WHEN 'watermakers/ro plants' THEN 'RO / watermaker service'
            WHEN 'planned maintenance systems (pms)' THEN 'PMS platforms (AMOS / IDEA / Voly)'
            WHEN 'preventive maintenance scheduling' THEN 'Preventive maintenance'
            WHEN 'spare parts management' THEN 'Spares handling'
            WHEN 'technical purchasing & inventory' THEN 'Spares strategy'
            WHEN 'dry dock / yard period planning' THEN 'Dry dock specs'
            WHEN 'class & flag surveys support' THEN 'Class / flag inspections'
            -- Interior
            WHEN 'silver service' THEN 'Silver service'
            WHEN 'wine & beverage service' THEN 'Wine service (WSET 1/2)'
            WHEN 'cocktail bartending' THEN 'Mixology'
            WHEN 'table scaping & décor' THEN 'Table décor & styling'
            WHEN 'service lead/butler duties' THEN 'Butler-style service'
            WHEN 'housekeeping standards' THEN 'Elite cabin detailing'
            WHEN 'laundry/pressing/garment care' THEN 'High-end laundry & ironing'
            WHEN 'high-end fabric care' THEN 'Luxury fabric care'
            WHEN 'cabin turn-down procedures' THEN 'Turn-down standards'
            WHEN 'guest relations & concierge' THEN 'Guest relations'
            WHEN 'inventory & provisioning' THEN 'Provisioning & stock control'
            WHEN 'f&b stock control' THEN 'Provisioning & stock control'
            WHEN 'event & theme nights' THEN 'Event / theme night setup'
            WHEN 'medical/first aid support' THEN 'Risk assessment (RA)'
            -- Galley
            WHEN 'mediterranean cuisine' THEN 'Prepare Mediterranean cuisine'
            WHEN 'asian/japanese/sushi' THEN 'Prepare Asian / Japanese cuisine'
            WHEN 'plant-based/vegan' THEN 'Prepare plant-based menus'
            WHEN 'gluten-free & allergens' THEN 'Execute allergen-safe dishes'
            WHEN 'pastry & bakery' THEN 'Produce pastries & desserts'
            WHEN 'breads & viennoiserie' THEN 'Bake breads & viennoiserie'
            WHEN 'sauces & stocks' THEN 'Prepare sauces & stocks'
            WHEN 'desserts & chocolate work' THEN 'Produce pastries & desserts'
            WHEN 'butchery & fishmongery' THEN 'Perform butchery & fish prep'
            WHEN 'fine dining plating' THEN 'Plate fine dining dishes'
            WHEN 'menu planning & costing' THEN 'Cost menus'
            WHEN 'provisioning & vendor sourcing' THEN 'Source provisions'
            WHEN 'galley hygiene & haccp' THEN 'Apply HACCP workflows'
            WHEN 'food safety & storage' THEN 'Maintain safe food storage'
            WHEN 'dietary requirements management' THEN 'Apply HACCP workflows'
            WHEN 'crew food at scale' THEN 'Produce crew meals at scale'
            WHEN 'catering for charters/events' THEN 'Execute charter turnaround'
            WHEN 'waste minimization' THEN 'Apply HACCP workflows'
            -- Variantes
            WHEN 'tender driving' THEN 'Tender ops (RIB)'
            WHEN 'washdown' THEN 'Exterior washdown / detailing'
            WHEN 'line handling' THEN 'Line handling / mooring'
            WHEN 'watchkeeping' THEN 'Bridge watch / lookout'
            WHEN 'refit support' THEN 'New build / refit deck commissioning'
            ELSE elem
          END
        ) AS mapped
        FROM jsonb_array_elements_text(prefs_skills_lite->'deptSpecialties') AS elem
      ) sub
    ),
    '[]'::jsonb
  )
)
WHERE prefs_skills_lite ? 'deptSpecialties'
  AND jsonb_array_length(prefs_skills_lite->'deptSpecialties') > 0;
