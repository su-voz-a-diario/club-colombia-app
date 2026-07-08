# Carga inicial de alumnos

Este script importa alumnos reales usando Firebase Admin SDK y el modelo `students/{studentId}`.

Por seguridad, el script corre en modo simulacion por defecto. Solo escribe en Firestore cuando se agrega `--commit`.

## Variables requeridas

Configurar en el entorno:

```bash
FIREBASE_PROJECT_ID=club-colombia-futbol
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@club-colombia-futbol.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Uso

Validar sin escribir:

```bash
node scripts/import-students.js --file alumnos.json
```

Importar definitivamente:

```bash
node scripts/import-students.js --file alumnos.json --commit
```

Tambien acepta CSV:

```bash
node scripts/import-students.js --file alumnos.csv --commit
```

## JSON esperado

```json
[
  {
    "name": "Nombre del Alumno",
    "parentName": "Nombre del Acudiente",
    "parentEmail": "acudiente@example.com",
    "category": "Sub-10 Competitivo",
    "categoryId": "sub-10-competitivo",
    "assignedCoachUid": "",
    "status": "suspended",
    "billingStatus": "pending_payment",
    "healthStatus": "optimal"
  }
]
```

Campos obligatorios:

- `name`
- `parentName`
- `parentEmail`
- `category`

Campos opcionales:

- `studentId`
- `parentUid`
- `categoryId`
- `assignedCoachUid`
- `status`
- `billingStatus`
- `healthStatus`

## CSV esperado

```csv
name,parentName,parentEmail,category,categoryId,assignedCoachUid,status,billingStatus,healthStatus
Nombre del Alumno,Nombre del Acudiente,acudiente@example.com,Sub-10 Competitivo,sub-10-competitivo,,suspended,pending_payment,optimal
```

## Idempotencia

El script omite un alumno si encuentra:

- el mismo `studentId`, o
- la misma combinacion `normalizedName + parentEmail`.

Si el padre ya existe en `users/{parentEmail}`, solo agrega campos faltantes y anade `studentId` a `studentIds`.

No sobrescribe datos criticos de padres existentes como `role`, `status` o `name`.
