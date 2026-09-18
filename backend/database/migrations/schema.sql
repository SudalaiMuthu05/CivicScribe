-- ============================================================
-- CIVICSCRIBE DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- ENUM TYPES
-- ============================================================

do $$
begin

    create type complaint_status as enum (
        'draft',
        'under_review',
        'processing',
        'submitted',
        'resolved',
        'rejected',
        'closed'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type complaint_relevance as enum (
        'relevant',
        'irrelevant',
        'needs_clarification'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type evidence_relevance as enum (
        'relevant',
        'irrelevant',
        'uncertain'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type complaint_relation_type as enum (
        'duplicate',
        'related',
        'supporting'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type notification_channel as enum (
        'sms',
        'telegram'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type notification_status as enum (
        'pending',
        'sent',
        'failed'
    );

exception
    when duplicate_object then null;
end $$;


do $$
begin

    create type registration_status as enum (
        'pending',
        'submitted',
        'confirmed',
        'failed'
    );

exception
    when duplicate_object then null;
end $$;


-- ============================================================
-- CITIZENS
-- ============================================================

create table if not exists citizens (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    phone_number text,
    email text,

    telegram_chat_id text,

    preferred_language text,
    preferred_input_language text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- ISSUE CATEGORIES
-- DATA-DRIVEN
-- ============================================================

create table if not exists issue_categories (
    id uuid primary key default gen_random_uuid(),

    code text unique not null,
    name text not null,

    description text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- JURISDICTIONS
-- ============================================================

create table if not exists jurisdictions (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    state text,
    district text,
    city text,
    locality text,

    postal_code text,

    latitude double precision,
    longitude double precision,

    metadata jsonb not null default '{}'::jsonb,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- AUTHORITIES
-- ============================================================

create table if not exists authorities (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    authority_type text,

    description text,

    official_website text,
    official_email text,
    official_phone text,

    submission_url text,

    supports_online_submission boolean not null default false,
    supports_attachments boolean not null default false,

    metadata jsonb not null default '{}'::jsonb,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- AUTHORITY ROUTING RULES
-- ============================================================

create table if not exists authority_routing_rules (
    id uuid primary key default gen_random_uuid(),

    issue_category_id uuid
        references issue_categories(id)
        on delete set null,

    jurisdiction_id uuid
        references jurisdictions(id)
        on delete set null,

    authority_id uuid not null
        references authorities(id)
        on delete cascade,

    priority integer not null default 100,

    conditions jsonb not null default '{}'::jsonb,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- CIVIC ISSUES
--
-- Represents the REAL-WORLD issue.
--
-- Multiple citizen complaints can belong to one civic issue.
--
-- Example:
--
-- Civic Issue #1
--      |
--      +-- Complaint A
--      +-- Complaint B
--      +-- Complaint C
--
-- All three citizens reported the same pothole.
-- ============================================================

create table if not exists civic_issues (
    id uuid primary key default gen_random_uuid(),

    issue_category_id uuid
        references issue_categories(id)
        on delete set null,

    title text not null,

    description text,

    normalized_issue text,

    location_text text,

    latitude double precision,
    longitude double precision,

    jurisdiction_id uuid
        references jurisdictions(id)
        on delete set null,

    severity_score numeric(5,2),

    severity_level text,

    status complaint_status not null default 'processing',

    first_reported_at timestamptz not null default now(),
    last_reported_at timestamptz not null default now(),

    resolved_at timestamptz,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- COMPLAINTS
-- ============================================================

create table if not exists complaints (
    id uuid primary key default gen_random_uuid(),

    complaint_number text unique,

    citizen_id uuid not null
        references citizens(id)
        on delete cascade,

    civic_issue_id uuid
        references civic_issues(id)
        on delete set null,

    issue_category_id uuid
        references issue_categories(id)
        on delete set null,

    -- Original citizen input
    original_input text not null,

    input_type text not null default 'text',

    -- Language information
    detected_language text,
    input_language_code text,

    normalized_text text,

    output_language text,

    -- AI relevance result
    relevance complaint_relevance,

    relevance_score numeric(5,2),

    relevance_reason text,

    -- Extracted information
    extracted_information jsonb not null default '{}'::jsonb,

    -- Location
    location_text text,

    latitude double precision,
    longitude double precision,

    jurisdiction_id uuid
        references jurisdictions(id)
        on delete set null,

    -- AI severity / attention signal
    severity_score numeric(5,2),

    severity_level text,

    severity_explanation text,

    -- Complaint lifecycle
    status complaint_status not null default 'draft',

    -- Whether this complaint became a new civic issue
    is_new_issue boolean not null default true,

    -- Whether citizen supported an existing issue
    is_supporting_existing_issue boolean not null default false,

    citizen_approved boolean not null default false,

    approved_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- COMPLAINT RELATIONSHIPS
--
-- Used for duplicate / related complaints.
-- ============================================================

create table if not exists complaint_links (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    related_complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    relation_type complaint_relation_type not null,

    similarity_score numeric(5,2),

    match_reason text,

    created_at timestamptz not null default now(),

    constraint different_complaints
        check (complaint_id <> related_complaint_id),

    constraint unique_complaint_relation
        unique (
            complaint_id,
            related_complaint_id,
            relation_type
        )
);


-- ============================================================
-- EVIDENCE / IMAGES
-- ============================================================

create table if not exists evidence (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    evidence_type text not null default 'image',

    -- Cloudinary information
    cloudinary_public_id text,
    cloudinary_url text,
    cloudinary_resource_type text,

    original_filename text,
    mime_type text,
    file_size bigint,

    file_hash text,

    uploaded_at timestamptz not null default now(),

    -- Image AI analysis
    image_description text,

    detected_objects jsonb not null default '[]'::jsonb,

    detected_issue text,

    -- Image relevance
    relevance evidence_relevance,

    relevance_score numeric(5,2),

    relevance_reason text,

    -- Text ↔ image consistency
    consistency_score numeric(5,2),

    consistency_status text,

    consistency_explanation text,

    ai_analysis jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- AI ANALYSIS
--
-- Stores AI results instead of overwriting original input.
-- ============================================================

create table if not exists ai_analysis (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    analysis_type text not null,

    model_provider text,
    model_name text,

    prompt_version text,

    input_data jsonb not null default '{}'::jsonb,

    output_data jsonb not null default '{}'::jsonb,

    confidence_score numeric(5,2),

    processing_time_ms integer,

    created_at timestamptz not null default now()
);


-- ============================================================
-- GRIEVANCE DRAFTS
-- ============================================================

create table if not exists grievance_drafts (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    version integer not null default 1,

    language_code text,

    title text,

    subject text,

    body text,

    questions jsonb not null default '[]'::jsonb,

    facts_used jsonb not null default '[]'::jsonb,

    inferred_information jsonb not null default '[]'::jsonb,

    missing_information jsonb not null default '[]'::jsonb,

    ai_generated boolean not null default true,

    citizen_edited boolean not null default false,

    citizen_approved boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint unique_draft_version
        unique (complaint_id, version)
);


-- ============================================================
-- AUTHORITY ASSIGNMENTS
-- ============================================================

create table if not exists authority_assignments (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    authority_id uuid not null
        references authorities(id)
        on delete restrict,

    routing_rule_id uuid
        references authority_routing_rules(id)
        on delete set null,

    routing_confidence numeric(5,2),

    routing_reason text,

    assigned_at timestamptz not null default now(),

    is_current boolean not null default true,

    created_at timestamptz not null default now()
);


-- ============================================================
-- REGISTRATIONS
-- ============================================================

create table if not exists registrations (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    authority_id uuid
        references authorities(id)
        on delete set null,

    registration_status registration_status not null default 'pending',

    official_reference_id text,

    submission_channel text,

    submitted_at timestamptz,

    confirmed_at timestamptz,

    response_data jsonb not null default '{}'::jsonb,

    error_message text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),

    citizen_id uuid
        references citizens(id)
        on delete cascade,

    complaint_id uuid
        references complaints(id)
        on delete cascade,

    registration_id uuid
        references registrations(id)
        on delete set null,

    channel notification_channel not null,

    recipient text,

    language_code text,

    message text,

    status notification_status not null default 'pending',

    provider_message_id text,

    sent_at timestamptz,

    error_message text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- STATUS HISTORY
-- ============================================================

create table if not exists status_history (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid not null
        references complaints(id)
        on delete cascade,

    previous_status complaint_status,

    new_status complaint_status not null,

    changed_by text,

    reason text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),

    complaint_id uuid
        references complaints(id)
        on delete cascade,

    citizen_id uuid
        references citizens(id)
        on delete set null,

    action text not null,

    entity_type text,
    entity_id uuid,

    details jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_citizens_phone
    on citizens(phone_number);

create index if not exists idx_citizens_telegram
    on citizens(telegram_chat_id);

create index if not exists idx_complaints_citizen
    on complaints(citizen_id);

create index if not exists idx_complaints_civic_issue
    on complaints(civic_issue_id);

create index if not exists idx_complaints_category
    on complaints(issue_category_id);

create index if not exists idx_complaints_status
    on complaints(status);

create index if not exists idx_complaints_location
    on complaints(location_text);

create index if not exists idx_complaints_created
    on complaints(created_at desc);

create index if not exists idx_evidence_complaint
    on evidence(complaint_id);

create index if not exists idx_ai_analysis_complaint
    on ai_analysis(complaint_id);

create index if not exists idx_complaint_links_complaint
    on complaint_links(complaint_id);

create index if not exists idx_complaint_links_related
    on complaint_links(related_complaint_id);

create index if not exists idx_authority_rules_category
    on authority_routing_rules(issue_category_id);

create index if not exists idx_authority_rules_jurisdiction
    on authority_routing_rules(jurisdiction_id);

create index if not exists idx_authority_assignments_complaint
    on authority_assignments(complaint_id);

create index if not exists idx_registrations_complaint
    on registrations(complaint_id);

create index if not exists idx_notifications_complaint
    on notifications(complaint_id);

create index if not exists idx_status_history_complaint
    on status_history(complaint_id);

create index if not exists idx_audit_logs_complaint
    on audit_logs(complaint_id);


-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists citizens_updated_at on citizens;

create trigger citizens_updated_at
before update on citizens
for each row
execute function update_updated_at_column();


drop trigger if exists issue_categories_updated_at on issue_categories;

create trigger issue_categories_updated_at
before update on issue_categories
for each row
execute function update_updated_at_column();


drop trigger if exists jurisdictions_updated_at on jurisdictions;

create trigger jurisdictions_updated_at
before update on jurisdictions
for each row
execute function update_updated_at_column();


drop trigger if exists authorities_updated_at on authorities;

create trigger authorities_updated_at
before update on authorities
for each row
execute function update_updated_at_column();


drop trigger if exists authority_routing_rules_updated_at on authority_routing_rules;

create trigger authority_routing_rules_updated_at
before update on authority_routing_rules
for each row
execute function update_updated_at_column();


drop trigger if exists civic_issues_updated_at on civic_issues;

create trigger civic_issues_updated_at
before update on civic_issues
for each row
execute function update_updated_at_column();


drop trigger if exists complaints_updated_at on complaints;

create trigger complaints_updated_at
before update on complaints
for each row
execute function update_updated_at_column();


drop trigger if exists evidence_updated_at on evidence;

create trigger evidence_updated_at
before update on evidence
for each row
execute function update_updated_at_column();


drop trigger if exists grievance_drafts_updated_at on grievance_drafts;

create trigger grievance_drafts_updated_at
before update on grievance_drafts
for each row
execute function update_updated_at_column();


drop trigger if exists registrations_updated_at on registrations;

create trigger registrations_updated_at
before update on registrations
for each row
execute function update_updated_at_column();


drop trigger if exists notifications_updated_at on notifications;

create trigger notifications_updated_at
before update on notifications
for each row
execute function update_updated_at_column();


-- ============================================================
-- COMPLAINT NUMBER GENERATOR
-- ============================================================

create sequence if not exists complaint_number_sequence;


create or replace function generate_complaint_number()
returns trigger
language plpgsql
as $$
begin

    if new.complaint_number is null then

        new.complaint_number :=
            'CS-' ||
            to_char(current_date, 'YYYY') ||
            '-' ||
            lpad(
                nextval('complaint_number_sequence')::text,
                6,
                '0'
            );

    end if;

    return new;

end;
$$;


drop trigger if exists generate_complaint_number_trigger
on complaints;


create trigger generate_complaint_number_trigger
before insert on complaints
for each row
execute function generate_complaint_number();


-- ============================================================
-- INITIAL ISSUE CATEGORIES
--
-- These are DATA, not application logic.
-- They can be changed later from Supabase.
-- ============================================================

insert into issue_categories
    (code, name, description)
values
    (
        'road_damage',
        'Road Damage',
        'Potholes, damaged roads, cracks and related road issues'
    ),
    (
        'streetlight',
        'Streetlight',
        'Non-functional or damaged streetlights'
    ),
    (
        'water_supply',
        'Water Supply',
        'Water supply interruptions, leakage and related issues'
    ),
    (
        'garbage',
        'Garbage / Waste Management',
        'Garbage collection and waste management issues'
    ),
    (
        'drainage',
        'Drainage',
        'Blocked drains, sewage overflow and drainage issues'
    ),
    (
        'electricity',
        'Electricity',
        'Electricity supply and infrastructure issues'
    ),
    (
        'public_safety',
        'Public Safety',
        'Issues that may affect public safety'
    ),
    (
        'other',
        'Other',
        'Other civic grievances'
    )
on conflict (code)
do nothing;




-- ============================================================
-- END OF SCHEMA
-- ============================================================