-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (Custom auth)
create table if not exists users (
    id uuid primary key default uuid_generate_v4(),
    username text unique not null,
    password_hash text not null,
    full_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips table
create table if not exists trips (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references users(id) on delete cascade not null,
    name text not null,
    destination text not null,
    start_date date not null,
    end_date date not null,
    cover_image text,
    budget_total numeric(12, 2) not null default 0.00,
    expense_mode text not null check (expense_mode in ('per_trip', 'split')),
    share_token text unique,
    is_public boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expense Categories table
create table if not exists expense_categories (
    id uuid primary key default uuid_generate_v4(),
    trip_id uuid references trips(id) on delete cascade not null,
    name text not null,
    unique(trip_id, name)
);

-- Expenses table
create table if not exists expenses (
    id uuid primary key default uuid_generate_v4(),
    trip_id uuid references trips(id) on delete cascade not null,
    category_id uuid references expense_categories(id) on delete set null,
    amount numeric(12, 2) not null default 0.00,
    note text,
    expense_date date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expense Participants table (for split bills)
create table if not exists expense_participants (
    id uuid primary key default uuid_generate_v4(),
    expense_id uuid references expenses(id) on delete cascade not null,
    participant_name text not null,
    share_amount numeric(12, 2) not null default 0.00
);

-- Rundown Days table
create table if not exists rundown_days (
    id uuid primary key default uuid_generate_v4(),
    trip_id uuid references trips(id) on delete cascade not null,
    day_date date not null,
    order_index integer not null,
    unique(trip_id, day_date)
);

-- Rundown Activities table
create table if not exists rundown_activities (
    id uuid primary key default uuid_generate_v4(),
    rundown_day_id uuid references rundown_days(id) on delete cascade not null,
    title text not null,
    location text,
    start_time time not null,
    end_time time not null,
    note text,
    order_index integer not null,
    cost numeric(12, 2) not null default 0.00
);

-- Seed initial admin user
-- Username: admin
-- Password: admin123
insert into users (username, password_hash, full_name)
values ('admin', '$2b$10$nzVR5uFv4bhtK5gKcBtRCetin.IfkuEORzjQSO4oRrbB9e123nmYa', 'Trip Administrator')
on conflict (username) do nothing;
