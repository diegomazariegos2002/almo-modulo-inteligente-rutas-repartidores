-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "rutas";

-- CreateEnum
CREATE TYPE "rutas"."rol_usuario" AS ENUM ('CLIENTE', 'REPARTIDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "rutas"."estado_repartidor" AS ENUM ('DISPONIBLE', 'EN_RUTA');

-- CreateEnum
CREATE TYPE "rutas"."estado_orden" AS ENUM ('PENDIENTE_ASIGNACION', 'ASIGNADA', 'EN_RUTA', 'ENTREGADA');

-- CreateSequence (manual)
-- Numeración del folio de las órdenes. Prisma no modela secuencias sueltas: se crea
-- aquí y el DEFAULT de "ord_folio" la consume, así el folio es único bajo concurrencia.
CREATE SEQUENCE "rutas"."seq_ru_orden_folio" START WITH 1 INCREMENT BY 1;

-- CreateTable
CREATE TABLE "rutas"."ru_repartidor" (
    "rep_id" SERIAL NOT NULL,
    "rep_nombre" VARCHAR(120) NOT NULL,
    "rep_lat" DECIMAL(9,6) NOT NULL,
    "rep_lng" DECIMAL(9,6) NOT NULL,
    "rep_estado" "rutas"."estado_repartidor" NOT NULL DEFAULT 'DISPONIBLE',
    "rep_capacidad_kg" DECIMAL(6,2) NOT NULL,
    "rep_creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rep_actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pk_ru_repartidor" PRIMARY KEY ("rep_id")
);

-- CreateTable
CREATE TABLE "rutas"."ru_usuario" (
    "usu_id" TEXT NOT NULL,
    "usu_nombre" VARCHAR(120) NOT NULL,
    "usu_correo" VARCHAR(160) NOT NULL,
    "usu_password_hash" TEXT NOT NULL,
    "usu_rol" "rutas"."rol_usuario" NOT NULL,
    "usu_activo" BOOLEAN NOT NULL DEFAULT true,
    "usu_creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usu_actualizado_en" TIMESTAMPTZ(3) NOT NULL,
    "usu_repartidor_id" INTEGER,

    CONSTRAINT "pk_ru_usuario" PRIMARY KEY ("usu_id")
);

-- CreateTable
CREATE TABLE "rutas"."ru_orden" (
    "ord_id" TEXT NOT NULL,
    "ord_folio" VARCHAR(20) NOT NULL DEFAULT ('ORD-'::text || lpad((nextval('rutas.seq_ru_orden_folio'::regclass))::text, 6, '0'::text)),
    "ord_lat" DECIMAL(9,6) NOT NULL,
    "ord_lng" DECIMAL(9,6) NOT NULL,
    "ord_peso_kg" DECIMAL(6,2) NOT NULL,
    "ord_direccion" VARCHAR(120),
    "ord_estado" "rutas"."estado_orden" NOT NULL DEFAULT 'PENDIENTE_ASIGNACION',
    "ord_secuencia_ruta" INTEGER,
    "ord_creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ord_actualizado_en" TIMESTAMPTZ(3) NOT NULL,
    "ord_cliente_id" TEXT NOT NULL,
    "ord_repartidor_id" INTEGER,

    CONSTRAINT "pk_ru_orden" PRIMARY KEY ("ord_id")
);

-- CreateTable
CREATE TABLE "rutas"."ru_orden_historial" (
    "oh_id" SERIAL NOT NULL,
    "oh_estado" "rutas"."estado_orden" NOT NULL,
    "oh_fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oh_orden_id" TEXT NOT NULL,
    "oh_repartidor_id" INTEGER,

    CONSTRAINT "pk_ru_orden_historial" PRIMARY KEY ("oh_id")
);

-- CreateIndex
CREATE INDEX "idx_ru_repartidor_rep_estado" ON "rutas"."ru_repartidor"("rep_estado");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ru_usuario_usu_correo" ON "rutas"."ru_usuario"("usu_correo");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ru_usuario_usu_repartidor_id" ON "rutas"."ru_usuario"("usu_repartidor_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ru_orden_ord_folio" ON "rutas"."ru_orden"("ord_folio");

-- CreateIndex
CREATE INDEX "idx_ru_orden_ord_estado_ord_creado_en" ON "rutas"."ru_orden"("ord_estado", "ord_creado_en");

-- CreateIndex
CREATE INDEX "idx_ru_orden_ord_repartidor_id_ord_estado" ON "rutas"."ru_orden"("ord_repartidor_id", "ord_estado");

-- CreateIndex
CREATE INDEX "idx_ru_orden_ord_cliente_id_ord_creado_en" ON "rutas"."ru_orden"("ord_cliente_id", "ord_creado_en");

-- CreateIndex
CREATE INDEX "idx_ru_orden_historial_oh_orden_id" ON "rutas"."ru_orden_historial"("oh_orden_id");

-- AddForeignKey
ALTER TABLE "rutas"."ru_usuario" ADD CONSTRAINT "fk_usuario_repartidor" FOREIGN KEY ("usu_repartidor_id") REFERENCES "rutas"."ru_repartidor"("rep_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas"."ru_orden" ADD CONSTRAINT "fk_orden_cliente" FOREIGN KEY ("ord_cliente_id") REFERENCES "rutas"."ru_usuario"("usu_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas"."ru_orden" ADD CONSTRAINT "fk_orden_repartidor" FOREIGN KEY ("ord_repartidor_id") REFERENCES "rutas"."ru_repartidor"("rep_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas"."ru_orden_historial" ADD CONSTRAINT "fk_orden_historial_orden" FOREIGN KEY ("oh_orden_id") REFERENCES "rutas"."ru_orden"("ord_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas"."ru_orden_historial" ADD CONSTRAINT "fk_orden_historial_repartidor" FOREIGN KEY ("oh_repartidor_id") REFERENCES "rutas"."ru_repartidor"("rep_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint (manual)
-- Invariantes que la aplicación ya valida, repetidas en la base como última defensa.
-- Prisma no modela CHECK: se declaran aquí y no generan diferencias en `migrate dev`.
ALTER TABLE "rutas"."ru_repartidor"
    ADD CONSTRAINT "ck_ru_repartidor_rep_lat" CHECK ("rep_lat" BETWEEN -90 AND 90),
    ADD CONSTRAINT "ck_ru_repartidor_rep_lng" CHECK ("rep_lng" BETWEEN -180 AND 180),
    ADD CONSTRAINT "ck_ru_repartidor_rep_capacidad_kg" CHECK ("rep_capacidad_kg" > 0);

ALTER TABLE "rutas"."ru_orden"
    ADD CONSTRAINT "ck_ru_orden_ord_lat" CHECK ("ord_lat" BETWEEN -90 AND 90),
    ADD CONSTRAINT "ck_ru_orden_ord_lng" CHECK ("ord_lng" BETWEEN -180 AND 180),
    ADD CONSTRAINT "ck_ru_orden_ord_peso_kg" CHECK ("ord_peso_kg" > 0),
    ADD CONSTRAINT "ck_ru_orden_ord_secuencia_ruta" CHECK ("ord_secuencia_ruta" IS NULL OR "ord_secuencia_ruta" >= 1),
    -- Una orden en cola no tiene repartidor; asignada, en ruta o entregada siempre lo tiene.
    ADD CONSTRAINT "ck_ru_orden_ord_repartidor_id" CHECK (("ord_estado" = 'PENDIENTE_ASIGNACION') = ("ord_repartidor_id" IS NULL));
