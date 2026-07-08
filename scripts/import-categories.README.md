# Carga de categorias

Este script prepara la coleccion `categories/{categoryId}` usando Firebase Admin SDK.

No incluye categorias reales del club. Solo importa el archivo que se le entregue.

Por seguridad, corre en modo simulacion por defecto. Solo escribe en Firestore cuando se agrega `--commit`.

## Variables requeridas

```bash
FIREBASE_PROJECT_ID=club-colombia-futbol
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@club-colombia-futbol.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Uso

Validar sin escribir:

```bash
npm run import:categories -- --file categorias.json
```

Importar definitivamente:

```bash
npm run import:categories -- --file categorias.json --commit
```

Tambien acepta CSV:

```bash
npm run import:categories -- --file categorias.csv --commit
```

## JSON esperado

```json
[
  {
    "categoryId": "categoria-oficial",
    "name": "Nombre oficial de categoria",
    "shortName": "Nombre corto",
    "ageMin": 8,
    "ageMax": 10,
    "monthlyFee": 0,
    "inscriptionFee": 0,
    "active": true,
    "assignedCoachUid": "",
    "coachName": "",
    "trainingDays": ["Martes", "Jueves"],
    "trainingHours": "16:00 - 18:00",
    "maxStudents": 20,
    "currentStudents": 0,
    "description": ""
  }
]
```

## CSV esperado

```csv
categoryId,name,shortName,ageMin,ageMax,monthlyFee,inscriptionFee,active,assignedCoachUid,coachName,trainingDays,trainingHours,maxStudents,currentStudents,description
categoria-oficial,Nombre oficial de categoria,Nombre corto,8,10,0,0,true,,,Martes;Jueves,16:00 - 18:00,20,0,
```

## Campos obligatorios

- `categoryId`
- `name`

## Validaciones

El script valida:

- `categoryId` obligatorio
- `name` obligatorio
- edades numericas validas
- `ageMin <= ageMax`
- cuotas numericas no negativas
- cupos no negativos
- duplicados dentro del archivo
- categorias inactivas como advertencia

## Idempotencia

El documento se escribe en `categories/{categoryId}`.

Si la categoria no existe, el script la crea.

Si ya existe, compara campos y actualiza solo los campos que cambian. Si no hay cambios, la omite.

El reporte final incluye:

- `created`
- `updated`
- `skipped`
- `errors`
- `warnings`
