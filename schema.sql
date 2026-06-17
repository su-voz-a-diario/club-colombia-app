-- ============================================================================
-- ESQUEMA DE BASE DE DATOS: ESCUELA DE FÚTBOL CLUB COLOMBIA
-- ============================================================================

-- Habilitar UUID si no está activo
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios (Autenticación)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coach', 'parent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Perfiles de Usuario (Información Personal)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categorías de la Escuela
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    min_age INT NOT NULL,
    max_age INT NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('Iniciación', 'Intermedio', 'Avanzado')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Estudiantes (Atletas)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_assignment VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (category_assignment IN ('automatic', 'manual')),
    photo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Entrenadores (Ficha Técnica)
CREATE TABLE coaches (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    bio TEXT,
    license_type VARCHAR(100) NOT NULL
);

-- 6. Relación Entrenadores - Categorías (Muchos a Muchos)
CREATE TABLE coach_categories (
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (coach_id, category_id)
);

-- 7. Horarios de Entrenamiento
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    pitch_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Pagos (Mensualidades e Inscripciones)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'refunded')),
    type VARCHAR(20) NOT NULL DEFAULT 'subscription' CHECK (type IN ('enrollment', 'subscription')),
    billing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    mp_preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Asistencia (Control Diario)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Snapshot histórico
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
    registered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Evaluaciones Técnicas Trimestrales
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Snapshot histórico
    date DATE NOT NULL,
    speed INT NOT NULL CHECK (speed BETWEEN 1 AND 10),
    passing INT NOT NULL CHECK (passing BETWEEN 1 AND 10),
    dribbling INT NOT NULL CHECK (dribbling BETWEEN 1 AND 10),
    shooting INT NOT NULL CHECK (shooting BETWEEN 1 AND 10),
    physical INT NOT NULL CHECK (physical BETWEEN 1 AND 10),
    discipline INT NOT NULL CHECK (discipline BETWEEN 1 AND 10),
    tactical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Histórico de Categorías (Auditoría)
CREATE TABLE category_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    previous_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    new_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('automatic', 'manual_override')),
    reason TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ============================================================================
CREATE INDEX idx_students_parent ON students(parent_id);
CREATE INDEX idx_students_category ON students(category_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_evaluations_student ON evaluations(student_id);

-- ============================================================================
-- FUNCIONES Y LOGICA DE NEGOCIO EN BASE DE DATOS
-- ============================================================================

-- A. Función para calcular días hábiles (excluyendo Sábado y Domingo)
CREATE OR REPLACE FUNCTION calculate_business_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    curr_date DATE := start_date;
    business_days INTEGER := 0;
BEGIN
    IF start_date >= end_date THEN
        RETURN 0;
    END IF;
    WHILE curr_date < end_date LOOP
        curr_date := curr_date + 1;
        -- 1 (Lunes) a 5 (Viernes)
        IF EXTRACT(ISODOW FROM curr_date) < 6 THEN
            business_days := business_days + 1;
        END IF;
    END LOOP;
    RETURN business_days;
END;
$$ LANGUAGE plpgsql;

-- B. Función de suspensión automática por mora después de 5 días hábiles
CREATE OR REPLACE FUNCTION check_and_suspend_delinquent_students()
RETURNS VOID AS $$
BEGIN
    -- Cambiar a suspendido si el estudiante tiene pagos vencidos de más de 5 días hábiles
    UPDATE students
    SET status = 'suspended'
    WHERE id IN (
        SELECT DISTINCT student_id 
        FROM payments 
        WHERE status = 'pending' 
          AND calculate_business_days(due_date, CURRENT_DATE) > 5
    ) AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- C. Función para la transición automática de categorías por edad
CREATE OR REPLACE FUNCTION update_student_categories_by_age()
RETURNS VOID AS $$
DECLARE
    r RECORD;
    new_cat_id UUID;
    student_age INTEGER;
BEGIN
    FOR r IN 
        SELECT id, birth_date, category_id 
        FROM students 
        WHERE category_assignment = 'automatic' 
          AND status = 'active'
    LOOP
        -- Calcular edad aproximada al día de hoy
        student_age := DATE_PART('year', AGE(r.birth_date));
        
        -- Buscar la categoría que coincide con el rango de edad
        SELECT id INTO new_cat_id 
        FROM categories 
        WHERE student_age >= min_age AND student_age <= max_age
        LIMIT 1;
        
        -- Si hay cambio, actualizar y guardar registro histórico
        IF new_cat_id IS NOT NULL AND (r.category_id IS NULL OR r.category_id != new_cat_id) THEN
            
            INSERT INTO category_history (student_id, previous_category_id, new_category_id, assignment_type, reason)
            VALUES (r.id, r.category_id, new_cat_id, 'automatic', 'Transición automática por cumplimiento de edad cumplida.');
            
            UPDATE students 
            SET category_id = new_cat_id 
            WHERE id = r.id;
        END IF;
    END FOR;
END;
$$ LANGUAGE plpgsql;

-- D. Trigger para registrar historial cuando el entrenador realiza un Override Manual
CREATE OR REPLACE FUNCTION log_student_category_override()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
        IF NEW.category_assignment = 'manual' THEN
            INSERT INTO category_history (
                student_id, 
                previous_category_id, 
                new_category_id, 
                assignment_type, 
                reason
            )
            VALUES (
                NEW.id, 
                OLD.category_id, 
                NEW.category_id, 
                'manual_override', 
                'Modificación manual autorizada por el cuerpo técnico.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_category_override
AFTER UPDATE OF category_id ON students
FOR EACH ROW
EXECUTE FUNCTION log_student_category_override();
