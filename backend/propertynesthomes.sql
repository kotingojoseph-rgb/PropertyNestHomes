--
-- PostgreSQL database dump
--

\restrict kfLfZzpehqdYda2RJT362TYOdEMF7io2sgQrT7pZqfeZXB2zXbNcUO683W83Fjp

-- Dumped from database version 18.4 (Debian 18.4-1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: propertyadmin
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    property_id integer,
    user_id integer,
    viewing_date timestamp without time zone,
    status character varying(50)
);


ALTER TABLE public.bookings OWNER TO propertyadmin;

--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: propertyadmin
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO propertyadmin;

--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: propertyadmin
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: properties; Type: TABLE; Schema: public; Owner: propertyadmin
--

CREATE TABLE public.properties (
    id integer NOT NULL,
    title character varying(255),
    description text,
    price numeric,
    location text,
    bedrooms integer,
    bathrooms integer,
    property_type character varying(100),
    status character varying(50),
    owner_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country character varying(100),
    state_province character varying(100),
    city character varying(100),
    address text,
    postal_code character varying(20),
    currency character varying(10) DEFAULT 'NGN'::character varying,
    area character varying(100),
    garage character varying(100),
    year_built integer,
    image text
);


ALTER TABLE public.properties OWNER TO propertyadmin;

--
-- Name: properties_id_seq; Type: SEQUENCE; Schema: public; Owner: propertyadmin
--

CREATE SEQUENCE public.properties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.properties_id_seq OWNER TO propertyadmin;

--
-- Name: properties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: propertyadmin
--

ALTER SEQUENCE public.properties_id_seq OWNED BY public.properties.id;


--
-- Name: property_images; Type: TABLE; Schema: public; Owner: propertyadmin
--

CREATE TABLE public.property_images (
    id integer NOT NULL,
    property_id integer,
    image_url text,
    is_cover boolean DEFAULT false,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.property_images OWNER TO propertyadmin;

--
-- Name: property_images_id_seq; Type: SEQUENCE; Schema: public; Owner: propertyadmin
--

CREATE SEQUENCE public.property_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.property_images_id_seq OWNER TO propertyadmin;

--
-- Name: property_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: propertyadmin
--

ALTER SEQUENCE public.property_images_id_seq OWNED BY public.property_images.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: propertyadmin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(255),
    email character varying(255),
    password character varying(255),
    role character varying(50),
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(30),
    id_type character varying(50),
    id_number character varying(100),
    id_document_url text
);


ALTER TABLE public.users OWNER TO propertyadmin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: propertyadmin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO propertyadmin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: propertyadmin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: properties id; Type: DEFAULT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.properties ALTER COLUMN id SET DEFAULT nextval('public.properties_id_seq'::regclass);


--
-- Name: property_images id; Type: DEFAULT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.property_images ALTER COLUMN id SET DEFAULT nextval('public.property_images_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: propertyadmin
--

COPY public.bookings (id, property_id, user_id, viewing_date, status) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: propertyadmin
--

COPY public.properties (id, title, description, price, location, bedrooms, bathrooms, property_type, status, owner_id, created_at, country, state_province, city, address, postal_code, currency, area, garage, year_built, image) FROM stdin;
36	Luxury Duplex	Beautiful 5-bedroom duplex with swimming pool.	250000000	\N	5	6	Duplex	Available	5	2026-06-30 18:56:31.703405	Nigeria	Lagos	Lekki	12 Admiralty Way	106104	NGN	\N	\N	\N	\N
4	Luxury Apartment	Beautiful apartment in Lekki Phase 1	180000000	Lekki	4	4	Apartment	Available	3	2026-06-26 22:14:49.378763	Nigeria	Lagos	Lekki	Admiralty Way	106104	NGN	\N	\N	\N	\N
5	Executive Villa	Luxury villa in Wuse	300000000	Abuja	6	7	Villa	Available	3	2026-06-26 22:14:49.380914	Nigeria	FCT	Abuja	Wuse Zone 6	900288	NGN	\N	\N	\N	\N
6	Modern Family House	Beautiful home in Dallas	650000	Dallas	4	3	House	Available	3	2026-06-26 22:14:49.382884	United States	Texas	Dallas	Oak Street	75201	USD	\N	\N	\N	\N
7	Downtown Condo	Luxury condo in Toronto	890000	Toronto	3	2	Condo	Available	3	2026-06-26 22:14:49.384886	Canada	Ontario	Toronto	King Street	M5H 2N2	CAD	\N	\N	\N	\N
8	Luxury Penthouse	Skyline view of Shanghai	5200000	Shanghai	5	5	Penthouse	Available	3	2026-06-26 22:14:49.386599	China	Shanghai	Shanghai	Pudong District	200120	CNY	\N	\N	\N	\N
3	Luxury 5 Bedroom Duplex	Modern smart home with swimming pool	250000000	Yenagoa	5	6	Duplex	Available	3	2026-06-26 22:14:49.367233	Nigeria	Bayelsa	Yenagoa	Opolo Road	561101	NGN	920 sqm	3 Cars	2024	https://images.unsplash.com/photo-1600585154340-be6161a56a0c
\.


--
-- Data for Name: property_images; Type: TABLE DATA; Schema: public; Owner: propertyadmin
--

COPY public.property_images (id, property_id, image_url, is_cover, uploaded_at) FROM stdin;
1	3	test.jpg	f	2026-06-29 19:21:25.728203
2	3	1782776378446-686596796.jpg	f	2026-06-29 19:39:38.475251
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: propertyadmin
--

COPY public.users (id, full_name, email, password, role, verified, created_at, phone, id_type, id_number, id_document_url) FROM stdin;
2	Jane Doe	jane@gmail.com	$2b$10$uWTJyvf2niwFv1BJCRaL5.2wdRfVP6Bj//yAjWOv3nQL4l7p.cLl.	\N	f	2026-06-25 01:23:40.137318	08099999999	National ID	B9876543	\N
4	Kotingo Joseph	kotingo.dev@gmail.com	$2b$10$31mz0nPxFVa8FX4xI6Z9VOOIcvop4oAbDi3ljhjaWnE11brX9ofPm	\N	f	2026-06-26 16:35:35.33651	08012345678	National ID	98765432101	\N
3	Kotingo Joseph	kotingojoseph@gmail.com	$2b$10$TaYOL0D8hTmyxNARftQFV.V/IKBzl3Ewivazs9GTzqeMxcqVlRY.S	\N	f	2026-06-26 16:22:04.649575	08012345678	National ID	12345678901	\N
5	John Doe	john@example.com	$2b$10$xGh5Hf1rCnf0HJIfgD8V3OTN8OoSXAViVTScMmaqOuF4Gon8QSu8O	\N	f	2026-06-30 17:37:08.154032	08012345678	NIN	12345678901	\N
\.


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: propertyadmin
--

SELECT pg_catalog.setval('public.bookings_id_seq', 1, false);


--
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: propertyadmin
--

SELECT pg_catalog.setval('public.properties_id_seq', 36, true);


--
-- Name: property_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: propertyadmin
--

SELECT pg_catalog.setval('public.property_images_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: propertyadmin
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_images property_images_pkey; Type: CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: properties properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: property_images property_images_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: propertyadmin
--

ALTER TABLE ONLY public.property_images
    ADD CONSTRAINT property_images_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- PostgreSQL database dump complete
--

CREATE TABLE IF NOT EXISTS advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    company_name VARCHAR(255),
    target_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    property_id INTEGER,
    amount DECIMAL(12,2) NOT NULL,
    payment_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS property_promotions (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    plan VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\unrestrict kfLfZzpehqdYda2RJT362TYOdEMF7io2sgQrT7pZqfeZXB2zXbNcUO683W83Fjp

