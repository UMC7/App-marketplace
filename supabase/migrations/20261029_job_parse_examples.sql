-- Ejemplos para el Smart Paste de admin: texto pegado -> formulario final del admin
create table if not exists public.job_parse_examples (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  output jsonb not null,
  ai_output jsonb,
  source_offer_id uuid,
  posted_on date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.job_parse_examples enable row level security;
revoke all on public.job_parse_examples from public, anon, authenticated;

create index if not exists job_parse_examples_created_at_idx on public.job_parse_examples (created_at desc);

delete from public.job_parse_examples where created_by is null and source_offer_id in ('c9a980d2-25ad-4ead-958f-fbc8ceff54d9', '00f08af2-32c9-4e6a-8946-aca7d3c8d58a', 'eff55675-3c93-44d6-9fd5-b765804d4c4c', 'ff4c19da-7037-448c-91f1-f968fc3298ba', 'dc02b3c9-2961-42ed-a20d-ae64b0ea9ed7', '7374dd8e-6eb3-41a2-9c94-991837212dba', 'e2d1c142-4b63-4123-a3f0-dbfd73ffe514', '6ba0fca6-e0f5-4107-a57a-3054bce299d2', '0ba0fd39-1ccf-440a-870c-f34182792d82', 'a182bcbf-20d3-4743-a618-0dd6a9a53009', '40c75517-1641-40b9-98b0-f2065bed8447', 'e7787733-3bc6-45cb-ad68-a61d7dc7fe66', '4a5369c5-233c-4e2f-8842-6e858b283ddf', 'dbbb2f3d-ab14-4c04-bcba-13d81460d9f9', 'b9e41472-1dea-4621-8a2d-ef804f2e5b48', '898b755c-6bae-4870-96a3-f8e19eeb20ed', '47804f40-d548-4a51-9cca-dcf72df1f6a5', 'c437eab1-b594-4366-aeec-d9fe286f4ddc', 'd42b7b57-316c-4da6-a504-51d77b27b1e2', '7259c34b-871a-4bc3-af2a-1259adf941c2', 'd2926030-8d82-45c0-ae3c-c56994341068', '746ecdcf-7e71-4110-98e5-0f31a0cb91d6');

insert into public.job_parse_examples (raw_text, output, source_offer_id, posted_on) values
($seed$🚨 TEMP STEW NEEDED ASAP! 🚨
⚓ Harbor Elite Yacht Crew is looking for a Stewardess available for temporary work ASAP!

✅ Must be currently located in Florida, USA preferably in West Palm 🇺🇸
✅ Available to start immediately
✅ Previous yachting experience preferred
✅ Professional, positive attitude and strong work ethic

📩 Available and interested? Send me a email: info@heyachtcrew.com with your CV and availability.

Please share with anyone who may be interested!

Harbor Elite Yacht Crew ⚓$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Steward(ess)","city":"Florida","country":"United States","type":"Temporary","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Professional conduct","Strong work ethic","Positive attitude"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":true,"candidate_location_requirement":"local_only","years_in_rank":"Proven Experience Required","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"0 - 30m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"info@heyachtcrew.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🛥️ Temporary Stewardess – Yacht\n\n📍 Location: Florida, USA (West Palm Beach Preferred)\n📅 Start Date: ASAP\n📄 Contract: Temporary\n💰 Salary: DOE\n\nRequirements:\n• Must currently be located in Florida, preferably West Palm Beach\n• Immediate availability\n• Previous yachting experience preferred\n• Professional and positive attitude\n• Strong work ethic\n\nAdditional Information:\n• Temporary Stewardess opportunity\n• Recruitment by Harbor Elite Yacht Crew\n\n📩 Apply via email with your CV and availability."}$seed$::jsonb, 'c9a980d2-25ad-4ead-958f-fbc8ceff54d9', '2026-10-28'),
($seed$Deckhand - (3:1 rotation) New Build 80M M/Y - Start date ASAP

Male only due to cabin sharing, salary from 3000 Euro upward depending upon curent skills.

Joining the yacht in Europe, before she crosses to Florida / Caribbean for the winter season, the start date is ideally within the next week.

The yacht is recruiting for a Deckhand with a strong background in yachting, ideally one year on 50m plus vessels.

Tender driving, deck operations and working in the team will be part of your daily routine, so prior experience is a must.

Minimum requirements – PDSD, STCW and ENG1., and a definite non-smoker / vaper - B1/B2 Visa must be in hand.

There are several details to discuss, so if you are available and keen – please email chris@seadainerecruitment.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Deckhand","city":"","country":"Europe","type":"Rotational","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Designated Security Duties (DSD) - A-VI/6-2"],"required_skills":["RIB tender handling","Large tender driving (10m+)","Exterior Upkeep & Preservation","Exterior washdown / detailing","Crew teamwork","Team coordination"],"salary":"3000","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":true,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Proven Experience Required","gender":"Male","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"71 - 100m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"Share Cabin","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["B1/B2","Schengen","European Passport"],"contact_email":"chris@seadainerecruitment.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Deckhand – 262ft (80m) New Build Motor Yacht\n\n📍 Joining Location: Europe\n📅 Start Date: ASAP (Within One Week Preferred)\n📄 Contract: Permanent – 3:1 Rotation\n💰 Salary: From €3,000/month, Depending on Experience\n\nRequirements:\n• Previous yachting experience, ideally 1 year aboard yachts of 50m+\n• Strong tender-driving and deck operations experience\n• Valid STCW, ENG1 and PDSD\n• B1/B2 visa in hand\n• Must be a non-smoker and non-vaper\n• Male candidates only due to cabin arrangements\n• Strong teamwork skills and immediate availability\n\nAdditional Information:\n• New-build motor yacht\n• Winter itinerary: Florida and Caribbean\n• Joining in Europe before the Atlantic crossing\n\n📩 Apply via email with your CV."}$seed$::jsonb, '00f08af2-32c9-4e6a-8946-aca7d3c8d58a', '2026-10-28'),
($seed$Chief Officer (Rotational 2:2) Female only, due to cabins.

50m M/Y Private / Charter (Dual Season) – This is a permanent contract with a starting salary of 6000 USD pm x 12 - joining in the US.

Start date is currently Mid December for a full handover and to fall in with the current rotation.

The Captain and Chief Officer are looking at candidates now, as they are working to find the ideal personality to join this busy program.

Ideally, you will have strong experience in large tenders, and extensive watchkeeping experience.

Qualification: OOW 3000gt, STCW, ENG1 and B1/B2 in hand.

If you are interested, please email your CV with current location and availability to -

Chris@seadainerecruitment.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Chief Officer","city":"","country":"United States","type":"Rotational","start_month":"12","start_day":"middle","end_month":"","end_day":"","is_asap":false,"is_flexible":false,"required_license":"OOW Yachts 3000 GT","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Bridge watch / lookout","Nav support / chartwork","RIB tender handling","Large tender driving (10m+)"],"salary":"6000","salary_currency":"USD","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"Female","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private/Charter","homeport":"","liveaboard":"Share Cabin","season_type":"Dual Season","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"Chris@seadainerecruitment.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Chief Officer – 164ft (50m) Motor Yacht\n\n📍 Joining Location: USA\n📅 Start Date: Mid-December 2026\n📄 Contract: Permanent – 2:2 Rotation\n💰 Salary: $6,000 USD/month (12 Months Paid)\n\nRequirements:\n• OOW 3000GT certification\n• Valid STCW and ENG1\n• B1/B2 visa in hand\n• Extensive watchkeeping experience\n• Strong experience operating large tenders\n• Excellent teamwork and interpersonal skills\n• Female candidates only due to cabin arrangements\n\nAdditional Information:\n• Private/charter motor yacht\n• Busy dual-season programme\n• Full handover planned before joining the rotation\n\n📩 Apply via email with your CV, current location and availability."}$seed$::jsonb, 'eff55675-3c93-44d6-9fd5-b765804d4c4c', '2026-10-28'),
($seed$Position - 80m Private/Charter
New build motor yacht looking for an energetic, experienced deckhand to join our professional team of 6 on deck. Minimum 2 seasons’ experience. We have a great crew onboard, amazing boss and a very exciting itinerary planned. Fishing and spearfishing experience prefered.

3:1 rotation, €3000-3500 DOE, great training package, full medical.

Please only apply if you have the relevant experience. Send CVs to 80m.new.build@gmail.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Deckhand","city":"","country":"Europe","type":"Rotational","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Professional conduct","Crew teamwork","Team coordination","Recreational Fishing Experience","Advanced / Sport Fishing"],"salary":"3000","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"1","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"71 - 100m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"80m.new.build@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Deckhand – 262ft (80m) New Build Motor Yacht\n\n📍 Joining Location: Europe\n📄 Contract: Permanent – 3:1 Rotation\n💰 Salary: €3,000–3,500/month DOE\n\nRequirements:\n• Minimum 2 seasons of yachting experience\n• Strong deck operations experience\n• Energetic, professional and team-oriented\n• Fishing and spearfishing experience preferred\n\nAdditional Information:\n• Private/charter new-build motor yacht\n• Professional deck team of 6\n• Exciting cruising itinerary\n• Excellent training package\n• Full medical coverage\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'ff4c19da-7037-448c-91f1-f968fc3298ba', '2026-10-28'),
($seed$Deckhand – 60m+ S/Y Private – This is a permanent contract, where you will be joining the yacht in the shipyard to finish off the yard period.

Caribbean winter already confirmed, the yacht is ideally looking for a strong tender driver with strong technical skills.

Male candidates only due to cabin sharing and you must hold a Yacht master offshore or Yacht Rating to be considered for the role, due to the yachts safe manning.

Bonus skills which would also be considered– Divemaster and water sports.

40 days leave – 3200 Euro+ depending upon prior experience – application ideally as soon as possible as there is a lengthy process.

Prior sail experience is required; however strong tender driving skills are essential.

Qualification: Yachtmaster Offshore or Yacht Rating, PDSD, STCW, ENG1 - definite non-smoker / vaper.

There are several details to discuss re the role, so if you are available and keen – please email [chris@seadainerecruitment.com](mailto:chris@seadainerecruitment.com)$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Deckhand","city":"","country":"Europe","type":"Permanent","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"Yachtmaster Offshore","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Designated Security Duties (DSD) - A-VI/6-2"],"required_skills":["Sailing yacht seamanship","RIB tender handling","Large tender driving (10m+)","Guest Water Operations","Watersports assist"],"salary":"3200","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":true,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"","gender":"Male","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"51 - 70m","yacht_type":"Sailing Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"Share Cabin","season_type":"","holidays":"40","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"chris@seadainerecruitment.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Deckhand – 197ft+ (60m+) Private Sailing Yacht\n\n📍 Joining Location: Europe (Shipyard)\n📅 Start Date: ASAP\n📄 Contract: Permanent\n💰 Salary: From €3,200/month DOE\n🏖️ Leave: 40 Days\n\nRequirements:\n• Previous sailing yacht experience\n• Strong tender-driving and technical skills\n• Yachtmaster Offshore or Yacht Rating certification\n• Valid STCW, ENG1 and PDSD\n• Non-smoker and non-vaper\n• Male candidates only due to cabin arrangements\n• Divemaster and watersports experience advantageous\n\nAdditional Information:\n• Joining during the final stages of the shipyard period\n• Confirmed Caribbean winter itinerary\n• Strong tender-driving skills essential\n• Lengthy recruitment process – early applications encouraged\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'dc02b3c9-2961-42ed-a20d-ae64b0ea9ed7', '2026-10-28'),
($seed$🚨 CREW POSITION AVAILABLE – BOSUN / CHASE BOAT CAPTAIN 🚨
📍 Position: Bosun / Chase Boat Captain
🛥️ Vessel: 43m Motor Yacht – Private & Charter
🌎 Flag: Marshall Islands
📅 Start date: ASAP
🌴 Itinerary: Winter season in the Caribbean / Summer season in the Mediterranean

We are looking for an experienced and motivated Bosun / Chase Boat Captain to join our team on a 43m private and charter motor yacht.

Main Responsibilities:
• Operate and take responsibility for a 10m Boston Whaler chase boat.
• Organise and conduct guest transfers and water sports activities.
• Ensure the safe operation, maintenance and cleanliness of the chase boat and all associated equipment.
• Assist with guest activities and deliver a high standard of service.
• Manage and maintain the yacht’s deck equipment, exterior areas and toys.
• Supervise and coordinate one deckhand, ensuring that all deck operations and maintenance tasks are completed to a high standard.
• Assist the Chief Officer with daily deck operations and general maintenance.

Requirements:
✅ Valid US B1/B2 visa – MANDATORY.
✅ Minimum 2 seasons of experience in the yachting industry.
✅ Fluent English is essential.
✅ Proven experience operating tenders and handling guest transfers.
✅ Strong knowledge of water sports equipment and guest activities.
✅ Good maintenance skills, a proactive attitude and strong organisational abilities.
✅ Professional attitude and excellent guest service skills.
✅ Relevant licences and qualifications for operating a 10m chase boat.

⚠️ IMPORTANT: Applications will ONLY be considered from candidates who already hold a valid US B1/B2 visa. If you do not have this visa, please do not apply.

📩 If you meet all the requirements and are available to join ASAP, please send your CV, certificates, visa confirmation and references via mail : motoryacht2027@outlook.fr

Please include your current location and earliest availability.

Thank you!$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Bosun","city":"","country":"Caribbean","type":"Seasonal","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Guest Water Operations","Watersports assist","RIB tender handling","Large tender driving (10m+)"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"1","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Marshall Islands","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private/Charter","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["B1/B2"],"contact_email":"motoryacht2027@outlook.fr","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Bosun / Chase Boat Captain – 141ft (43m) Motor Yacht\n\n📍 Joining Location: Caribbean\n📅 Start Date: ASAP\n📄 Programme: Private / Charter\n💰 Salary: DOE\n\nRequirements:\n• Minimum 2 seasons of yachting experience\n• Valid US B1/B2 visa – Mandatory\n• Fluent English\n• Proven tender-driving and guest transfer experience\n• Relevant licences to operate a 10m chase boat\n• Strong watersports and deck maintenance skills\n• Excellent organisational and leadership abilities\n• Professional attitude and guest service skills\n\nResponsibilities:\n• Operate and maintain a 10m Boston Whaler chase boat\n• Coordinate guest transfers and watersports activities\n• Supervise one deckhand\n• Maintain exterior areas, deck equipment and water toys\n• Assist the Chief Officer with daily operations\n\nAdditional Information:\n• Marshall Islands flag\n• Caribbean winters and Mediterranean summers\n• Immediate availability preferred\n\n📩 Apply via email with your CV, certificates, B1/B2 visa confirmation, references, current location and availability."}$seed$::jsonb, '7374dd8e-6eb3-41a2-9c94-991837212dba', '2026-10-28'),
($seed$Day worker required - Deck
Looking for a day worker to help with wash down 29th October (possibly 30th October also) 0800 start.

40m Vessel will be in Genoa. Must be hard working and with some wash down experience!

Please send CV via WhatsApp to +1 754 262 7484$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Dayworker","city":"Genoa","country":"Italy","type":"DayWork","start_month":"10","start_day":"29","end_month":"","end_day":"","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Exterior Upkeep & Preservation","Exterior washdown / detailing"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"31 - 40m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"","contact_phone":"+1 754 262 7484","job_link":"","posting_duration":"3 days","description":"⚓ Deck Dayworker – 131ft (40m) Yacht\n\n📍 Location: Genoa, Italy\n📅 Dates: October 29, 2026 (Possibly October 30)\n⏰ Start Time: 08:00\n💰 Salary: DOE\n\nRequirements:\n• Previous yacht washdown experience\n• Hardworking and reliable\n• Available on the specified dates\n\nResponsibilities:\n• Assist with exterior washdowns\n• Support general deck cleaning duties\n\n📩 Apply via WhatsApp with your CV."}$seed$::jsonb, 'e2d1c142-4b63-4123-a3f0-dbfd73ffe514', '2026-10-28'),
($seed$Position Available: Sole / Experienced Stewardess
Vessel: 124-foot Luxury Motor Yacht (Flying Dutchman)

Flag: Foreign Flagged (Jamaican)

Location: Fort Lauderdale, FL (Shipyard)

Start Date: Within the next 10–12 days

Itinerary: Winter season in the Bahamas and Caribbean

Employment Status: Permanent, Full-Time Contract

Package & Benefits:

Salary: $4,300 USD / month + formal contract

Paid Leave: 35 paid leave days per year

Accommodations: Shared cabin with the Cook/Stew

Travel / Flights: Candidates must be local to South Florida or willing to self-fund/pay for their own travel to join the vessel in Fort Lauderdale. (The boat does not cover joining flight tickets).

About the Role:

We are seeking an experienced Stewardess (minimum 3–4 seasons of yachting experience) to join our crew on a permanent basis. This is primarily a sole-stew position aboard a private, Jamaican-flagged 124-foot motor yacht.

The vessel typically operates with only the Owner and his wife on board, maintaining a high-standard yet welcoming environment. For larger trips or events with extra guests, an additional 1–2 temporary stews are brought on board to assist with service and logistics.

Key Responsibilities:

High-end interior cleaning, detailing, and daily upkeep to superyacht standards

Fine service (meal and beverage service, table setups, turn-down service)

Interior guest provisioning and inventory management

Laundry, ironing, and garment care

Requirements:

Proven yachting experience (3–4 seasons minimum as Stewardess)

Strong attention to detail, proactive attitude, and professional service skills

Valid STCW Basic Training, ENG1 medical certificate, and appropriate work/travel authorization (B1/B2 visa or US citizenship/residency)

Local candidate preferred (or willing to cover own joining travel costs)

How to Apply:

Please email your updated CV, relevant certifications, and reference letters to:

captainfds84@gmail.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Steward(ess)","city":"Fort Lauderdale","country":"United States","type":"Permanent","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Source provisions","Manage inventory","Luxury Housekeeping Standards","Turn-down standards","High-end laundry & ironing"],"salary":"4300","salary_currency":"USD","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":true,"candidate_location_requirement":"local_only","years_in_rank":"2.5","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Jamaica","yacht_size":"31 - 40m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"Share Cabin","season_type":"","holidays":"35","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"captainfds84@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🛥️ Sole / Experienced Stewardess – 124ft (37.8m) Motor Yacht\n\n📍 Joining Location: Fort Lauderdale, Florida, USA\n📅 Start Date: Within 10–12 Days\n📄 Contract: Permanent, Full-Time\n💰 Salary: $4,300 USD/month\n🏖️ Leave: 35 Paid Days/Year\n\nRequirements:\n• Minimum 3–4 seasons of yachting experience\n• Strong housekeeping, laundry and fine service skills\n• Experience with provisioning and inventory management\n• Excellent attention to detail and professional attitude\n• Valid STCW and ENG1\n• B1/B2 visa or US citizenship/residency\n• South Florida candidates preferred\n• Must cover own travel expenses if joining from elsewhere\n\nResponsibilities:\n• Manage daily interior operations and guest service\n• Maintain high standards of cleaning and detailing\n• Handle laundry, garment care and provisioning\n• Coordinate with additional temporary stews when required\n\nAdditional Information:\n• Private, Jamaican-flagged motor yacht\n• Winter itinerary: Bahamas and Caribbean\n• Primarily serving the owner and his wife\n• Shared cabin with Cook/Stew\n• Joining during shipyard period\n• Joining flights not provided\n\n📩 Apply via email with your CV, certifications and reference letters."}$seed$::jsonb, '6ba0fca6-e0f5-4107-a57a-3054bce299d2', '2026-10-28'),
($seed$Hiring Captain 43 meters Sailing Yacht!

Sailing Match is currently searching for an experienced Captain
to join a 43m sailing yacht, which is in refit in Genoa under new ownership. The start date is ASAP.

We are looking for a true sailor and a natural leader. The owner wants a Captain who can build and lead a brand-new crew and who genuinely shares the values behind the program: nature, wellbeing and regenerative travel.

This is not a classic charter yacht. Guests come aboard for retreats, yoga, nature activities and meaningful experiences in remote places.

The program begins with a Mediterranean season from May. That is followed by an ocean crossing to Brazil, then Costa Rica and Amazon River cruising, before returning to the Med. It’s a rare chance to shape a yacht’s culture and program from day one as founding Captain.

Requirements:
Minimum Master 500 GT.
Proven experience as Captain on sailing yachts over 35m.
Strong personal sailing background (a genuine sailor is essential).
Refit or shipyard experience.
Ocean crossing experience preferred.
Strong leadership and crew-building skills.
Open-minded and aligned with nature, wellbeing and retreat-style hospitality.
Available to join ASAP.

Salary: DOE
If you are a passionate sailor and Captain looking to lead a unique, purpose-driven sailing program, we would love to hear from you.

Please send your CV to crew@sailingmatch.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Captain","city":"Genoa","country":"Italy","type":"Seasonal","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"Master Yachts 500 GT","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Strong boat handling skills","Nav support / chartwork","Refit & Project Support","Cruising area knowledge","Leadership"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Proven Experience Required","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Sailing Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"Own Cabin","season_type":"Single Season","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"crew@sailingmatch.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⛵ Captain – 141ft (43m) Sailing Yacht\n\n📍 Joining Location: Genoa, Italy\n📅 Start Date: ASAP\n💰 Salary: DOE\n\nRequirements:\n• Minimum Master 500 GT certification\n• Proven Captain experience aboard sailing yachts over 35m\n• Extensive sailing background\n• Previous refit or shipyard experience\n• Ocean crossing experience preferred\n• Strong leadership and crew-building skills\n• Passion for nature, wellbeing and sustainable travel\n• Immediate availability\n\nResponsibilities:\n• Build and lead a new crew\n• Oversee the yacht's refit under new ownership\n• Establish onboard standards and operations\n• Lead an international cruising and retreat programme\n\nAdditional Information:\n• Mediterranean season starting in May\n• Planned itinerary: Brazil, Costa Rica, Amazon River and Mediterranean\n• Unique programme focused on wellness retreats, yoga and nature experiences\n• Opportunity to shape the yacht's culture from the beginning\n\n📩 Apply via email with your CV."}$seed$::jsonb, '0ba0fd39-1ccf-440a-870c-f34182792d82', '2026-10-28'),
($seed$Crew cook + Watch Keeper
Hello all, I have a temporary job available, on a 27m motor yacht. For about 2 weeks  (31 October - 14 November).  Currently located in Napoli, with a crew of 4.

Job description: cooking for crew + watchkeeper while underway.  Must be competent and qualified to stand watch at night.  The yacht is waiting for a weather window to travel from Napoli to Barcelona (3 days travel).  The current chef has to leave on 31 October, so looking for a fill-in until the yacht reaches its winter destination.

Qualifications: Yachtmaster offshore (or equivalent), STCW, ENG1, Food Safety level II, references, your current location.

Pay: 275 EUR per day

If interested, send CV and qualifications to: doggersbank90@gmail.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Chef/Stew/Deck","city":"Naples","country":"Italy","type":"Temporary","start_month":"10","start_day":"31","end_month":"11","end_day":"14","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Reference Letter","Powerboat Level 2 / Tender Operator","Food Hygiene / HACCP Level 2"],"required_skills":["Bridge watch / lookout","Nav support / chartwork","Bridge Resource Management (BRM)"],"salary":"275","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"0 - 30m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"doggersbank90@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"👨‍🍳 Temporary Crew Cook / Watchkeeper – 89ft (27m) Motor Yacht\n\n📍 Joining Location: Naples, Italy\n📅 Dates: October 31 – November 14, 2026\n📄 Contract: Temporary – Approximately 2 Weeks\n💰 Salary: €275/day\n\nRequirements:\n• Yachtmaster Offshore or equivalent\n• Valid STCW and ENG1\n• Food Safety Level II certification\n• Competent and qualified for night watchkeeping\n• Previous cooking and watchkeeping experience\n• Professional references required\n\nResponsibilities:\n• Prepare daily meals for 4 crew members\n• Stand navigational watches during the passage\n• Assist with the yacht's delivery to its winter destination\n\nAdditional Information:\n• Route: Naples to Barcelona\n• Approximately 3 days underway, weather permitting\n• Temporary cover for the departing chef\n\n📩 Apply via email with your CV, qualifications, references and current location."}$seed$::jsonb, 'a182bcbf-20d3-4743-a618-0dd6a9a53009', '2026-10-28'),
($seed$Looking for an experienced 3rd stew,seasonal position
3500€,38 days leave,medical covered
Start date asap,50m private motor yacht very new, in France atm getting ready to cross to the Caribbean begining of november
A positive hard working girl that can tackle laundry and housekeeping as well as help with service,please no drama
It's a nice new and relatively quiete boat with good owners that dont run down their crew
Need to hold a B1B2 visa this is a must
Sends CV's to azram13@gmail.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"3rd Steward(ess)","city":"","country":"France","type":"Seasonal","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["High-End Service Execution","Luxury Housekeeping Standards","Turn-down standards","High-end laundry & ironing"],"salary":"3500","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Proven Experience Required","gender":"Female","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"38","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["B1/B2","Schengen","European Passport"],"contact_email":"azram13@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🧺 Third Stewardess – 164ft (50m) Private Motor Yacht\n\n📍 Joining Location: France\n🌎 Itinerary: France → Caribbean (Early November)\n📅 Start Date: ASAP\n📄 Contract: Seasonal\n💰 Salary: €3,500/month\n🏖️ Annual Leave: 38 Days\n🏥 Medical Insurance Covered\n\nRequirements:\n• Previous experience as a Third Stewardess\n• Valid B1/B2 visa (mandatory)\n• Strong laundry and housekeeping skills\n• Ability to assist with guest service\n• Positive, hardworking and team-oriented attitude\n• Female candidate preferred\n\nResponsibilities:\n• Manage laundry and housekeeping duties\n• Assist with interior service when required\n• Maintain high standards throughout the yacht\n\nAdditional Information:\n• New, modern private motor yacht\n• Relatively quiet owner programme\n• Supportive onboard environment\n• Caribbean crossing scheduled for early November\n\n📩 Apply via email with your CV."}$seed$::jsonb, '40c75517-1641-40b9-98b0-f2065bed8447', '2026-10-27'),
($seed$50m FF Charter Yacht

Seeking a Chief Stewardess for 50m Charter Yacht.

Would consider an experienced charter 2nd stewardess looking to step up and run her own interior

Start Date: ASAP
Preference for candidates in USA

Vessel Details:
· 50m Charter Yacht
· Heavy Charter: Bahamas, Caribbean, US East Coast - Must be legal to work in US
· 9-11 Crew
· 3-4 Interior Crew
· Miami Based

Position Requirements:
· B1/B2, US Citizen or Green Card holder
· Strong Charter Experience a must
· Must be looking for a busy charter program
· Confident in all interior areas and able to hit the ground running
· Energetic, organised and outgoing
· No visible tattoos, presentable
· Excellent written and verbal references – will be checked

Position Details
· 60 days paid leave
· 2 return flights per annum
· SEA, MLC Compliant Contract
If you meet the above requirements and are looking for your next busy charter boat then send your cover letter and CV to 160charteryacht@gmail.com with “Chief Stewardess” as subject line.

Please do not DM$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Chief Steward(ess)","city":"Miami","country":"United States","type":"Permanent","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Luxury Housekeeping Standards","High-End Service Execution","Turn-down standards","High-end laundry & ironing"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":true,"is_random_drug_testing":false,"is_charter_experience_required":true,"local_candidates_only":true,"candidate_location_requirement":"local_only","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Charter (only)","homeport":"","liveaboard":"","season_type":"","holidays":"60","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"160charteryacht@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🛥️ Chief Stewardess – 164ft (50m) Charter Motor Yacht\n\n📍 Joining Location: Miami, Florida, USA\n📅 Start Date: ASAP\n💰 Salary: DOE\n🏖️ Leave: 60 Paid Days/Year\n\nRequirements:\n• Strong charter yacht experience\n• Experienced Second Stewardesses ready to step up considered\n• B1/B2 visa, US citizenship or Green Card\n• Confident managing all interior departments\n• Excellent leadership, organisation and guest service skills\n• Energetic, outgoing and professional\n• No visible tattoos\n• Excellent written and verbal references\n• Must be comfortable with a busy charter programme\n\nResponsibilities:\n• Lead an interior team of 3–4 crew\n• Oversee guest service, housekeeping and laundry\n• Coordinate interior operations during charters\n• Maintain high standards of presentation and hospitality\n\nAdditional Information:\n• Miami-based, foreign-flagged charter yacht\n• Bahamas, Caribbean and US East Coast itinerary\n• Total crew of 9–11\n• Two return flights annually\n• SEA and MLC-compliant contract\n• US-based candidates preferred\n\n📩 Apply via email with your CV and cover letter. Subject: Chief Stewardess."}$seed$::jsonb, 'e7787733-3bc6-45cb-ad68-a61d7dc7fe66', '2026-10-28'),
($seed$NOW HIRING BOAT DETAILER SUTHERLAND SHIRE 🛥️🧼
I’m looking for someone for an to start immediately experience a bonus but not necessary.

The Role & Responsibilities

You will be helping us keep luxury boats and yachts looking immaculate.

Duties include:

• Washing down decks, hulls, and superstructures.

• Machine polishing and hand waxing fiberglass gelcoats.

• Interior cabin cleaning, detailing, and window clearing.

• Teak deck cleaning and general brightwork maintenance.

What We Offer:

• Excellent Pay: Up to $30-$35 per hour (negotiable based on experience and efficiency).

• Immediate Start: Get working and earning this week.

• Flexible Schedule: Part-time, casual, and backpacker-friendly hours available.

• Stunning Workplaces: Spend your days working on the water

What We Are Looking For:

• Hard Workers: Physically fit, energetic, and not afraid of getting your hands dirty.

• Attention to Detail: Proud of doing a thorough, high-quality job.

• Reliability: Punctual, motivated, and able to work independently or in a small team.

• Working Holiday Visa Holders Welcome: Perfect for backpackers looking for steady, lucrative cash flow.

DM for more details or text Sean 0408007690$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Dayworker","city":"Sutherland Shire, Sydney","country":"Australia","type":"DayWork","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Physically fit","Attention to detail","Hands-on approach","Ability to work independently"],"salary":"30","salary_currency":"AUD","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Open to Green Crew","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"0 - 30m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Australian Work Rights"],"contact_email":"","contact_phone":"0408007690","job_link":"","posting_duration":"2 weeks","description":"🧼 Boat Detailer – Luxury Boats & Yachts\n\n📍 Location: Sutherland Shire, Sydney, Australia\n📅 Start Date: Immediate\n📄 Contract: Part-Time / Casual / Flexible Hours\n💰 Salary: AUD $30–35/hour (Negotiable DOE)\n\nRequirements:\n• No previous experience required – experience advantageous\n• Physically fit, energetic and hardworking\n• Excellent attention to detail\n• Reliable, punctual and motivated\n• Ability to work independently or in a small team\n• Working Holiday Visa holders welcome\n\nResponsibilities:\n• Wash decks, hulls and superstructures\n• Machine polishing and hand waxing\n• Interior cleaning and detailing\n• Window cleaning\n• Teak deck cleaning and brightwork maintenance\n\nAdditional Information:\n• Immediate start\n• Flexible, backpacker-friendly working hours\n• Work aboard luxury boats and yachts\n\n📩 Apply via text message."}$seed$::jsonb, '4a5369c5-233c-4e2f-8842-6e858b283ddf', '2026-10-29'),
($seed$2nd STEWARDESS NEEDED FOR A 50m MOTOR YACHT

Start Date: November
Itinerary: Caribbean – Med

Are you an experienced and confident 2nd Stewardess with a creative flair, a sharp eye for detail and a passion for creating memorable guest experiences?

We’re looking for a strong 2nd Stewardess to join a 50m dual-season motor yacht in the Caribbean

You will be working closely with the Chief Stew; you’ll help deliver exceptional service while supporting and guiding the 3rd Stew.

From beautifully styled tablescapes to themed dinners and special events, this role is perfect for someone who loves adding those extra touches that make a guest experience truly special.

REQUIREMENTS FOR APPLICATION:
·         STCW/ENG1
·         B1/B2 in hand (No exceptions)
·         Minimum 5 years’ yachting experience, including at least 2 years as 2nd Stew on 50m+ vessels or Chief Stew on a smaller yacht.
·         Strong service skills and a genuine passion for hospitality.
·         Vibrant, outgoing and able to take initiative.
·         Wine knowledge would be a huge bonus!
·         Excellent References are needed

PACKAGE:
·         DOE Competitive Salary
·         Tips & Bonuses
·         Medical cover & Flights
·         Flights provided.
·         38 days annual leave

Please send applications to tanya@19yachtcrew.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"2nd Steward(ess)","city":"","country":"Caribbean","type":"Seasonal","start_month":"11","start_day":"","end_month":"","end_day":"","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Guest interaction skills","High-End Service Execution","Table décor & styling","Event / theme night setup","Wine service (WSET 1/2)","Attention to detail","Positive attitude","Professional conduct","Discretion & confidentiality"],"salary":"","salary_currency":"","is_doe":true,"is_tips":true,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"2","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"Dual Season","holidays":"38","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"tanya@19yachtcrew.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🛥️ Second Stewardess – 164ft (50m) Motor Yacht\n\n📍 Joining Location: Caribbean\n📅 Start Date: November 2026\n📄 Programme: Dual Season – Caribbean / Mediterranean\n💰 Salary: Competitive, DOE\n🏖️ Leave: 38 Days Annually\n\nRequirements:\n• Minimum 5 years of yachting experience\n• At least 2 years as Second Stewardess aboard 50m+ yachts or Chief Stewardess on smaller yachts\n• Valid STCW and ENG1\n• B1/B2 visa in hand – Mandatory\n• Strong guest service and hospitality skills\n• Creative flair for tablescapes, themed dinners and special events\n• Excellent attention to detail and initiative\n• Outgoing, confident and professional attitude\n• Wine knowledge highly advantageous\n• Excellent references required\n\nResponsibilities:\n• Support the Chief Stewardess with interior operations\n• Guide and assist the Third Stewardess\n• Deliver high-end guest service\n• Organise creative table settings and special events\n\nAdditional Information:\n• Tips and bonuses\n• Medical coverage\n• Flights provided\n• Dual-season cruising programme\n\n📩 Apply via email with your CV and references."}$seed$::jsonb, 'dbbb2f3d-ab14-4c04-bcba-13d81460d9f9', '2026-10-29'),
($seed$First Mate - Private 20m+ MY

*Must be legal to work in the US*

I'm seeking a First Mate to join a 20m+ Motor Yacht.
Start date: November, 2026
Package: Salary paid is USD
Itinerary: US East Coast & Bahamas

Experience / attributes required:
Offshore bill fishing experience (mandatory)
Previous yachting experience (preferable)
Proven experience running chase boats and tenders
Strong understanding of deck maintenance
Inventory management
Qualifications required:
STCW (fully updated)
ENG1
US Passport / Green Card Holder

Please send CV's to Kevin.Norrish@hillrobinson.com

Thank you all!$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Chief Officer","city":"","country":"United States","type":"Seasonal","start_month":"11","start_day":"","end_month":"","end_day":"","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Recreational Fishing Experience","Advanced / Sport Fishing","Exterior inventory","Strong boat handling skills","Exterior Upkeep & Preservation","RIB tender handling","Large tender driving (10m+)","Open-water towing (chase/tender)"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":true,"candidate_location_requirement":"local_only","years_in_rank":"Proven Experience Required","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"0 - 30m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"Year-round","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen"],"contact_email":"Kevin.Norrish@hillrobinson.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ First Mate – 66ft+ (20m+) Private Motor Yacht\n\n📍 Location: US East Coast & Bahamas\n📅 Start Date: November 2026\n💰 Salary: DOE (USD)\n\nRequirements:\n• Offshore billfishing experience – Mandatory\n• Proven chase boat and tender operation experience\n• Strong deck maintenance skills\n• Inventory management experience\n• Previous yachting experience preferred\n• Valid STCW and ENG1\n• US passport or Green Card required\n• Must be legally authorised to work in the USA\n\nResponsibilities:\n• Operate tenders and chase boats\n• Support offshore fishing activities\n• Maintain deck equipment and exterior areas\n• Manage deck inventory\n\nAdditional Information:\n• Private motor yacht\n• US East Coast and Bahamas cruising programme\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'b9e41472-1dea-4621-8a2d-ef804f2e5b48', '2026-10-29'),
($seed$Looking for a temp crew chef for Atlantic crossing  on  60m + sailing yacht from 17th November to 13 th December , joining location Valencia

Must have ships cook certificate

Hygiene level 3

Crew of 11 ,
healthy home cooked meals , no dietary requirements,driving licence preferred as chef will need to provision locally before crossing .

Salary 250€ per day

Applications and cv to
yachtcheftemp67@icloud.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Chef","city":"Valencia","country":"Spain","type":"Crossing","start_month":"11","start_day":"17","end_month":"12","end_day":"13","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Driver's License","Culinary Certificate / Diploma","Food Hygiene / HACCP Level 3"],"required_skills":["Produce crew meals at scale","Fresh & Healthy Cuisine"],"salary":"250","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"51 - 70m","yacht_type":"Sailing Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"yachtcheftemp67@icloud.com","contact_phone":"","job_link":"","posting_duration":"1 month","description":"👨‍🍳 Temporary Crew Chef – 197ft+ (60m+) Sailing Yacht\n\n📍 Joining Location: Valencia, Spain\n🌊 Itinerary: Atlantic Crossing\n📅 Dates: November 17 – December 13, 2026\n📄 Contract: Temporary\n💰 Salary: €250/day\n👥 Crew: 11\n\nRequirements:\n• Valid Ship's Cook Certificate (mandatory)\n• Food Hygiene Level 3 certification\n• Ability to prepare healthy, home-cooked meals for 11 crew members\n• Driving licence preferred for local provisioning\n\nResponsibilities:\n• Prepare daily meals for the crew\n• Manage galley operations during the Atlantic crossing\n• Handle provisioning in Valencia before departure\n• Maintain food hygiene and galley standards\n\nAdditional Information:\n• No special dietary requirements\n• Temporary assignment for the Atlantic crossing\n\n📩 Apply via email with your CV."}$seed$::jsonb, '898b755c-6bae-4870-96a3-f8e19eeb20ed', '2026-10-27'),
($seed$ETO needed for 2/3 weeks on a 75m M/Y in Spain, email s.diggle@arrowyacht.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Electrician","city":"Barcelona","country":"Spain","type":"Temporary","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Electrical & Control Problem-Solving","Electrical fault finding (AC/DC)"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"71 - 100m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"s.diggle@arrowyacht.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚡ ETO – 246ft (75m) Motor Yacht\n\n📍 Location: Barcelona, Spain\n📅 Start Date: Immediate\n📄 Contract: Temporary (2–3 Weeks)\n💰 Salary: DOE\n\nPosition Details:\n• Temporary Electro-Technical Officer (ETO) assignment\n• Immediate joining required\n• Short-term position aboard a 75m motor yacht\n\n📩 Apply via email with your CV."}$seed$::jsonb, '47804f40-d548-4a51-9cca-dcf72df1f6a5', '2026-10-27'),
($seed$120’ US-flagged private yacht seeking an experienced, professional stewardess to manage a junior stew for a short-term trip to Key West with a full boat, November 1-9. Please email all CVs to brittanyadkison@gmail.com.

Hello all,$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Steward(ess)","city":"","country":"United States","type":"Temporary","start_month":"11","start_day":"1","end_month":"11","end_day":"9","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["High-End Service Execution","Luxury Housekeeping Standards","Interior Operations Management","Well-organized work style","Professional conduct"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"United States","yacht_size":"31 - 40m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"Year-round","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen"],"contact_email":"brittanyadkison@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"🛥️ Temporary Experienced Stewardess – 120ft (36.6m) Private Motor Yacht\n\n📍 Location: Key West, Florida, USA\n📅 Dates: November 1–9, 2026\n📄 Contract: Temporary\n💰 Salary: DOE\n\nRequirements:\n• Previous yachting experience\n• Strong guest service and interior management skills\n• Professional attitude and excellent organisational abilities\n• Ability to supervise a Junior Stewardess\n• Available for the full trip\n\nResponsibilities:\n• Manage and guide the Junior Stewardess\n• Oversee interior operations during a busy guest trip\n• Maintain high standards of guest service\n\nAdditional Information:\n• US-flagged private yacht\n• Fully booked guest trip to Key West\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'c437eab1-b594-4366-aeec-d9fe286f4ddc', '2026-10-29'),
($seed$A friend of mine is looking for a Deckhand only in Greece.
Yacht is based in Athens
50m+ motor yacht.
Temp. Position for two months, with possibility of extention for the right candidate.
It is a must to sleep onboard.
Must hold up to date the following certificates:
-ENG1
-STCW
-Security Awareness
Starting date: 01/11/26.

2500€ salary
seedekyachts@gmail.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Deckhand","city":"Athens","country":"Greece","type":"Temporary","start_month":"11","start_day":"1","end_month":"","end_day":"","is_asap":false,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Designated Security Duties (DSD) - A-VI/6-2"],"required_skills":["Strong boat handling skills","Exterior Upkeep & Preservation"],"salary":"2500","salary_currency":"EUR","is_doe":false,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"Yacht Experience Preferred","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"41 - 50m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"Share Cabin","season_type":"Single Season","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"seedekyachts@gmail.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Temporary Deckhand – 164ft+ (50m+) Motor Yacht\n\n📍 Joining Location: Athens, Greece\n📅 Start Date: November 1, 2026\n📄 Contract: Temporary – 2 Months (Possible Extension)\n💰 Salary: €2,500/month\n\nRequirements:\n• Must currently be located in Greece\n• Valid STCW and ENG1\n• Security Awareness certification\n• Willingness to live and sleep onboard\n• Available for the specified start date\n\nAdditional Information:\n• Athens-based motor yacht\n• Two-month contract with potential extension for the right candidate\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'd42b7b57-316c-4da6-a504-51d77b27b1e2', '2026-10-29'),
($seed$Per M/Y azimut grande 35 metri cerco deckhand, stagione invernale ed estiva.

Preferibilmente con esperienza.

Bandiera Panamá. Lo yacht si trova in Italia.

Invio CV interessati su whatsapp +39 3408132255$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Deckhand","city":"","country":"Italy","type":"Seasonal","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Professional conduct","Strong work ethic","Strong boat handling skills","Exterior Upkeep & Preservation"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Panama","yacht_size":"31 - 40m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"","contact_phone":"+39 3408132255","job_link":"","posting_duration":"2 weeks","description":"⚓ Deckhand – 115ft (35m) Azimut Grande Motor Yacht\n\n📍 Joining Location: Italy\n📄 Contract: Winter & Summer Seasons\n💰 Salary: DOE\n\nRequirements:\n• Previous yachting experience preferred\n• Deck maintenance and general deck operations\n• Professional attitude and strong work ethic\n\nAdditional Information:\n• Azimut Grande motor yacht\n• Panama flag\n• Winter and summer employment\n\n📩 Apply via WhatsApp with your CV."}$seed$::jsonb, '7259c34b-871a-4bc3-af2a-1259adf941c2', '2026-10-29'),
($seed$Experienced crew chefs with proven experience aboard 60m+ motor yachts — please get in touch if you are available to join immediately in the Med.

Requirements:
Professional culinary training.
Proven experience working aboard 60m+ motor yachts.
All relevant certifications valid and in date.
Currently located in the EU or UK.

Email your cv to leah@a-zyachting.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Cook/Crew Chef","city":"","country":"Mediterranean","type":"Seasonal","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR","Food Hygiene / HACCP Level 2"],"required_skills":["Produce crew meals at scale"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"region_only","years_in_rank":"Similar Size & Rank Required","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"Foreign Flag","yacht_size":"51 - 70m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"","homeport":"","liveaboard":"","season_type":"","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Schengen","European Passport"],"contact_email":"leah@a-zyachting.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"👨‍🍳 Experienced Crew Chef – 197ft+ (60m+) Motor Yacht\n\n📍 Joining Location: Mediterranean\n📅 Start Date: Immediate\n💰 Salary: DOE\n\nRequirements:\n• Professional culinary training\n• Proven experience aboard motor yachts of 60m+\n• All relevant certifications valid and up to date\n• Must currently be located in the EU or UK\n• Immediate availability\n\nAdditional Information:\n• Position for an experienced yacht Crew Chef\n• Candidates must meet the vessel size and experience requirements\n\n📩 Apply via email with your CV."}$seed$::jsonb, 'd2926030-8d82-45c0-ae3c-c56994341068', '2026-10-28'),
($seed$Looking for a full-time Mate/Engineer
Private 2024, 95 foot M/Y, US flag Vessel. Boat is docked in Miami , South Beach. Mainly weekend day trips with a couple trips to the Bahamas. ￼ MAIN RESPONSIBILITY IS EXTERIOR. For further information, please contact.
patrickbaltz@yahoo.com$seed$, $seed${"work_environment":"Onboard","work_location":"","title":"Mate/Engineer","city":"Miami","country":"United States","type":"Permanent","start_month":"","start_day":"","end_month":"","end_day":"","is_asap":true,"is_flexible":false,"required_license":"","engineering_license":"","required_documents":["ENG1 Seafarer Medical Certificate","STCW Basic Training (A-VI/1) - PST, FPFF, EFA, PSSR"],"required_skills":["Exterior Upkeep & Preservation","Propulsion & Machinery Problem-Solving","Professional conduct","Positive attitude"],"salary":"","salary_currency":"","is_doe":true,"is_tips":false,"is_smoke_free_yacht":false,"is_dry_boat":false,"is_no_visible_tattoos":false,"is_random_drug_testing":false,"is_charter_experience_required":false,"local_candidates_only":false,"candidate_location_requirement":"","years_in_rank":"","gender":"","team":"No","teammate_rank":"","teammate_salary":"","teammate_salary_currency":"","teammate_experience":"","teammate_required_license":"","teammate_engineering_license":"","teammate_required_documents":[],"teammate_required_skills":[],"flag":"United States","yacht_size":"0 - 30m","yacht_type":"Motor Yacht","propulsion_type":"","uses":"Private","homeport":"","liveaboard":"","season_type":"Year-round","holidays":"","language_1":"English","language_1_fluency":"Fluent","language_2":"","language_2_fluency":"","language_3":"","language_3_fluency":"","visas":["Green card or US Citizen","B1/B2"],"contact_email":"patrickbaltz@yahoo.com","contact_phone":"","job_link":"","posting_duration":"2 weeks","description":"⚓ Mate / Engineer – 95ft (29m) Private Motor Yacht\n\n📍 Joining Location: Miami Beach, Florida, USA\n📄 Contract: Full-Time\n💰 Salary: DOE\n\nRequirements:\n• Experience in yacht deck operations and maintenance\n• Engineering knowledge and practical technical skills\n• Ability to manage exterior responsibilities\n• Professional and reliable attitude\n\nResponsibilities:\n• Primarily responsible for exterior maintenance and deck operations\n• Assist with engineering duties\n• Support weekend trips and occasional Bahamas cruising\n\nAdditional Information:\n• 2024-built, US-flagged private motor yacht\n• Based in South Beach, Miami\n• Mainly weekend day trips, with occasional trips to the Bahamas\n\n📩 Apply via email with your CV."}$seed$::jsonb, '746ecdcf-7e71-4110-98e5-0f31a0cb91d6', '2026-10-29');
