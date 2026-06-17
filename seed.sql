-- ============================================================================
-- SCRIPT DE SEMBRADO (SEED DATA): ESCUELA DE FÚTBOL CLUB COLOMBIA
-- ============================================================================

-- NOTA: Ejecutar este script en el editor SQL de Supabase después de ejecutar schema.sql.

-- 1. Poblar Categorías Deportivas
INSERT INTO categories (id, name, min_age, max_age, level, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'Sub-8 Iniciación', 5, 8, 'Iniciación', 'Fase formativa inicial enfocada en motricidad básica y fundamentación divertida.'),
('c0000000-0000-0000-0000-000000000002', 'Sub-10 Competitivo', 9, 10, 'Intermedio', 'Introducción al juego colectivo, fundamentos técnicos y táctica simplificada.'),
('c0000000-0000-0000-0000-000000000003', 'Sub-12 Elite', 11, 12, 'Avanzado', 'Alto rendimiento infantil, preparación física adaptada y torneos de liga local.'),
('c0000000-0000-0000-0000-000000000004', 'Sub-15 Avanzado', 13, 15, 'Avanzado', 'Táctica avanzada de campo completo, posicionamiento y preparación competitiva juvenil.');

-- 2. Poblar Usuarios (Email y Rol)
INSERT INTO users (id, email, role) VALUES
('u0000000-0000-0000-0000-000000000001', 'admin@clubcolombia.com', 'admin'),
('u0000000-0000-0000-0000-000000000002', 'mario.silva@clubcolombia.com', 'coach'),
('u0000000-0000-0000-0000-000000000003', 'carlos.v@clubcolombia.com', 'coach'),
('u0000000-0000-0000-0000-000000000004', 'ricardo.garcia@gmail.com', 'parent');

-- 3. Poblar Perfiles de Usuario
INSERT INTO profiles (id, first_name, last_name, phone, avatar_url) VALUES
('u0000000-0000-0000-0000-000000000001', 'Coordinador', 'General', '+57 300 999 8888', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin'),
('u0000000-0000-0000-0000-000000000002', 'Mario', 'Silva', '+57 300 777 6666', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mario'),
('u0000000-0000-0000-0000-000000000003', 'Carlos', 'Valderrama', '+57 300 555 4444', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'),
('u0000000-0000-0000-0000-000000000004', 'Ricardo', 'García', '+57 300 111 2222', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo');

-- 4. Poblar Datos de Entrenadores
INSERT INTO coaches (id, bio, license_type) VALUES
('u0000000-0000-0000-0000-000000000002', 'Ex-futbolista profesional con más de 10 años de experiencia en fútbol base.', 'UEFA A License'),
('u0000000-0000-0000-0000-000000000003', 'Especialista en preparación táctica juvenil y scout deportivo regional.', 'CONMEBOL PRO');

-- 5. Relacionar Entrenadores con Categorías
INSERT INTO coach_categories (coach_id, category_id) VALUES
('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'), -- Mario - Sub-8
('u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'), -- Mario - Sub-10
('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003'), -- Carlos - Sub-12
('u0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004'); -- Carlos - Sub-15

-- 6. Poblar Horarios de Entrenamiento
INSERT INTO schedules (category_id, day_of_week, start_time, end_time, pitch_number) VALUES
('c0000000-0000-0000-0000-000000000001', 1, '15:30:00', '17:00:00', 'Cancha 1 - Sintética'), -- Lunes Sub-8
('c0000000-0000-0000-0000-000000000001', 3, '15:30:00', '17:00:00', 'Cancha 1 - Sintética'), -- Miér Sub-8
('c0000000-0000-0000-0000-000000000002', 2, '16:00:00', '18:00:00', 'Cancha 2 - Grama'),      -- Martes Sub-10
('c0000000-0000-0000-0000-000000000002', 4, '16:00:00', '18:00:00', 'Cancha 2 - Grama'),      -- Jueves Sub-10
('c0000000-0000-0000-0000-000000000003', 1, '16:00:00', '18:00:00', 'Cancha Principal'),     -- Lunes Sub-12
('c0000000-0000-0000-0000-000000000003', 3, '16:00:00', '18:00:00', 'Cancha Principal'),     -- Miér Sub-12
('c0000000-0000-0000-0000-000000000004', 2, '17:00:00', '19:00:00', 'Cancha Principal'),     -- Martes Sub-15
('c0000000-0000-0000-0000-000000000004', 4, '17:00:00', '19:00:00', 'Cancha Principal');     -- Jueves Sub-15

-- 7. Poblar Estudiantes (Atletas)
INSERT INTO students (id, parent_id, first_name, last_name, birth_date, category_id, category_assignment, photo_url, status, qr_code_token) VALUES
('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000004', 'Juan Andrés', 'García', '2017-06-15', 'c0000000-0000-0000-0000-000000000002', 'automatic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan', 'active', 'qr_token_juan_123'),
('s0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000004', 'Mateo', 'Ospina Díaz', '2015-03-22', 'c0000000-0000-0000-0000-000000000003', 'automatic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo', 'active', 'qr_token_mateo_456'),
('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000004', 'Santiago', 'Valencia', '2014-08-11', 'c0000000-0000-0000-0000-000000000003', 'automatic', 'https://api.dicebear.com/7.x/avataaars/svg?seed=santi', 'suspended', 'qr_token_santi_789');

-- 8. Historial de Categorías (Excepciones manuales - Juan Andrés promovido antes)
INSERT INTO category_history (student_id, previous_category_id, new_category_id, assignment_type, reason) VALUES
('s0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'automatic', 'Asignación de categoría por edad al registrarse.');

-- 9. Poblar Historial de Pagos
INSERT INTO payments (student_id, amount, status, type, billing_date, due_date, mp_preference_id, mp_payment_id, paid_at) VALUES
('s0000000-0000-0000-0000-000000000001', 120000.00, 'paid', 'subscription', '2026-05-01', '2026-05-05', 'pref_mock_juan_01', 'mp_pay_55661', '2026-05-03 10:15:00'),
('s0000000-0000-0000-0000-000000000001', 120000.00, 'paid', 'subscription', '2026-06-01', '2026-06-05', 'pref_mock_juan_02', 'mp_pay_88992', '2026-06-04 14:30:00'),
('s0000000-0000-0000-0000-000000000002', 140000.00, 'paid', 'subscription', '2026-06-01', '2026-06-05', 'pref_mock_mateo_01', 'mp_pay_99223', '2026-06-05 09:00:00'),
-- Santiago tiene un pago vencido por más de 5 días hábiles (due_date: 02 de Junio de 2026)
('s0000000-0000-0000-0000-000000000003', 140000.00, 'pending', 'subscription', '2026-06-01', '2026-06-02', 'pref_mock_santi_01', NULL, NULL);

-- 10. Poblar Registro de Asistencias
INSERT INTO attendance (student_id, schedule_id, category_id, date, status, registered_by) VALUES
('s0000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', '2026-06-09', 'present', 'u0000000-0000-0000-0000-000000000002'),
('s0000000-0000-0000-0000-000000000001', NULL, 'c0000000-0000-0000-0000-000000000002', '2026-06-11', 'present', 'u0000000-0000-0000-0000-000000000002'),
('s0000000-0000-0000-0000-000000000002', NULL, 'c0000000-0000-0000-0000-000000000003', '2026-06-08', 'present', 'u0000000-0000-0000-0000-000000000003'),
('s0000000-0000-0000-0000-000000000002', NULL, 'c0000000-0000-0000-0000-000000000003', '2026-06-10', 'absent', 'u0000000-0000-0000-0000-000000000003');

-- 11. Poblar Evaluaciones Técnicas (Juan Andrés)
INSERT INTO evaluations (student_id, coach_id, category_id, date, speed, passing, dribbling, shooting, physical, discipline, tactical_notes) VALUES
('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '2026-05-30', 8, 7, 9, 8, 8, 9, 'Muestra gran agilidad en regate corto y muy buen comportamiento disciplinario en los entrenos.');
