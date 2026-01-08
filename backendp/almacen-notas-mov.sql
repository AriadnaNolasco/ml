
---------------------------------------------------------
------- TABLA STOCK DE LOS PRODUCTOS EN ALMACENES -------
--Un producto puede existir en muchos almacenes.
--Un almacén tiene muchos productos.
--El stock se controla por cada par (almacen, producto).
---------------------------------------------------------
---------------------------------------------------------

CREATE TABLE almacen.stock_almacen (
  almacen_id INTEGER NOT NULL REFERENCES almacen.almacenes(id_alm),
  id_producto INTEGER NOT NULL REFERENCES almacen.productos(id_producto),
  stock DECIMAL(12,3) NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (almacen_id, id_producto)
);


----------------------------------------------------------------------
-------------------------------TABLA NOTAS----------------------------
----------------------------------------------------------------------

CREATE TABLE almacen.notas (
    id_nota SERIAL PRIMARY KEY,

    -- Qué tipo de nota es (NIH, NI0, NI2, NS1, NS2, NT1…)
    documento_interno_id INTEGER NOT NULL
        REFERENCES public.documentos(id_documento),
    numero VARCHAR(20) NOT NULL,

    -- Operación almacenaria (ingreso x compra, salida x venta, transf, ajuste…)
    cod_operacion INTEGER NOT NULL 
        REFERENCES public.cod_operacion(id_cod_operacion),

    -- Origen empresarial (OC, OF, OT, CLIENTE, PRODUCCION, etc.)
    origen VARCHAR(20) NOT NULL 
        CHECK (origen IN (
            'O/C','O/F','O/T','CLIENTE','PROVEEDOR',
            'PRODUCCION','AJUSTE','INTERNO','DEVOLUCION'
        )),

    -- ALMACENES
    almacen_salida INTEGER REFERENCES almacen.almacenes(id_alm),
    almacen_destino INTEGER REFERENCES almacen.almacenes(id_alm),

    orden_compra_id INTEGER REFERENCES compras.orden_compra(id),

    -- Cliente o proveedor (si corresponde)
    cliente_id INTEGER REFERENCES ventas.clientes(id_cliente),
    proveedor_id INTEGER REFERENCES compras.proveedores(id_prov),

    -- Documento comercial ligado (factura, boleta, NC, etc.)
    tipo_documento_id INTEGER REFERENCES public.tipo_documento(id_doc),
    serie VARCHAR(10),
    numero_documento VARCHAR(20),
    numero_guia VARCHAR(20),

    -- Estado de la nota
    estado VARCHAR(20) NOT NULL 
        CHECK (estado IN ('BORRADOR','CONFIRMADO','ANULADO'))
        DEFAULT 'BORRADOR',

    fecha_nota TIMESTAMP NOT NULL DEFAULT NOW(),
    observaciones TEXT,

    -- Auditoría básica
    fecha_registro TIMESTAMP DEFAULT NOW(),
    usuario_registro INTEGER REFERENCES public.usuarios(id),
    fecha_modificacion TIMESTAMP,
    usuario_modificacion INTEGER REFERENCES public.usuarios(id)
);

ALTER TABLE almacen.notas
ADD CONSTRAINT notas_documento_numero_unique
UNIQUE (documento_interno_id, numero);


CREATE TABLE almacen.notas_detalle (
    id SERIAL PRIMARY KEY,
    numitem INTEGER NOT NULL,
    id_nota INTEGER NOT NULL 
        REFERENCES almacen.notas(id_nota) ON DELETE CASCADE,
    orden_compra_detalle_id INTEGER REFERENCES compras.orden_compra_detalle(id),
    -- Almacén destino
    almacen_id INTEGER REFERENCES almacen.almacenes(id_alm),
    id_producto INTEGER NOT NULL 
        REFERENCES almacen.productos(id_producto),
    unidad_medida VARCHAR(20) NOT NULL,
    cantidad DECIMAL(12,3) NOT NULL,
    orden_fab_id INTEGER REFERENCES ventas.orden_fabricacion(id_ord),
    -- Datos opcionales del usuario
    lote VARCHAR(50),
    serie_producto VARCHAR(50),
    fecha_vencimiento DATE,
    comentario TEXT
);

CREATE INDEX idx_notas_detalle_orden_fab_id
ON almacen.notas_detalle (orden_fab_id);


---------------------------------------------------------------------------
------------------------------TABLA MOVIMIENTOS----------------------------
---------------------------------------------------------------------------

CREATE TABLE almacen.movimientos (
    id_movimiento SERIAL PRIMARY KEY,

    id_nota INTEGER REFERENCES almacen.notas(id_nota),

    -- Tipo de movimiento
    tipo_movimiento VARCHAR(15) NOT NULL 
        CHECK (tipo_movimiento IN ('INGRESO','SALIDA','AJUSTE','TRANSFERENCIA')),

    -- Operación (NI0, PT, DEV, MP, etc.)
    cod_operacion INTEGER NOT NULL 
        REFERENCES public.cod_operacion(id_cod_operacion),

    -- Origen empresarial (OC, OF, OT, CLIENTE, PRODUCCION, etc.)
    origen VARCHAR(20) NOT NULL 
        CHECK (origen IN (
            'O/C','O/F','O/T','CLIENTE','PROVEEDOR',
            'PRODUCCION','AJUSTE','INTERNO','DEVOLUCION'
        )),

    -- Transferencias internas
    transferencia_id INTEGER,

    -- Almacenes
    almacen_salida INTEGER REFERENCES almacen.almacenes(id_alm),
    almacen_destino INTEGER REFERENCES almacen.almacenes(id_alm),

    -- Validación real de negocio (optimización #8)
    CHECK (
        (tipo_movimiento = 'INGRESO' AND almacen_destino IS NOT NULL AND almacen_salida IS NULL)
        OR
        (tipo_movimiento = 'SALIDA' AND almacen_salida IS NOT NULL)
        OR
        (tipo_movimiento = 'AJUSTE')
        OR 
        (tipo_movimiento = 'TRANSFERENCIA' AND almacen_salida IS NOT NULL AND almacen_destino IS NOT NULL 
        AND almacen_salida <> almacen_destino)
    ),

    -- Cliente (si aplica)
    cliente_id INTEGER REFERENCES ventas.clientes(id_cliente),

    proveedor_id INTEGER REFERENCES compras.proveedores(id_prov),

    -- Documento comercial (como Factura, Boleta, Nota crédito...)
    tipo_documento_id INTEGER
        REFERENCES public.tipo_documento(id_doc),

    serie VARCHAR(10),
    numero_documento VARCHAR(20),
    numero_guia VARCHAR(20),

    -- Documento interno (NI0, NI1, NI2, NIR, etc.)
    documento_interno_id INTEGER NOT NULL
        REFERENCES public.documentos(id_documento),

    fecha_movimiento TIMESTAMP NOT NULL DEFAULT NOW(),
    observaciones TEXT,

    reversa_de_movimiento_id INTEGER REFERENCES almacen.movimientos(id_movimiento),
    es_reversa BOOLEAN NOT NULL DEFAULT FALSE;

    -- Auditoría
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_registro INTEGER REFERENCES public.usuarios(id),

    fecha_modificacion TIMESTAMP,
    usuario_modificacion INTEGER REFERENCES public.usuarios(id)
);

/*ALTER TABLE almacen.movimientos
ADD COLUMN reversa_de_movimiento_id INTEGER REFERENCES almacen.movimientos(id_movimiento),
ADD COLUMN es_reversa BOOLEAN NOT NULL DEFAULT FALSE;*/

CREATE INDEX idx_mov_reversa_de ON almacen.movimientos(reversa_de_movimiento_id);
CREATE INDEX idx_mov_es_reversa ON almacen.movimientos(es_reversa);

CREATE TABLE almacen.movimientos_detalle (
    id_detalle SERIAL PRIMARY KEY,

    id_movimiento INTEGER NOT NULL 
        REFERENCES almacen.movimientos(id_movimiento)
        ON DELETE CASCADE,

    almacen_id INTEGER NOT NULL REFERENCES almacen.almacenes(id_alm),

    id_producto INTEGER NOT NULL 
        REFERENCES almacen.productos(id_producto),

    unidad_medida VARCHAR(20) NOT NULL,
    cantidad DECIMAL(12, 3) NOT NULL,

    -- Optimización 1: control real de stock
    stock_actual DECIMAL(12, 3),
    stock_resultante DECIMAL(12, 3),

    stock_minimo DECIMAL(12, 3),
    stock_maximo DECIMAL(12, 3),

    -- Producción y contabilidad
    orden_fab_id INTEGER REFERENCES ventas.orden_fabricacion(id_ord),
    centro_costo_id INTEGER REFERENCES contabilidad.c_costo(id_c_costo),

    -- trazabilidad
    lote VARCHAR(50),
    serie_producto VARCHAR(50),
    fecha_vencimiento DATE,

    comentario TEXT
);

CREATE INDEX idx_movimientos_id_nota ON almacen.movimientos(id_nota);
CREATE INDEX idx_mov_det_mov ON almacen.movimientos_detalle(id_movimiento);
CREATE INDEX idx_mov_det_prod_alm ON almacen.movimientos_detalle(id_producto, almacen_id);

--una nota no tenga 2 salidas o 2 ingresos por error
CREATE UNIQUE INDEX IF NOT EXISTS uq_mov_nota_tipo
ON almacen.movimientos (id_nota, tipo_movimiento)
WHERE tipo_movimiento IN ('SALIDA','INGRESO');


CREATE SEQUENCE IF NOT EXISTS almacen.transferencia_seq;