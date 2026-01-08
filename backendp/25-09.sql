---------------------------------------------------------
-- MODULO DE TI GESTION DE USUARIO Y DOCUMENTOS SUNAT --
-- VERSION ACTUALIZADA CON TABLA DOCUMENTOS            --
---------------------------------------------------------

-- CREAR ESQUEMAS NECESARIOS
CREATE SCHEMA IF NOT EXISTS contabilidad;
CREATE SCHEMA IF NOT EXISTS compras;
CREATE SCHEMA IF NOT EXISTS almacen;
CREATE SCHEMA IF NOT EXISTS ventas;
CREATE SCHEMA IF NOT EXISTS rrhh;
CREATE SCHEMA IF NOT EXISTS mantenimiento;

-- TABLA DE AREAS
CREATE TABLE public.area (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Insertar áreas comunes
INSERT INTO public.area (nombre) VALUES
('Administración'),
('Contabilidad'),
('Recursos Humanos'),
('TI / Sistemas'),
('Operaciones'),
('Logística'),
('Compras'),
('Ventas'),
('Marketing'),
('Producción'),
('Calidad'),
('Mantenimiento'),
('Almacén'),
('Gerencia'),
('Planificación');

-- TABLA DE ROLES
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.roles (id, nombre) VALUES
(1, 'Superadmín'),
(2, 'Usuario');

-- TABLA DE USUARIOS
CREATE TABLE public.usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES public.roles(id),
    area_id INTEGER REFERENCES public.area(id),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_sesion TIMESTAMP
);

INSERT INTO public.usuarios (nombre_completo, username, password_hash, rol_id, area_id) VALUES
('Administrador Principal', 'superadmin', '$2b$12$YMnKSuaZMC5Szc6XMyYBVeYrplirPcD092FN3reu7hfIyTXphwXuu', 1, 4);

-- TABLA DE MODULOS
CREATE TABLE public.modulo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.modulo (nombre) VALUES
('Contabilidad'),
('Almacen'),
('Compras'),
('Ventas');


-- TABLA DE PAGINAS
CREATE TABLE public.paginas (
    id SERIAL PRIMARY KEY,
    ruta VARCHAR(100) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    modulo_id INTEGER NOT NULL REFERENCES public.modulo(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE PERMISOS
CREATE TABLE public.permisos (
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    pagina_id INTEGER NOT NULL REFERENCES public.paginas(id),
    PRIMARY KEY (usuario_id, pagina_id)
);

----------------------------------------------
--------TIPO DE DOCUMENTO DE IDENTIFICACION---
----------------------------------------------
CREATE TABLE public.tipo_documento_id (
    id SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas CHAR (8),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.tipo_documento_id (codigo, nombre, siglas) VALUES 
('0', 'OTROS', 'OTROS'),
('1', 'D. N. I.', 'D.N.I'),
('11', 'PARTIDA NACIMIENTO', 'P.NAC.'),
('2', 'LICENCIA DE CONDUCIR', 'Brevete'),
('3', 'REG ÚNICO TRIBUT', 'R.U.T.'),
('4', 'CARNET EXTRANJ.', 'C.EXT.'),
('5', 'N.I.T.', 'N.I.T.'),
('6', 'R. U. C.', 'R.U.C.'),
('7', 'PASAPORTE', 'PASAP.'),
('8', 'CEDULA', 'CEDULA'),
('9', 'SIN DOCUM.', 'S/DOC.');


-- TABLA DE PAISES
CREATE TABLE public.paises (
    id SERIAL PRIMARY KEY,
    codigo CHAR(4) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.paises (codigo, nombre) VALUES
('PER', 'Perú'),
('USA', 'Estados Unidos'),
('MEX', 'México'),
('COL', 'Colombia'),
('BRA', 'Brasil'),
('ARG', 'Argentina'),
('CHL', 'Chile'),
('ESP', 'España'),
('FRA', 'Francia'),
('DEU', 'Alemania'),
('GBR', 'Reino Unido'),
('ITA', 'Italia'),
('CHN', 'China'),
('JPN', 'Japón'),
('RUS', 'Rusia');

-- Tabla de departamentos/provincias/estados
CREATE TABLE public.departamentos (
    id SERIAL PRIMARY KEY,
    pais_id INTEGER REFERENCES public.paises(id),
    nombre VARCHAR(100) NOT NULL
);

-- Departamentos de Perú (Regiones)
INSERT INTO public.departamentos (pais_id, nombre) VALUES
(1, 'Amazonas'),
(1, 'Áncash'),
(1, 'Apurímac'),
(1, 'Arequipa'),
(1, 'Ayacucho'),
(1, 'Cajamarca'),
(1, 'Callao'),
(1, 'Cusco'),
(1, 'Huancavelica'),
(1, 'Huánuco'),
(1, 'Ica'),
(1, 'Junín'),
(1, 'La Libertad'),
(1, 'Lambayeque'),
(1, 'Lima'),
(1, 'Loreto'),
(1, 'Madre de Dios'),
(1, 'Moquegua'),
(1, 'Pasco'),
(1, 'Piura'),
(1, 'Puno'),
(1, 'San Martín'),
(1, 'Tacna'),
(1, 'Tumbes'),
(1, 'Ucayali');

-- Tabla de distritos/ciudades/municipios
CREATE TABLE public.distritos (
    id SERIAL PRIMARY KEY,
    departamento_id INTEGER REFERENCES public.departamentos(id),
    nombre VARCHAR(100) NOT NULL
);

-- Provincias de Lima (que serían los "distritos" en el ERP)
INSERT INTO public.distritos (departamento_id, nombre) VALUES
(15, 'Lima'),
(15, 'Ancón'),
(15, 'Ate'),
(15, 'Barranco'),
(15, 'Breña'),
(15, 'Carabayllo'),
(15, 'Chaclacayo'),
(15, 'Chorrillos'),
(15, 'Cieneguilla'),
(15, 'Comas'),
(15, 'El Agustino'),
(15, 'Independencia'),
(15, 'Jesús María'),
(15, 'La Molina'),
(15, 'La Victoria'),
(15, 'Lince'),
(15, 'Los Olivos'),
(15, 'Lurigancho'),
(15, 'Lurín'),
(15, 'Magdalena del Mar'),
(15, 'Miraflores'),
(15, 'Pachacámac'),
(15, 'Pucusana'),
(15, 'Pueblo Libre'),
(15, 'Puente Piedra'),
(15, 'Punta Hermosa'),
(15, 'Punta Negra'),
(15, 'Rímac'),
(15, 'San Bartolo'),
(15, 'San Borja'),
(15, 'San Isidro'),
(15, 'San Juan de Lurigancho'),
(15, 'San Juan de Miraflores'),
(15, 'San Luis'),
(15, 'San Martín de Porres'),
(15, 'San Miguel'),
(15, 'Santa Anita'),
(15, 'Santa María del Mar'),
(15, 'Santa Rosa'),
(15, 'Santiago de Surco'),
(15, 'Surquillo'),
(15, 'Villa El Salvador'),
(15, 'Villa María del Triunfo');

-- Provincias de Arequipa
INSERT INTO public.distritos (departamento_id, nombre) VALUES
(4, 'Arequipa'),
(4, 'Camaná'),
(4, 'Caravelí'),
(4, 'Castilla'),
(4, 'Caylloma'),
(4, 'Condesuyos'),
(4, 'Islay'),
(4, 'La Unión');

-- Provincias de Cusco
INSERT INTO public.distritos (departamento_id, nombre) VALUES
(8, 'Cusco'),
(8, 'Acomayo'),
(8, 'Anta'),
(8, 'Calca'),
(8, 'Canas'),
(8, 'Canchis'),
(8, 'Chumbivilcas'),
(8, 'Espinar'),
(8, 'La Convención'),
(8, 'Paruro'),
(8, 'Paucartambo'),
(8, 'Quispicanchi'),
(8, 'Urubamba');

-- Provincias de La Libertad
INSERT INTO public.distritos (departamento_id, nombre) VALUES
(13, 'Trujillo'),
(13, 'Ascope'),
(13, 'Bolívar'),
(13, 'Chepén'),
(13, 'Gran Chimú'),
(13, 'Julcán'),
(13, 'Otuzco'),
(13, 'Pacasmayo'),
(13, 'Pataz'),
(13, 'Sánchez Carrión'),
(13, 'Santiago de Chuco'),
(13, 'Virú');

-- Provincias de Piura
INSERT INTO public.distritos (departamento_id, nombre) VALUES
(20, 'Piura'),
(20, 'Ayabaca'),
(20, 'Huancabamba'),
(20, 'Morropón'),
(20, 'Paita'),
(20, 'Sechura'),
(20, 'Sullana'),
(20, 'Talara');

 
------------------------------------------
------ ENTIDADES FINANCIERAS SUNAT -------
------------------------------------------

CREATE TABLE public.bancos (
    id_bancos SERIAL PRIMARY KEY,
    codigo VARCHAR(4) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    siglas VARCHAR(30) NOT NULL,
    direccion VARCHAR(200),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.bancos (codigo, nombre, siglas, direccion) VALUES
('002', 'BCO. CREDITO DEL PERU', 'BcoCre', ''),
('003', 'BCO. INTERBANK', 'BcoInt', ''),
('004', 'CAJA TRUJILLO', 'CAJATR', ''),
('005', 'CAJA SANTA', 'CAJSAN', ''),
('006', 'BCO. SCOTIABANK PERU', 'BcoSct', ''),
('007', 'BCO. CONTINENTAL', 'BcoCon', ''),
('008', 'BCO. BANBIF', 'BANBIF', ''),
('009', 'BCO. FALABELLA S.A', 'BcoFal', ''),
('010', 'BANCO DE LA NACION', 'BacNac', ''),
('100', 'WELL FARGO BANK', 'ECUADO', '11 PENN PLAZA NEW YORK 1001'),
('101', 'CLINTON NATIONAL BANK', 'CNBANK', 'PO BOX 235 6TH AVENUE SOUTH CLINTON, IA 52733-1510'),
('102', 'PNC BANK', 'PNCBAN', '249 5 AVE. 1 PNC PLACE PITTSBURGH PA 15222'),
('103', 'HSBC BANK BRASIL', 'HSBC', 'AGENCY 0224'),
('104', 'COMERICA BANK TEXAS', 'CBTEXA', 'DALLAS, TX 75265-0282'),
('105', 'JP MORGAN CHASE BANK', 'JP MOR', 'Chicago, IL 60673-3944'),
('106', 'BANK OF AMERICA N.A.', 'BANK A', '121 West Trade Street - Charlotte, NC 228255 U.S.A.'),
('107', 'PNC BANK', 'PNC', 'DAYTON OH 45402'),
('108', 'WELLS FARGO BANK', 'WELLS', 'ITASCA, IL 60143'),
('109', 'BANK OF AMERICA', 'BOA', '6901 SW 117 AVE. MIAMI, FLORIDA 33183'),
('110', 'YADKIN BANK', 'YADKIN', '325 E. Front Street Statesville, NC 28677'),
('111', 'THE INDUSTRIAL AND C', '', 'NO.667 NORTH SONGWEI RD. SONGJIANG 201613 SHANGHAI CHINA'),
('112', 'IBC BANK', 'IBC', '1200 San Bernardo Ave Laredo, TX 78042-1359'),
('113', 'BBVA COLOMBIA', 'BBVACO', 'CALLE 10 A 40-78 BOGOTA'),
('114', 'CHANG HWA COMML BANK', 'CHANG', 'KAHOUSING TAIWAN'),
('115', 'BANK OF MONTREAL', 'BOFM', '1 First Canadian Place, 21st Floor Toronto, Ontario M5X 1A1');

-------------------------------------------------------
------ TIPOS DE EXISTENCIAS / CATEGORIA SUNAT ----------
---------------------------------------------------------

CREATE TABLE public.tipo_existencia (
    id_exist SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(80) UNIQUE NOT NULL,
    siglas VARCHAR(10),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.tipo_existencia (codigo, nombre, siglas) VALUES
(001, 'MERCADERÍA', 'MER'),
(002, 'PRODUCTOS TERMINADOS', 'PROTER'),
(003, 'MATERIAS PRIMAS Y AUXILIARES - MATERIALES', 'MATPRI'),
(004, 'ENVASES Y EMBALAJES', 'ENVEMB'),
(005, 'SUMINISTROS DIVERSOS', 'SUMDIV'),
(006, 'ACTIVOS', 'ACTIVO'),
(099, 'OTROS', 'OTROS');

------ CATEGORIA TIENE RELACION CON TIPO DE EXITENCIA SUNAT---
CREATE TABLE public.categoria (
    id_categoria SERIAL PRIMARY KEY,
    codigo CHAR(2) UNIQUE NOT NULL,
    nombre VARCHAR(35) NOT NULL,
    siglas VARCHAR(6) NOT NULL,
    id_exist INTEGER REFERENCES public.tipo_existencia(id_exist),
    ind_venta VARCHAR(20) NOT NULL DEFAULT 'NO VENDIBLE' CHECK (ind_venta IN ('NO VENDIBLE', 'SE VENDE', 'SERVICIOS')),
    ind_critico VARCHAR(20) NOT NULL DEFAULT 'NO CRITICO' CHECK (ind_critico IN ('NO CRITICO', 'CRITICO')),
    ind_importacion VARCHAR(20) NOT NULL DEFAULT 'NO SE IMPORTA' CHECK (ind_importacion IN ('NO SE IMPORTA', 'SE IMPORTA')),
    ind_almac_x_compra VARCHAR(20) NOT NULL DEFAULT 'NO ING. ALMACEN' CHECK (ind_almac_x_compra IN ('NO ING. ALMACEN', 'SI ING. ALMACEN'))
);

INSERT INTO public.categoria
(codigo, nombre, siglas, id_exist, ind_venta, ind_critico, ind_importacion, ind_almac_x_compra)
VALUES
('A', 'ACTIVO EN ALMACEN', 'ACTALM', 6, 'NO VENDIBLE', 'NO CRITICO', 'NO SE IMPORTA', 'SI ING. ALMACEN'), 
('S', 'SERVICIO', 'SERVIC', 7, 'SERVICIOS', 'NO CRITICO', 'NO SE IMPORTA', 'NO ING. ALMACEN'),            
('T', 'PRODUCTO TERMINADO', 'PRDTER', 2, 'SE VENDE', 'NO CRITICO', 'NO SE IMPORTA', 'NO ING. ALMACEN'),   
('V', 'CONSUMIBLES / VARIOS', 'VARIOS', 7, 'NO VENDIBLE', 'NO CRITICO', 'NO SE IMPORTA', 'NO ING. ALMACEN'), 
('M', 'MERCADERIAS', 'MER', 1, 'SE VENDE', 'CRITICO', 'SE IMPORTA', 'SI ING. ALMACEN'),                  
('P', 'MAT.PRIMA SUM.EMBAL.', 'MATPRI', 3, 'SE VENDE', 'CRITICO', 'SE IMPORTA', 'SI ING. ALMACEN'),     
('R', 'RPTOS. HERRAMIENTAS', 'RepHer', 5, 'NO VENDIBLE', 'CRITICO', 'SE IMPORTA', 'SI ING. ALMACEN'); 

-------------------------------------------
------ UNIDADES DE MEDIDA SUNAT -----------
-------------------------------------------

CREATE TABLE public.unidades_medida_sunat (
    id_unidad SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    siglas VARCHAR(10)
);

INSERT INTO public.unidades_medida_sunat (codigo, nombre, siglas) VALUES
('4A', 'BOBINAS', 'Bobina'),
('BE', 'FARDO', 'Fardo'),
('BG', 'BOLSA', 'Bolsa'),
('BJ', 'BALDE', 'Balde'),
('BLL', 'BARRILES', 'Barriles'),
('BO', 'BOTELLAS', 'Botellas'),
('BX', 'CAJA', 'Caja'),
('C62', 'PIEZAS', 'Piezas'),
('CA', 'LATAS', 'Latas'),
('CEN', 'CIENTO DE UNIDADES', 'CienUnid'),
('CJ', 'CONOS', 'Conos'),
('CMK', 'CENTIMETRO CUADRADO', 'CentCuad'),
('CMQ', 'CENTIMETRO CUBICO', 'CentCub'),
('CMT', 'CENTIMETRO LINEAL', 'CentLin'),
('CT', 'CARTONES', 'Carton'),
('CY', 'CILINDRO', 'Cilindro'),
('DR', 'TAMBOR', 'Tambor'),
('DZN', 'DOCENA', 'Docena'),
('DZP', 'DOCENA POR 10**6', 'Docx10'),
('FOT', 'PIES', 'Pies'),
('FTK', 'PIES CUADRADOS', 'PieCua'),
('FTQ', 'PIES CUBICOS', 'PieCub'),
('GLI', 'GALONINGLS(4,545956L)', 'Gallng'),
('GLL', 'US GALON (3,7843 L)', 'UsGal'),
('GRM', 'GRAMO', 'Gramo'),
('GRO', 'GRUESA', 'Gruesa'),
('HLT', 'HECTOLITRO', 'Hectolitro'),
('INH', 'PULGADAS', 'Pulgadas'),
('KGM', 'KILOGRAMO', 'Kgm'),
('KT', 'KIT', 'Kit'),
('KTM', 'KILOMETRO', 'Ktm'),
('KWH', 'KILOVATIO HORA', 'KilHor'),
('LBR', 'LIBRAS', 'Libras'),
('LEF', 'HOJA', 'Hoja'),
('LTN', 'TONELADA LARGA', 'TonLarga'),
('LTR', 'LITRO', 'Litro'),
('MGM', 'MILIGRAMOS', 'Mgm'),
('MIL', 'MILLARES', 'Mill'),
('MLT', 'MILILITRO', 'Mlt'),
('MMK', 'MILIMETRO CUADRADO', 'MntCuad'),
('MMO', 'MILIMETRO CUBICO', 'MntCub'),
('MMT', 'MILIMETRO', 'Mmt'),
('MTK', 'METRO CUADRADO', 'MetCua'),
('MTQ', 'METRO CUBICO', 'MetCub'),
('MTR', 'METRO', 'Metro'),
('MWH', 'MEGAWATT HORA', 'MegHor'),
('NIU', 'UNIDAD (BIENES)', 'UnidBie'),
('ONZ', 'ONZAS', 'Onzas'),
('PF', 'PALETAS', 'Paletas'),
('PG', 'PLACAS', 'Placas'),
('PK', 'PAQUETE', 'Paquete'),
('PR', 'PAR', 'Par'),
('RM', 'RESMA', 'Resma'),
('SET', 'JUEGO', 'Juego'),
('ST', 'PLIEGO', 'Pliego'),
('STN', 'TONELADA CORTA', 'TocCort'),
('TNE', 'TONELADAS', 'Tne'),
('TU', 'TUBOS', 'Tu'),
('UM', 'MILLON DE UNIDADES', 'MillUnid'),
('YDK', 'YARDA CUADRADA', 'YrdCua');

CREATE TABLE public.unidades_medida (
    id_unidades SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(25) UNIQUE NOT NULL,
    siglas VARCHAR(8) NOT NULL,
    cod_sunat INTEGER REFERENCES public.unidades_medida_sunat(id_unidad),
    estado BOOLEAN DEFAULT TRUE
);


INSERT INTO public.unidades_medida (codigo, nombre, siglas, cod_sunat) VALUES
('BAL', 'BALDE', 'BJ', 4),
('BOT', 'BOTELLA', 'BOTELL', 6),
('CAJ', 'CAJAS', 'CAJAS', 7),
('CIL', 'CILINDRO', 'CY', 16),
('DOC', 'DOCENA', 'DOCENA', 18),
('GAL', 'GALONES (3.7483 L)', 'GL.', 24),
('KG.', 'KILOS', 'KG.', 29),
('LT.', 'LITROS', 'LITROS', 36),
('MLL', 'MILLARES', 'MLL', 38),
('MT.', 'METROS', 'MT.', 45),
('MT3', 'METROS CUBICOS', 'MT3', 41),
('PAR', 'PARES', 'PARES', 52),
('PQT', 'PAQUETE', 'PAQUET', 51),
('ROL', 'ROLLOS', 'ROLLO', 51),
('UND', 'UNIDADES', 'UND', 47);

-------------------------------------------
------- IGV ------------
-------------------------------------------

CREATE TABLE public.igv (
    id SERIAL PRIMARY KEY,
    porcentaje DECIMAL(5,2) NOT NULL,
    descripcion VARCHAR(50) NOT NULL
);

-- Insertar los valores de IGV
INSERT INTO public.igv (porcentaje, descripcion) VALUES
(18.00, 'IGV 18%'),
(10.00, 'IGV 10%'),
(0.00, 'Sin IGV');

-------------------------------------------
------- CODIGO DE ADUANA SUNAT ------------
-------------------------------------------

CREATE TABLE public.cod_aduana (
    id_aduana SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    siglas VARCHAR(10),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.cod_aduana (codigo, nombre, siglas) VALUES
(019, 'TUMBES', 'TUMBES'),
(028, 'TALARA', 'TALARA'),
(046, 'PAITA', 'PAITA'),
(055, 'CHICLAYO', 'CHICLY'),
(082, 'SALAVERRY', 'SALVER'),
(091, 'CHIMBOTE', 'CHIMBT'),
(118, 'MARTIMA DEL CALLAO', 'M_CALL'),
(127, 'PISCO', 'PISCO'),
(145, 'MOLLENDO MATARANI', 'MOLMAT'),
(154, 'AREQUIPA', 'AREQPA'),
(163, 'ILO', 'ILO'),
(172, 'TACNA', 'TACNA'),
(181, 'PUNO', 'PUNO'),
(190, 'CUZCO', 'CUZCO'),
(217, 'PUCALLPA', 'PUCALL'),
(226, 'IQUITOS', 'IQUITO'),
(235, 'AREA DEL CALLAO', 'A_CALL'),
(244, 'POSTAL DE LIMA', 'P_LIMA'),
(262, 'DESAGUADERO', 'DESAGU'),
(271, 'TARAPOTO', 'TARAPO'),
(280, 'PUERTO MALDOMADO', 'PTOMAL'),
(299, 'LA TINA', 'LATINA'),
(884, 'DEPEND.FERROV.TACNA', 'DFETAC'),
(893, 'DEPEND. POSTAL TACNA', 'DPOTAC'),
(910, 'DEPEND. POSTAL AREO.', 'DPOAOP'),
(929, 'COMPL.FRONT.SR TACNA', 'CFSRTA'),
(938, 'TERM.TERR.TACNA', 'TTETAC'),
(947, 'AEROPUERTO DE TACNA', 'AERTAC'),
(956, 'CETICOS TACNA', 'CETTAC'),
(965, 'DEP. POST. SALAVERRY', 'DPOSLV');

------------------------------------------
-------- TIPO DE DOCUMENTO SUNAT ---------
------------------------------------------

CREATE TABLE public.tipo_documento (
    id_doc SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    siglas VARCHAR(10) NOT NULL,
    doc CHAR(8) CHECK (doc IN ('SUNAT', 'ERP WEB')),
    incluye_igv VARCHAR(22) CHECK (incluye_igv IN ('NO CONSIDERA', 'SI Y VERIFICA IGV', 'SI Y NO VERIFICA IGV')),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.tipo_documento (codigo, nombre, siglas, doc, incluye_igv) VALUES
(000, 'O T R O S', 'OTROS', 'SUNAT', 'NO CONSIDERA'),
(001, 'Facturas', 'FACTUR', 'SUNAT', 'SI Y VERIFICA IGV'),
(002, 'Recibo x Honorarios', 'Reclion', 'SUNAT', 'NO CONSIDERA'),
(003, 'Boleta de Venta', 'Boleta', 'SUNAT', 'SI Y VERIFICA IGV'),
(004, 'Liquidacion Compra', 'LigCom', 'SUNAT', 'NO CONSIDERA'),
(005, 'Boleto de Aviacion', 'BolAvi', 'SUNAT', 'NO CONSIDERA'),
(006, 'Carta de Porte Aereo', 'Carta', 'SUNAT', 'NO CONSIDERA'),
(007, 'Nota de Credito', 'N / C', 'SUNAT', 'SI Y VERIFICA IGV'),
(008, 'Nota de Debito', 'N / D', 'SUNAT', 'SI Y VERIFICA IGV'),
(009, 'Guia Remision Remit.', 'GuiRem', 'SUNAT', 'NO CONSIDERA'),
(010, 'Recibo x Arrendamto', 'RecArr', 'SUNAT', 'NO CONSIDERA'),
(011, 'Poliza Bolsa Valores', 'Plz.BI', 'SUNAT', 'NO CONSIDERA'),
(012, 'Ticket Maq.Registrad', 'Ticket', 'SUNAT', 'NO CONSIDERA'),
(013, 'Docum.Emitido Bancos', 'DocBco', 'SUNAT', 'NO CONSIDERA'),
(014, 'Rec. Servic.Publicos', 'RecSpu', 'SUNAT', 'NO CONSIDERA'),
(015, 'Boleto Transp. Urban', 'BolUrb', 'SUNAT', 'NO CONSIDERA'),
(016, 'Boleto InterProvinc.', 'IBolin', 'SUNAT', 'NO CONSIDERA'),
(017, 'Doc Iglesia Catolica', 'DocIgI', 'SUNAT', 'NO CONSIDERA'),
(018, 'Doc. Emitido AFP', 'DocAfp', 'SUNAT', 'NO CONSIDERA'),
(019, 'Bol. Espect. Publico', 'BolEsp', 'SUNAT', 'NO CONSIDERA'),
(020, 'Comprob. Retencion', 'ComRet', 'SUNAT', 'NO CONSIDERA'),
(021, 'Conocimiento Embarqu', 'ConEmb', 'SUNAT', 'NO CONSIDERA'),
(022, 'Compb. Oper. No Habi', 'ComOnh', 'SUNAT', 'NO CONSIDERA'),
(023, 'Pol.Adj.Rem.bienes', 'Pol.Aj', 'SUNAT', 'NO CONSIDERA'),
(024, 'Certific. Peru Petro', 'CerPet', 'SUNAT', 'NO CONSIDERA'),
(025, 'Doc. de Atribucion', 'DocAtt', 'SUNAT', 'NO CONSIDERA'),
(026, 'Rec de Agua Agricola', 'Recl120', 'SUNAT', 'NO CONSIDERA'),
(027, 'SCTR', 'SCTR', 'SUNAT', 'NO CONSIDERA'),
(028, 'Tarifa Areopuerto', 'TUA', 'SUNAT', 'NO CONSIDERA'),
(029, 'Doc. Emit. COFOPRI', 'COFOPR', 'SUNAT', 'NO CONSIDERA'),
(030, 'Doc.Tarieta Credito', 'DocTcr', 'SUNAT', 'NO CONSIDERA'),
(031, 'Guia Remion Transpo', 'GuITm', 'SUNAT', 'NO CONSIDERA'),
(032, 'Doc Gas Natural', 'DocGas', 'SUNAT', 'NO CONSIDERA'),
(034, 'Doc. del Operador', 'DocOps', 'SUNAT', 'NO CONSIDERA'),
(035, 'Doc del Participe', 'DocPar', 'SUNAT', 'NO CONSIDERA'),
(036, 'Rec.Dist.Gas Natural', 'RecGas', 'SUNAT', 'NO CONSIDERA'),
(037, 'Doc.Revision Tecnica', 'DocRev', 'SUNAT', 'NO CONSIDERA'),
(040, 'Comprob d Percepcion', 'ConDep', 'SUNAT', 'NO CONSIDERA'),
(046, 'FORMULAR DECLARACION', 'FORMUL', 'SUNAT', 'SI Y VERIFICA IGV'),
(050, 'Poliza Importacion', 'DUA', 'SUNAT', 'SI Y NO VERIFICA IGV'),
(051, 'Pol.o Decl.Fracciona', 'Pol.Fr', 'SUNAT', 'SI Y NO VERIFICA IGV'),
(052, 'Declaracion Simplif.', 'DecSim', 'SUNAT', 'SI Y NO VERIFICA IGV'),
(053, 'Decl.Mensajeria Cour', 'DecCou', 'SUNAT', 'SI Y NO VERIFICA IGV'),
(054, 'Liquidacion Cobranza', 'LiqCob', 'SUNAT', 'NO CONSIDERA'),
(055, 'Certif. Persepcion', 'CerPer', 'SUNAT', 'NO CONSIDERA'),
(060, 'Recibo de Egresos', 'RecEgr', 'SUNAT', 'NO CONSIDERA'),
(061, 'Recibo de Ingresos', 'Reclng', 'SUNAT', 'NO CONSIDERA'),
(062, 'Liq. Fonfo Fijo', 'LiqFon', 'SUNAT', 'NO CONSIDERA'),
(063, 'Cheques', 'Cheque', 'SUNAT', 'NO CONSIDERA'),
(064, 'Liq. Rendir Cuentas', 'LiqRen', 'SUNAT', 'NO CONSIDERA'),
(065, 'Liq. Gastos de Viaje', 'LiqVia', 'SUNAT', 'NO CONSIDERA'),
(087, 'Nota Credito Especial', 'NCespe', 'SUNAT', 'NO CONSIDERA'),
(088, 'Nota Debito Especial', 'NDespe', 'SUNAT', 'NO CONSIDERA'),
(091, 'Comprb.No Domicial.', 'CpbNdo', 'SUNAT', 'NO CONSIDERA'),
(096, 'Exceso Credito Fisc.', 'ExcCre', 'SUNAT', 'NO CONSIDERA'),
(097, 'N/C no Domiciliados', 'NCuDom', 'SUNAT', 'NO CONSIDERA'),
(098, 'N/D no Domiciliados', 'NDnDom', 'SUNAT', 'NO CONSIDERA'),
(099, 'Otros Consol. BolVta', 'ConBvt', 'SUNAT', 'NO CONSIDERA'),
(901, 'Cotizaciones', 'Cotzc', 'ERP WEB', 'NO CONSIDERA'),
(902, 'Valorizacion', 'Valorz', 'ERP WEB', 'NO CONSIDERA'),
(903, 'Pedidos de Clientes', 'PedCli', 'ERP WEB', 'NO CONSIDERA'),
(904, 'Ordenes de Fabricac.', 'OrdFab', 'ERP WEB', 'NO CONSIDERA'),
(910, 'Ingreso x Produccion', 'IngPro', 'ERP WEB', 'NO CONSIDERA'),
(911, 'Notas de Ingreso Alm', 'Noting', 'ERP WEB', 'NO CONSIDERA'),
(912, 'Notas de Salida Alm.', 'NotSal', 'ERP WEB', 'NO CONSIDERA'),
(913, 'N. Ing. Compra Local', 'NICloc', 'ERP WEB', 'NO CONSIDERA'),
(914, 'N. Ing. Compra Exter', 'NICext', 'ERP WEB', 'NO CONSIDERA'),
(920, 'Reg. Compra LOCAL', 'RegLoc', 'ERP WEB', 'NO CONSIDERA'),
(921, 'Orden Compra LOCAL', 'OrdCom', 'ERP WEB', 'NO CONSIDERA'),
(930, 'Reg. Compra EXTER', 'RegExt', 'ERP WEB', 'NO CONSIDERA'),
(931, 'Ped. Compra EXTER.', 'PedExt', 'ERP WEB', 'NO CONSIDERA'),
(932, 'Ped. Confirmado EXT.', 'PedCon', 'ERP WEB', 'NO CONSIDERA'),
(940, 'Prestamos Personal', 'PrePer', 'ERP WEB', 'NO CONSIDERA'),
(950, 'Letras de Cambio', 'Letras', 'ERP WEB', 'NO CONSIDERA'),
(951, 'Pla. Factura x Letra', 'FacLet', 'ERP WEB', 'NO CONSIDERA'),
(952, 'Pla. Envío Letra Bco', 'LetBco', 'ERP WEB', 'NO CONSIDERA'),
(953, 'Pla. Pago Letra Bco', 'PagLet', 'ERP WEB', 'NO CONSIDERA'),
(954, 'Pla. Renovac.Letras', 'RenLet', 'ERP WEB', 'NO CONSIDERA'),
(960, 'Activos Fijos', 'ActFij', 'ERP WEB', 'NO CONSIDERA'),
(961, 'Control Memos', 'Memos', 'ERP WEB', 'NO CONSIDERA');

---------------------------------------------
------- TIPOS DE OPERACIONES SUNAT ----------
---------------------------------------------

CREATE TABLE public.tipo_operaciones (
    id_operacion SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(30) UNIQUE NOT NULL,
    siglas VARCHAR(14) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.tipo_operaciones (codigo, nombre, siglas) VALUES
(001, 'VENTA NACIONAL', 'Venta'),
(002, 'COMPRA NACIONAL', 'Compra'),
(003, 'CONSIGNACION RECIB.', 'ConRec'),
(004, 'CONSIGNACION ENTRE.', 'ConEnt'),
(005, 'DEVOLUCION RECIBIDA', 'DevRec'),
(006, 'DEVOLUCION ENTREGADA', 'DevEnt'),
(007, 'BONIFICACIÓN', 'bonif.'),
(008, 'PREMIOS', 'Premio'),
(009, 'DONACION', 'Donac.'),
(010, 'SALIDA A PRODUCCION', 'Salpro'),
(011, 'TRANSF.ENTRE ALMACEN', 'TrnAlm'),
(012, 'RETIRO', 'Retiro'),
(013, 'MERMAS', 'Mermas'),
(014, 'DESMEDROS', 'Desmed'),
(015, 'DESTRUCCION', 'Destrc'),
(016, 'SALDO INICIAL', 'Salini'),
(017, 'Ingresos por Sobrant', 'expor.'),
(018, 'IMPORTACION', 'impor.'),
(019, 'ENTRADA D PRODUCCION', 'EntProd'),
(020, 'ENTRADA X DEVOL.PROD', 'EntDevProd'),
(021, 'ENTRA. X TRANSFALM.', 'EntTransAlm'),
(022, 'ENTRA. X IDENT:ERRON', 'EntIdentErro'),
(023, 'SALIDA X IDENT:ERRON', 'SalIdentErro'),
(024, 'ENTRA. X DEVOL.CLIEN', 'EntDevolCile'),
(025, 'SALIDA X DEVOL.PROVE', 'SalDevProv'),
(026, 'ENTRA.SERV.PRODUCC.', 'EntServProd'),
(027, 'SALIDA X SERV.PRODUC', 'SalServProd'),
(028, 'AJUSTE X DIF.INVENT.', 'AjuDiffnv'),
(029, 'ENTRA.BIENES PRESTAM', 'EntBiePrest'),
(030, 'SALIDA BIENESPRESTAM', 'SalBiePrest'),
(031, 'ENTRA.BIENES CUSTODI', 'EntBieCust'),
(032, 'SALIDA BIENESCUSTODI', 'SalBieCust'),
(033, 'MUESTRAS MEDICAS', 'Muemed'),
(034, 'PUBLICIDAD', 'Publi.'),
(035, 'GASTOS DE REPRESENTA', 'GasRepr'),
(036, 'RETIRO ENTREGATRABAJ', 'RetEntTrab'),
(037, 'RETIRO X CONVE.COLEC', 'RetConColec'),
(038, 'RETI.XSUSTI.BIENSINI', 'RetSustBieSini'),
(091, 'OTROS 1', 'Otros1'),
(092, 'OTROS 2', 'Otros2'),
(093, 'OTROS 3', 'Otros3'),
(094, 'OTROS 4', 'Otros4'),
(095, 'OTROS 5', 'Otros5'),
(096, 'OTROS 6', 'Otros6'),
(097, 'OTROS 7', 'Otros7'),
(098, 'OTROS 8', 'Otros8'),
(099, 'OTROS', 'Otros'),
(551, 'SALIDA DE REPUESTOS', 'S.REP');

--SE PUEDE EJECUTAR
---------------------------------------------
------ MEDIO DE PAGO SUNAT -------------------
----------------------------------------------

CREATE TABLE public.med_pago (
    id_mdpago SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas VARCHAR(15) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.med_pago (codigo, nombre, siglas) VALUES
(001, 'DEPOSITO EN CUENTA', 'DEPCTA'),
(002, 'GIRO BANCARIO', 'GIRO'),
(003, 'TRANSFERENCIA FONDOS', 'TRNFON'),
(004, 'ORDEN DE PAGO', 'ORDPAG'),
(005, 'TARJETA DEBITO', 'TARDEB'),
(006, 'TARJETA CREDITO', 'TARCRE'),
(007, 'CHEQUES NO NEG. INTR', 'CHENNE'),
(008, 'EFECTIVO SIN OBLIG.', 'EFE SOB'),
(009, 'EFECTIVO CON OBLIG.', 'EFE Cob'),
(010, 'M.PAGO COMER. EXTER.', 'MPACEX'),
(011, 'LETRAS DE CAMBIO', 'LETCAM'),
(101, 'TRANSF. COMER.EXTER.', 'TRNCEX'),
(102, 'CHEQUES COMER.EXTER.', 'CHECEX'),
(103, 'O.PAGO SIMPLE C.EXT.', 'OPACEX'),
(104, 'O.PAGO DOCUM. C.EXT.', 'OPADEX'),
(105, 'REMESA SIMPLE C.EXT.', 'RSICEX'),
(106, 'REMESA DOCUM. C.EXT.', 'RDOCEX'),
(107, 'C.CRED.SIMPLE C.EXT.', 'CCSCEX'),
(108, 'C.CRED.DOCUM. C.EXT.', 'CCDCEX'),
(109, 'CARGO BANCARIO', 'CARBAN'),
(999, 'OTROS MEDIOS DE PAGO', 'OTRMPA');

----------------------------------------------
------ PAISES TRIBUTARIOS SUNAT --------------
----------------------------------------------

CREATE TABLE public.paises_trib (
    id_pais_trib SERIAL PRIMARY KEY,
    codigo CHAR(4) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas CHAR(8) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.paises_trib (codigo, nombre, siglas) VALUES
(9001, 'BOUVET ISLAND', 'BOUVET'),
(9002, 'COTE DIVOIRE', 'COTEDI'),
(9003, 'FALKLAND ISLANDS (MA', 'FALKLA'),
(9004, 'FRANCE, METROPOLITAN', 'FRANCE'),
(9005, 'FRENCH SOUTHERN TERR', 'FRENCH'),
(9006, 'HEARD AND MC DONALD', 'HEARDA'),
(9007, 'MAYOTTE', 'MAYOTT'),
(9008, 'SOUTH GEORGIA AND TH', 'SOUTHG'),
(9009, 'SVALBARD AND JAN MAY', 'SVALBA'),
(9010, 'UNITED STATES MINOR', 'UNITED'),
(9011, 'OTROS PAISES O LUGAR', 'OTROSP'),
(9013, 'AFGANISTAN', 'AFGANI'),
(9017, 'ALBANIA', 'ALBANI'),
(9019, 'ALDERNEY', 'ALDERN'),
(9023, 'ALEMANIA', 'ALEMAN'),
(9026, 'ARMENIA', 'ARMENI'),
(9027, 'ARUBA', 'ARUBA'),
(9028, 'ASCENCIFN', 'ASCENC'),
(9029, 'BOSNIA-HERZEGOVINA', 'BOSNIA'),
(9031, 'BURKINA FASO', 'BURKIN'),
(9037, 'ANDORRA', 'ANDORR'),
(9040, 'ANGOLA', 'ANGOLA'),
(9041, 'ANGUILLA', 'ANGUIL'),
(9043, 'ANTIGUA Y BARBUDA', 'ANTIGU'),
(9047, 'ANTILLAS HOLANDESAS', 'ANTILL'),
(9053, 'ARABIA SAUDITA', 'ARABIA'),
(9059, 'ARGELLA', 'ARGELL'),
(9063, 'ARGENTINA', 'ARGENT'),
(9069, 'AUSTRALIA', 'AUSTRA'),
(9072, 'AUSTRIA', 'AUSTRI'),
(9074, 'AZERBAIJAN', 'AZERBA'),
(9077, 'BAHAMAS', 'BAHAMA'),
(9080, 'BAHREN', 'BAHREI'),
(9081, 'BANGLADESH', 'BANGLA'),
(9083, 'BARBADOS', 'BARBAD'),
(9087, 'BELGICA', 'BELGIC'),
(9088, 'BELICE', 'BELICE'),
(9090, 'BERMUDAS', 'BERMUD'),
(9091, 'BELARUS', 'BELARU'),
(9093, 'MYANMAR', 'MYANMA'),
(9097, 'BOLIVIA', 'BOLIVI'),
(9101, 'BOTSWANA', 'BOTSWA'),
(9105, 'BRASIL', 'BRASIL'),
(9108, 'BRUNEI DARUSSALAM', 'BRUNEI'),
(9111, 'BULGARIA', 'BULGAR'),
(9115, 'BURUNDI', 'BURUND'),
(9119, 'BUTAN', 'BUTAN'),
(9127, 'CABO VERDE', 'Cabove'),
(9137, 'CAIMAN,ISLAS', 'CAIMAN'),
(9141, 'CAMBOYA', 'CAMBOY'),
(9145, 'CAMERUN,REPUBLICA UN', 'CAMERU'),
(9147, 'CAMPIONE DITALIA', 'CAMPIO'),
(9149, 'CANADA', 'CANADA'),
(9155, 'Canal (NORMANDAS), I', 'CANALN'),
(9157, 'CANTON Y ENDERBURRY', 'CANTON'),
(9159, 'SANTA SEDE', 'SANTAS'),
(9165, 'COCOS (KEELING),ISLA', 'COCOSK'),
(9169, 'COLOMBIA', 'COLOMB'),
(9173, 'COMORAS', 'COMORA'),
(9177, 'CONGO', 'CONGO'),
(9183, 'COOK, ISLAS', 'COOKIS'),
(9187, 'COREA (NORTE), REPUB', 'COREAN'),
(9190, 'COREA (SUR), REPUBLI', 'COREAS'),
(9193, 'COSTA DE MARFIL', 'COSTAD'),
(9196, 'COSTA RICA', 'COSTAR'),
(9198, 'CROACIA', 'CROACI'),
(9199, 'CUBA', 'CUBA'),
(9203, 'CHAD', 'CHAD'),
(9207, 'CHECOSLOVAQUIA', 'CHECOS'),
(9211, 'CHILE', 'CHILE'),
(9215, 'CHINA', 'CHINA'),
(9218, 'TAJWAN (FORMOSA)', 'TAJWAN'),
(9221, 'CHIPRE', 'CHIPRE'),
(9229, 'BENIN', 'BENIN'),
(9232, 'DINAMARCA', 'DINAMA'),
(9235, 'DOMINICA', 'DOMINI'),
(9239, 'ECUADOR', 'ECUADO'),
(9240, 'EGIPTO', 'EGIPTO');

-----------------------------------------------
------ CONVENIOS EVITAR DOBLE TRIBUTAC SUNAT --
-----------------------------------------------

CREATE TABLE public.cedt (
    id_cdt SERIAL PRIMARY KEY,
    codigo CHAR(2) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas CHAR(8),
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.cedt (codigo, nombre, siglas) VALUES
(00, 'NINGUNO', 'NINGUN'),
(01, 'CANADA', 'CANADA'),
(02, 'CHILE', 'CHILE'),
(03, 'COMUNIDAD ANDI NACIO', 'COMAND'),
(04, 'BRASIL', 'BRASIL'),
(05, 'ESTADOS UNID MEXICAN', 'ESUNIM'),
(06, 'REPUBLICA DE COREA', 'REPDCO'),
(07, 'CONFEDERACIÓN SUIZA', 'CONFSU'),
(08, 'PORTUGAL', 'PORTUG'),
(09, 'OTROS', 'OTROS');

-----------------------------
-- TABLA DE SUCURSALES --
---------------------------
CREATE TABLE public.sucursal (
    id_sucursal SERIAL PRIMARY KEY,
	codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO public.sucursal (codigo, nombre, direccion)
VALUES 
(001, 'Lima', 'Av. Separadora Industrial Nro. 1555 Ate - Lima'),
(002, 'Arequipa', 'Av. Asociación Aptasa MZ.H LT.5 Cerro Colorado - Arequipa');

CREATE TABLE public.prioridades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO public.prioridades (nombre) VALUES
('Normal'),
('Urgente'),
('Alta');

-- Crear la tabla de medios de transporte
CREATE TABLE public.medios_transporte (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    siglas VARCHAR(20)
);

-- Insertar medios de transporte
INSERT INTO public.medios_transporte (nombre, siglas) VALUES
('AEREO', 'AEREO'),
('MARITIMO', 'MARITI'),
('TERRESTRE', 'TERRES'),
('COURRIER', 'COURRI');

-- TABLA DE ANEXOS --
CREATE TABLE public.tipo_anexo (
    id_anexo SERIAL PRIMARY KEY,
    codigo CHAR(1) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    siglas VARCHAR(10)
);

INSERT INTO public.tipo_anexo (codigo, nombre, siglas) VALUES
('A', 'AÑALES', 'ANL'),
('B', 'Bancos', 'BNC'),
('C', 'Cliente', 'CLI'),
('H', 'Inform. Profesionales', 'INF'),
('P', 'Proveedores', 'PRV'),
('T', 'Transportista', 'TRP'),
('V', 'Varios', 'VAR'),
('W', 'Personal', 'PER'),
('X', 'No Aplica', 'NA');

--SE PUEDE EJECUTAR
---------------------------------------------
-------------MODULO DE CONTABILIDAD ----------
---------------------------------------------

-- Crear tipo enumerado para los estados
CREATE TYPE tipo_obligatoriedad AS ENUM ('obligatorio', 'opcional', 'no_requiere');

-- Crear la tabla de incoterms
CREATE TABLE public.incoterms (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    siglas VARCHAR(20),
    flete_interno tipo_obligatoriedad NOT NULL,
    handling_local tipo_obligatoriedad NOT NULL,
    almacenaje tipo_obligatoriedad NOT NULL,
    manipuleo tipo_obligatoriedad NOT NULL,
    descarga tipo_obligatoriedad NOT NULL,
    control_doc tipo_obligatoriedad NOT NULL,
    comision tipo_obligatoriedad NOT NULL,
    conduccion tipo_obligatoriedad NOT NULL,
    devol_contenedor tipo_obligatoriedad NOT NULL,
    tramite_documentario tipo_obligatoriedad NOT NULL,
    thc tipo_obligatoriedad NOT NULL,
    ad_valorem tipo_obligatoriedad NOT NULL,
    otros tipo_obligatoriedad NOT NULL,
    extormar tipo_obligatoriedad NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert para los incoterms
INSERT INTO public.incoterms (
    codigo, nombre, siglas,
    flete_interno, handling_local, almacenaje, manipuleo, descarga,
    control_doc, comision, conduccion, devol_contenedor, tramite_documentario,
    thc, ad_valorem, otros, extormar
) VALUES 
('001', 'COST & FREIGHT AEREO', 'C&FA',
    'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio',
    'obligatorio', 'obligatorio', 'obligatorio', 'no_requiere', 'obligatorio',
    'no_requiere', 'obligatorio', 'opcional', 'no_requiere'),
('002', 'COST & FREIGHT MARIT', 'C&FM',
    'obligatorio', 'opcional', 'obligatorio', 'obligatorio', 'obligatorio',
    'obligatorio', 'obligatorio', 'obligatorio', 'no_requiere', 'obligatorio',
    'obligatorio', 'obligatorio', 'opcional', 'no_requiere'),
('003', 'COST INSURAN FREIGHT', 'CIF',
    'obligatorio', 'opcional', 'obligatorio', 'obligatorio', 'obligatorio',
    'obligatorio', 'obligatorio', 'obligatorio', 'no_requiere', 'obligatorio',
    'obligatorio', 'obligatorio', 'opcional', 'no_requiere'),
('004', 'EXWORK', 'EXW',
    'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio',
    'obligatorio', 'obligatorio', 'obligatorio', 'no_requiere', 'obligatorio',
    'opcional', 'obligatorio', 'opcional', 'no_requiere'),
('005', 'FREE ON BOARD', 'FOB',
    'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio', 'obligatorio',
    'obligatorio', 'obligatorio', 'obligatorio', 'no_requiere', 'obligatorio',
    'opcional', 'obligatorio', 'opcional', 'no_requiere');

CREATE TABLE contabilidad.plan_cuentas (
    id_plan SERIAL PRIMARY KEY,
    codigo INTEGER NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    moneda VARCHAR(20) CHECK (moneda IN ('AMBAS', 'NUEVO SOL', 'DOLAR')),
    cuenta_corriente BOOLEAN DEFAULT FALSE,
    balance_comprobacion VARCHAR(28) CHECK (balance_comprobacion IN ('RESULTADO', 'SALDO', 'INVENTARIO')),
    diferencia_cambio BOOLEAN DEFAULT FALSE,
    bg_egp VARCHAR(28) CHECK (bg_egp IN ('AMBOS', 'SOLO BALANCE x FUNCION', 'SOLO NATURALEZA')),
    cuenta_restringida_caja BOOLEAN,
    tipo VARCHAR(10) CHECK (tipo IN ('TITULO', 'DIGITABLE')),
    transferencias VARCHAR(30) CHECK (transferencias IN ('SIN TRANSFERENCIA', 'CON TRANSFERENCIA')),
    centro_costo BOOLEAN,
    tabla_egp_balances VARCHAR(50) CHECK (tabla_egp_balances IN ('ACTIVO CORRIENTE', 'ACTIVO NO CORRIENTE', 'CTAS. ORDEN DEUDORAS', 'PASIVO CORRIENTE', 'PASIVO NO CORRIENTE', 'PATRIMONIO', 
    'CTAS. ORDEN ACREEDOR', 'GASTOS POR NATURALEZA', 'UTILIDAD BRUTA', 'GASTOS DE OPERACION', 'RESULTADOS', 'R.E.I DEL EJERCICIO')),
    id_banco INTEGER REFERENCES public.bancos(id_bancos),
    importaciones BOOLEAN DEFAULT FALSE,
    imprime_inven_balance BOOLEAN DEFAULT FALSE,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances, id_banco) VALUES
(10, 'CAJA Y BANCOS', 'AMBAS', true, 'SALDO', false, 'AMBOS', 'TITULO', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', null),
(101, 'Caja', 'NUEVO SOL', true, 'SALDO', false, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', null),
(102, 'Bancos', 'AMBAS', true, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', null),
(10201, 'Banco de Crédito - Cta. Corriente', 'AMBAS', true, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', 2),
(10202, 'Interbank - Cta. Corriente', 'AMBAS', true, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', 3),
(10203, 'BBVA Continental - Cta. Corriente', 'AMBAS', true, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', 11),
(10204, 'Scotiabank - Cta. Ahorros', 'AMBAS', true, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', 9),
(10205, 'Banco de la Nación - Cta. Corriente', 'NUEVO SOL', true, 'SALDO', false, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', 18);

-- CUENTAS POR COBRAR
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(12, 'CUENTAS POR COBRAR COMERCIALES', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'TITULO', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE'),
(121, 'Clientes Nacionales', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE'),
(122, 'Clientes del Exterior', 'DOLAR', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE');

-- INVENTARIOS
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances, imprime_inven_balance) VALUES
(20, 'INVENTARIOS', 'AMBAS', false, 'INVENTARIO', false, 'AMBOS', 'TITULO', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', true),
(201, 'Materias Primas', 'AMBAS', false, 'INVENTARIO', false, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', true),
(202, 'Productos en Proceso', 'AMBAS', false, 'INVENTARIO', false, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', true),
(203, 'Productos Terminados', 'AMBAS', false, 'INVENTARIO', false, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO CORRIENTE', true);

-- ACTIVO NO CORRIENTE
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(30, 'INMUEBLE, MAQUINARIA Y EQUIPO', 'NUEVO SOL', false, 'SALDO', false, 'SOLO BALANCE x FUNCION', 'TITULO', 'SIN TRANSFERENCIA', true, 'ACTIVO NO CORRIENTE'),
(301, 'Terrenos', 'NUEVO SOL', false, 'SALDO', false, 'SOLO BALANCE x FUNCION', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO NO CORRIENTE'),
(302, 'Edificaciones', 'NUEVO SOL', false, 'SALDO', false, 'SOLO BALANCE x FUNCION', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'ACTIVO NO CORRIENTE');

-- PASIVO CORRIENTE
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances, id_banco) VALUES
(40, 'OBLIGACIONES FINANCIERAS', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'TITULO', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE', null),
(401, 'Préstamos Bancarios Corto Plazo', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE', 2),
(402, 'Sobregiros Bancarios', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE', 3);

-- CUENTAS POR PAGAR
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(42, 'CUENTAS POR PAGAR COMERCIALES', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'TITULO', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE'),
(421, 'Proveedores Nacionales', 'AMBAS', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE'),
(422, 'Proveedores del Exterior', 'DOLAR', false, 'SALDO', true, 'AMBOS', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'PASIVO CORRIENTE');

-- PATRIMONIO
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(50, 'PATRIMONIO', 'NUEVO SOL', false, 'SALDO', false, 'SOLO NATURALEZA', 'TITULO', 'SIN TRANSFERENCIA', false, 'PATRIMONIO'),
(501, 'Capital Social', 'NUEVO SOL', false, 'SALDO', false, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', false, 'PATRIMONIO'),
(502, 'Utilidades Acumuladas', 'NUEVO SOL', false, 'SALDO', false, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', false, 'PATRIMONIO');

-- INGRESOS
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(70, 'VENTAS', 'AMBAS', false, 'RESULTADO', true, 'SOLO NATURALEZA', 'TITULO', 'SIN TRANSFERENCIA', true, 'UTILIDAD BRUTA'),
(701, 'Ventas Nacionales', 'AMBAS', false, 'RESULTADO', true, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'UTILIDAD BRUTA'),
(702, 'Ventas de Exportación', 'DOLAR', false, 'RESULTADO', true, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'UTILIDAD BRUTA');

-- GASTOS
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(60, 'GASTOS DE ADMINISTRACIÓN', 'NUEVO SOL', false, 'RESULTADO', false, 'SOLO NATURALEZA', 'TITULO', 'SIN TRANSFERENCIA', true, 'GASTOS DE OPERACION'),
(601, 'Sueldos y Salarios', 'NUEVO SOL', false, 'RESULTADO', false, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'GASTOS DE OPERACION'),
(602, 'Alquileres', 'NUEVO SOL', false, 'RESULTADO', false, 'SOLO NATURALEZA', 'DIGITABLE', 'SIN TRANSFERENCIA', true, 'GASTOS DE OPERACION');

-- CUENTA CON TRANSFERENCIA
INSERT INTO contabilidad.plan_cuentas (codigo, nombre, moneda, cuenta_corriente, balance_comprobacion, diferencia_cambio, bg_egp, tipo, transferencias, centro_costo, tabla_egp_balances) VALUES
(999, 'RESULTADO DEL EJERCICIO', 'AMBAS', false, 'RESULTADO', true, 'AMBOS', 'DIGITABLE', 'CON TRANSFERENCIA', false, 'RESULTADOS');


-- TIPO DE OPERACIONES SE RELACIONA CON PLAN DE CUENTAS, TIPO DE OPERACION SUNAT, TIPO ANEXO CATEGORIA 
CREATE TABLE public.cod_operacion (
    id_cod_operacion SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    siglas VARCHAR(15) NOT NULL,
    cnt_cargo INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    cnt_abono INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    tp_anexo INTEGER REFERENCES public.tipo_anexo(id_anexo),
    tipo_movimiento VARCHAR(10) CHECK (tipo_movimiento IN ('INGRESO', 'SALIDA')),
    cl_costos VARCHAR(40) CHECK (cl_costos IN ('SI CALCULA COSTO PROMEDIO', 'TOMA COSTO PROMEDIO', 'TOMA COSTO DIGITADO')),
    centro_costo VARCHAR(15) CHECK (centro_costo IN ('SIN C COSTO', 'CON C COSTO')),
    codigo_sunat INTEGER REFERENCES public.tipo_operaciones(id_operacion),
    almc_destino VARCHAR(15) CHECK (almc_destino IN ('SIN DESTINO', 'CON DESTINO')),
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    fila_guia INTEGER,
    columna_guia INTEGER,
    cod_opr_ing INTEGER REFERENCES public.cod_operacion(id_cod_operacion),
    orden_fabricacion VARCHAR(9) CHECK (orden_fabricacion IN ('SIN ORDEN', 'CON ORDEN'))
);

ALTER TABLE public.cod_operacion
ADD COLUMN origen_default VARCHAR(20)
    CHECK (origen_default IN (
        'O/C','O/F','O/T','CLIENTE','PROVEEDOR',
        'PRODUCCION','AJUSTE','INTERNO','DEVOLUCION'
    ));

/*
INSERT INTO public.cod_operacion (codigo, nombre, siglas, cnt_cargo, cnt_abono, tp_anexo, tipo_movimiento, cl_costos, centro_costo, codigo_sunat, almc_destino, id_categoria, fila_guia, columna_guia, cod_opr_ing, orden_fabricacion) VALUES
(101, 'ING.x PRODUCCION', 'IngPro', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 19, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(102, 'Z-ING CONSIGNACION', 'IngCon', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(103, 'ING.x DEV.CONSIGNAC.', 'IngCon', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 3, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(104, 'ING.x REPARACION', 'IngRep', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(105, 'ING.x REGULARIZACION', 'IngReg', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 13, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(106, 'ING x COMPRA MERCADE', 'INGMER', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 5, 0, 0, NULL, 'SIN ORDEN'),
(107, 'ING X REG INVENTARIO', 'INGRIN', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 16, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(109, 'ZING.x ARMADO VARIOS', 'IngVar', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(110, 'ING.x PANAL TRANSF.', 'IngTrs', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 21, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(111, 'ING.x.REGUL.INV PTME', 'REGINV', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(112, 'ING.x TRASL/ESTB. PT', 'TRASLA', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 21, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(113, 'ING X COMPRA ENV EMB', 'INGCEE', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(114, 'ING X COMPRA ACTIVO', 'INGXAC', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 39, 'SIN DESTINO', 1, 0, 0, NULL, 'SIN ORDEN'),
(115, 'ING.x TRASL/ESTA MER', 'INTRAM', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 5, 0, 0, NULL, 'SIN ORDEN'),
(120, 'ING.x MATERIA PRIMA', 'MATPRI', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(121, 'ING.x COMPRA ECONOMA', 'COMECO', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(122, 'ING.x COMPRA SUM DIV', 'SUMDIV', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 4, 0, 0, NULL, 'SIN ORDEN'),
(137, 'ING.x MUESTRA FERIA', 'IngMue', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(139, 'Z ING.x VARIOS', 'IngVar', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', NULL, 0, 0, NULL, 'SIN ORDEN'),
(140, 'ING.x DEVOL PT CLIEN', 'IngDPT', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 5, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(141, 'ING DEVOL MER CLIEN', 'IngMec', NULL, NULL, 3, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 6, 'SIN DESTINO', 5, 0, 0, NULL, 'SIN ORDEN'),
(142, 'ZING.PANALES NO ENTR', 'IPNE', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(148, 'ING.x RECLAMO', 'IngRec', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 24, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(149, 'ING.x RECLAMO-CHATAR', 'IngRec', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 24, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(150, 'SAL.x VENTA-MAT.PRI.', 'VtaMpr', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(151, 'SAL.x VENTA', 'ComVta', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(152, 'SAL.x CONSIGNACION', 'SalCon', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 4, 'CON DESTINO', 3, 50, 3, 2, 'SIN ORDEN'),
(153, 'SALx DEV.CONSIGNAC.', 'SaDCon', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 6, 'SIN DESTINO', 3, 46, 28, NULL, 'SIN ORDEN'),
(154, 'SAL,x REPARACION', 'SalRep', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(155, 'SAL x REGULARIZACION', 'SalReg', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 25, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(156, 'SAL X REGUL MERCADE', 'SRALUM', NULL, NULL, 9, 'SALIDA', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 28, 'SIN DESTINO', 5, 0, 0, NULL, 'SIN ORDEN'),
(157, 'SAL MER PRODUCCION', 'SMERPR', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 5, 0, 0, NULL, 'CON ORDEN'),
(158, 'SAL.x VENTA AREQ', 'ComVta', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(159, 'SAL.x .ARMADO VARIOS', 'SalVar', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 25, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(160, 'SAL.x TRANSF.PANAL', 'SalTrn', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 3, 49, 29, NULL, 'SIN ORDEN'),
(161, 'SAL.x REGUL.INVENTAR', 'REGINV', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 39, 'SIN DESTINO', 6, 46, 87, NULL, 'SIN ORDEN'),
(162, 'SAL.x CONSIGNACION', 'DONACI', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 9, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(163, 'SAL.x MAT.PR.TRANSF.', 'MTTRAN', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 3, 49, 29, NULL, 'SIN ORDEN'),
(164, 'SAL.x TRASL/ESTAB PT', 'ESTAB', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(165, 'ING.x TRASL/ESTA MER', 'SALTRM', NULL, NULL, 3, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 5, 0, 0, NULL, 'SIN ORDEN'),
(180, 'SAL.x VENTA-MAT.PRI', 'MATPRI', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(181, 'SAL.x VENTA-MAT.AUX', 'MATAUX', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(182, 'SAL.x VENTA-SUM.DIV', 'SUMDIV', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(183, 'SAL.x VENTA-VARIOS', 'VARIOS', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(186, 'SAL.x POR COMPRA', 'COMPRA', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 6, 'SIN DESTINO', 3, 0, 0, NULL, 'SIN ORDEN'),
(187, 'SAL.x PARA MUESTRA', 'SalMue', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 47, 88, NULL, 'SIN ORDEN'),
(188, 'SAL.x ROBO', 'SalRob', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(189, 'SAL.x. VARIAS', 'SalVar', NULL, NULL, 5, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(190, 'SAL.x. SERVICIOS', 'SalSer', NULL, NULL, 5, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(191, 'SAL.x REP.RADIADOR', 'SRpRad', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(192, 'SAL.x CUELLO X ARMA', 'SCArma', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 27, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(193, 'SAL.x TUBO X ARM.RAD', 'STbArm', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(195, 'SAL.x VTA/TUBO/REPAR', 'STVREP', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 1, 'SIN DESTINO', 3, 46, 2, NULL, 'SIN ORDEN'),
(196, 'SAL.x TUBO/ARMADO', 'STB/AR', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 27, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(197, 'SAL.x/TUB/CONV/TI-TA', 'STB/CO', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 27, 'SIN DESTINO', 3, 46, 87, NULL, 'SIN ORDEN'),
(199, 'SAL.x DEVOLC.RECLAMO', 'S.DRec', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 6, 'SIN DESTINO', 3, 46, 28, NULL, 'SIN ORDEN'),
(200, 'SALIDTRASL/ ESTA MER', 'STM', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 5, 49, 29, NULL, 'SIN ORDEN'),
(201, 'ING.x COMPRAS M.P', 'IngM.P', NULL, NULL, 5, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(202, 'ING.x COMPRA MAT AUX', 'IngCMA', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'CON C COSTO', 2, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(203, 'ING.x M.P. PROCESO', 'IngMPP', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(204, 'ING.x TRANSFORMACION', 'IngTrn', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(205, 'ING.x MATER. FALLADO', 'FALLAD', NULL, NULL, 5, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 5, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(206, 'ING.x PLAN ALM-I', 'REIALM', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(208, 'ING.x S.D. COMP/MANU', 'IngSDM', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 5, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(209, 'ING.x VARIOS', 'IngVar', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 20, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(210, 'Z-ING. x RECICLADO', 'IngRec', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 19, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(213, 'ING.x MODIFICADOS', 'MPMODF', NULL, NULL, 5, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO', 19, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(214, 'ING.x TRASLADO/ESTB.', 'TRASLA', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 21, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(215, 'INGRESO DEVOL PIND', 'DEVPIN', NULL, NULL, 9, 'INGRESO', 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO', 19, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(251, 'SAL.x M.P.PRODUCCION', 'SalMPP', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(252, 'SAL.x M.P.DEVOLUCION', 'SalMPD', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 25, 'SIN DESTINO', 6, 0, 0, NULL, 'SIN ORDEN'),
(253, 'SAL.x M.P.PROCESO', 'SalMPP', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(254, 'SAL.x TRANSFORMACION', 'SalTrn', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(255, 'SAL.x MATER. FALLADO', 'SalFll', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 25, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(256, 'SAL.x MATERIAL E.P.P', 'E.P.P.', NULL, NULL, 8, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(257, 'SAL.x TRASLADO/ESTAB', 'ESTAB', NULL, NULL, 3, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 11, 'SIN DESTINO', 6, 46, 87, NULL, 'SIN ORDEN'),
(258, 'SAL. x CONSUMO MANT.', 'SalMan', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(259, 'SAL. x VARIOS', 'SalVar', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(260, 'SAL. x RECICLADO', 'SalRec', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 6, 0, 0, NULL, 'CON ORDEN'),
(501, 'ING.x COMPRA REPUEST', 'IngRpo', NULL, NULL, 5, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 7, 0, 0, NULL, 'SIN ORDEN'),
(502, 'ING.x COMPRA HERRAMI', 'IngHer', NULL, NULL, 3, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 2, 'SIN DESTINO', 7, 0, 0, NULL, 'SIN ORDEN'),
(509, 'ING.x REGUL.INVENTAR', 'Ingreg', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 20, 'SIN DESTINO', 7, 46, 87, NULL, 'SIN ORDEN'),
(519, 'SAL x REGULARIZACION', 'SalReg', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 10, 'SIN DESTINO', 7, 46, 87, NULL, 'SIN ORDEN'),
(551, 'SAL.x REPUESTOS', 'SalRpt', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 10, 'SIN DESTINO', 7, 0, 0, NULL, 'SIN ORDEN'),
(552, 'SAL.x HERRAMIENTAS', 'SalHer', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO', 39, 'SIN DESTINO', 7, 0, 0, NULL, 'SIN ORDEN'),
(951, 'SALIDA DE UTILES ESC', 'SALUTI', NULL, NULL, 9, 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO', 39, 'SIN DESTINO', 4, 0, 0, NULL, 'SIN ORDEN'),
(999, 'INVENTARIO INICIAL', 'IngInv', NULL, NULL, 9, 'INGRESO', 'TOMA COSTO DIGITADO', 'SIN C COSTO', 39, 'SIN DESTINO', NULL, 0, 0, NULL, 'SIN ORDEN');*/

--NUEVOS INSERTS PARA OPERACIONES-----------------
-- ============================================
-- OPERACIONES PARA NOTAS DE INGRESO (NI / NIC / NIE)
-- ============================================

INSERT INTO public.cod_operacion 
(codigo, nombre, siglas, cnt_cargo, cnt_abono, tp_anexo, tipo_movimiento,
 cl_costos, centro_costo, codigo_sunat, almc_destino, id_categoria,
 fila_guia, columna_guia, cod_opr_ing, orden_fabricacion, origen_default)
VALUES

-- ==============================
--       NI: NOTAS GENERALES
-- ==============================

-- 101 - Ingreso por producción
(101, 'Ingreso por producción', 'ING_PROD',
 NULL, NULL, 9, 'INGRESO',
 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO',
 19, 'SIN DESTINO', 3,
 0, 0, NULL, 'SIN ORDEN', 'PRODUCCION'),

-- 105 - Ajuste positivo inventario
(105, 'Ajuste positivo por conteo físico', 'AJUS_POS',
 NULL, NULL, 9, 'INGRESO',
 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO',
 13, 'SIN DESTINO', 3,
 0, 0, NULL, 'SIN ORDEN', 'AJUSTE'),

-- 110 - Transferencia interna hacia este almacén
(110, 'Ingreso transf. interna', 'ING_TRF',
 NULL, NULL, 9, 'INGRESO',
 'SI CALCULA COSTO PROMEDIO', 'SIN C COSTO',
 21, 'SIN DESTINO', 3,
 0, 0, NULL, 'SIN ORDEN', 'INTERNO'),

-- 140 - Devolución de cliente
(140, 'Ingreso devol. cliente', 'ING_DEVCL',
 NULL, NULL, 9, 'INGRESO',
 'TOMA COSTO DIGITADO', 'SIN C COSTO',
 5, 'SIN DESTINO', 3,
 0, 0, NULL, 'SIN ORDEN', 'CLIENTE'),

-- 209 - Ingreso varios (donaciones, ingresos sin documento, etc.)
(209, 'Ingreso varios', 'ING_VAR',
 NULL, NULL, 9, 'INGRESO',
 'SI CALCULA COSTO PROMEDIO', 'CON C COSTO',
 20, 'SIN DESTINO', 6,
 0, 0, NULL, 'CON ORDEN', 'INTERNO'),


-- ================================================
--      NIC / NIE: INGRESOS POR ORDEN DE COMPRA
-- ================================================

-- 201 - Compra materia prima
(201, 'Ingreso compra M.P.', 'INGCMP_MP',
 NULL, NULL, 5, 'INGRESO',
 'TOMA COSTO DIGITADO', 'SIN C COSTO',
 2, 'SIN DESTINO', 6,
 0, 0, NULL, 'SIN ORDEN', 'O/C'),

-- 202 - Compra material auxiliar
(202, 'Ingreso compra mat.aux', 'INGCMP_MA',
 NULL, NULL, 9, 'INGRESO',
 'TOMA COSTO DIGITADO', 'CON C COSTO',
 2, 'SIN DESTINO', 6,
 0, 0, NULL, 'CON ORDEN', 'O/C'),

-- 106 - Compra de mercadería
(106, 'Ingreso compra mercadería', 'INGCMP_MER',
 NULL, NULL, 9, 'INGRESO',
 'TOMA COSTO DIGITADO', 'SIN C COSTO',
 2, 'SIN DESTINO', 5,
 0, 0, NULL, 'SIN ORDEN', 'O/C'),

-- 501 - Compra repuestos
(501, 'Ingreso compra repuestos', 'INGCMP_RP',
 NULL, NULL, 5, 'INGRESO',
 'TOMA COSTO DIGITADO', 'SIN C COSTO',
 2, 'SIN DESTINO', 7,
 0, 0, NULL, 'SIN ORDEN', 'O/C'),

-- 502 - Compra herramientas
(502, 'Ingreso compra herramientas', 'INGCMP_HR',
 NULL, NULL, 3, 'INGRESO',
 'TOMA COSTO DIGITADO', 'SIN C COSTO',
 2, 'SIN DESTINO', 7,
 0, 0, NULL, 'SIN ORDEN', 'O/C');

-------------------------------------
-------------------------------------
--OPERACIONES PARA NOTAS DE SALIDA---
-------------------------------------
-------------------------------------

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 codigo_sunat, almc_destino, orden_fabricacion, origen_default)
VALUES
(151, 'Despacho por venta a cliente', 'SAL_VENTA',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 1, 'SIN DESTINO', 'SIN ORDEN', 'CLIENTE');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(251, 'Consumo de materia prima para producción', 'SAL_PROD_MP',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO',
 'CON ORDEN', 'PRODUCCION');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(258, 'Consumo interno para mantenimiento', 'SAL_MANT',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO',
 'SIN ORDEN', 'INTERNO');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 almc_destino, orden_fabricacion, origen_default)
VALUES
(160, 'Transferencia interna entre almacenes', 'SAL_TRF',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 'CON DESTINO', 'SIN ORDEN', 'INTERNO');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(155, 'Ajuste positivo por conteo físico (Sobrante)', 'AJUSTE_NEG',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 'SIN ORDEN', 'AJUSTE');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(256, 'Consumo de equipos de protección personal', 'SAL_EPP',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO',
 'SIN ORDEN', 'INTERNO');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(551, 'Consumo de repuestos', 'SAL_REP',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'CON C COSTO',
 'SIN ORDEN', 'INTERNO'),

(552, 'Consumo de herramientas', 'SAL_HERR',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 'SIN ORDEN', 'INTERNO');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(188, 'Salida por siniestro o robo', 'SAL_SIN',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 'SIN ORDEN', 'AJUSTE');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo,
 orden_fabricacion, origen_default)
VALUES
(199, 'Salida por devolución asociada a reclamo', 'SAL_DEV_REC',
 'SALIDA', 'TOMA COSTO PROMEDIO', 'SIN C COSTO',
 'SIN ORDEN', 'DEVOLUCION');

INSERT INTO public.cod_operacion
(codigo, nombre, siglas, tipo_movimiento, cl_costos, centro_costo, orden_fabricacion, origen_default)
VALUES
(156, 'Merma / deterioro / vencimiento', 'SAL_MERMA', 'SALIDA', 
'TOMA COSTO PROMEDIO', 'SIN C COSTO', 'SIN ORDEN', 'AJUSTE');



-----------------------------------------------------------------------------
------ DIVISIONES DE MERCADERIA (RELACION PLAN DE CUENTAS Y CATEGORIA) --------
------------------------------------------------------------------------------

CREATE TABLE public.division_mercaderia (
    id_div_merca SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas VARCHAR(12) NOT NULL,
    cuenta_cargo INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    cuenta_abono INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    cuenta_compras_cargo INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    cuenta_compras_abono INTEGER REFERENCES contabilidad.plan_cuentas(id_plan),
    comentario TEXT
);


INSERT INTO public.division_mercaderia (codigo, nombre, siglas, id_categoria) VALUES
(101, 'AUTOMOTRIZ', 'AUTMOT', 3),
(102, 'INDUSTRIALES', 'INDUST', 3),
(103, 'T.C.', 'T.C.', 3),
(104, 'CLIMAX IND', 'CLIMAX', 3),
(107, 'TUBOS TA Y TE IND', 'TBTATE', 3),
(108, 'TUBOS TI IND', 'TUBOTI', 3),
(110, 'VTAS. MATERIA PRIMA', 'MVTAMP', 6),
(111, 'DESPERDICIO', 'DESPER', 3),
(112, 'CHATARRA', 'CHATAR', 6),
(113, 'CUELLOS CHICOS', 'CUECHI', 3),
(114, 'CUELLOS GRANDES', 'CUEGRA', 3),
(115, 'GRIFOS', 'GRIFOS', 3),
(116, 'ACCESORIOS', 'ACCESO', 3),
(119, 'REPARACIONES IND', 'REPARA', 3),
(125, 'PARRILAS', 'PARRIL', 3),
(129, 'MUESTRA', 'MUESTR', 3),
(131, 'SERVICIO', 'SERVIC', 2),
(183, 'REFRIGERANTE FORTALU', 'RFORTA', 5),
(184, 'MERCADERIA OTROS', 'MEROTR', 5),
(185, 'ALUMET', 'ALU', 5),
(186, 'INTERESES', 'INT', 2),
(187, 'DEVOLUCION DE PANALE', 'DEV.P', 3),
(188, 'DEVOLUCION DE SERVIC', 'DEV.P', 3),
(189, 'DESCUENTOS CONCEC', 'DEV.C', 3),
(190, 'EXTERIOR', 'EXT', 2),
(191, 'DEVOLUCION ALUMET', 'DEV. A', 5),
(192, 'DESCUENTO ESP ALUMET', 'DE', 5),
(193, 'DESCUENTO ESPECIAL', 'DESPEC', 3),
(194, 'DESCUENTO FORTALUM', 'DESFOR', 5),
(195, 'ANTICIPO DE CLIENTE', 'ANTICI', 2),
(196, 'ANULACION DE ANTICPO', 'ANULAN', 3),
(201, 'MATERIA PRIMA', 'MATRPM', 6),
(202, 'ENVASE', 'ENVASE', 6),
(203, 'Sum. Diversos O/F', 'SumDiv', 6),
(204, 'RECICLADO #1', 'REC.#1', 6),
(205, 'Implementos de Segur', 'ImpSeg', 6),
(206, 'SUMINISTRO DIVER', 'sumdiv', 4),
(207, 'ECONOMATOS', 'ECO', 6),
(208, 'EMBALAJE', 'EMBAL', 6),
(306, 'Panales Obsoletos', 'Obsole', 3),
(501, 'RPTOS. DE MAQUINAS', 'RPTOS.', 7),
(502, 'HERRAMIENTAS', 'HERRAM', 7),
(503, 'EQUIPOS', 'EQUIPO', 7),
(504, 'CONSUMIBLES', 'CONSUM', 4),
(505, 'INFRAESTRUCTURA', 'INFRAE', 7),
(506, 'ACTIVOS EN ALM', 'ACTALM', 1),
(601, 'MP TUBOS', 'MTB', 6);

----CENTRO DE COSTO ----
CREATE TABLE contabilidad.c_costo (
    id_c_costo SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(28) UNIQUE NOT NULL,
	siglas CHAR(8) NOT NULL,
    orden_fab VARCHAR(12) CHECK (orden_fab IN ('SIN ORDEN', 'CON ORDEN')) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO contabilidad.c_costo (codigo, nombre, siglas, orden_fab) VALUES
(100, 'CONVENCIONAL LIVIANO', 'CnvLiv', 'SIN ORDEN'),
(200, 'CAT. ESPECIALES', 'CATESP', 'SIN ORDEN'),
(300, 'ESPECIALES', 'Espec.', 'CON ORDEN'),
(400, 'SERVICIOS', 'Serve.', 'CON ORDEN'),
(500, 'MATERIA PRIMA', 'MatPri', 'SIN ORDEN'),
(600, 'MATERIALES AUXILIARE', 'MatAux', 'SIN ORDEN'),
(700, 'SUMINISTROS DIVERSOS', 'SumDiv', 'SIN ORDEN'),
(800, 'ACTIVOS FIJOS', 'ActFij', 'SIN ORDEN'),
(900, 'ADMINISTRACION', 'Varios', 'SIN ORDEN'),
(901, 'GERENCIA', 'GER', 'SIN ORDEN'),
(902, 'CONTABILIDAD/FINAN.', 'CONTFI', 'SIN ORDEN'),
(903, 'RECURSOS HUMANOS', 'RRHH', 'SIN ORDEN'),
(904, 'SEGURIDAD INDUSTRIAL', 'SEG', 'SIN ORDEN'),
(905, 'SISTEMA INTEGRADO', 'SIG', 'SIN ORDEN'),
(906, 'MARKETING', 'MKT', 'SIN ORDEN'),
(907, 'COMPRAS', 'COMP.', 'SIN ORDEN'),
(908, 'ALMACEN', 'ALM.', 'SIN ORDEN'),
(909, 'TECNOLOGIA DE LA INF', 'TINF', 'SIN ORDEN'),
(910, 'MANTENIMIENTO', 'MANTEN', 'SIN ORDEN'),
(920, 'DISTRIBUCIÓN', 'DIST.', 'SIN ORDEN'),
(921, 'COMERCIAL', 'COM', 'SIN ORDEN'),
(930, 'PROD./ AREQUIPA', 'PAQP', 'SIN ORDEN'),
(931, 'ADM./ AREQUIPA', 'AAQP', 'SIN ORDEN'),
(932, 'VENTAS/ AREQUIPA', 'VAQP', 'SIN ORDEN'),
(940, 'GASTOS REPARABLES', 'REPARO', 'SIN ORDEN'),
(996, 'LOCAL ALQUILADO', 'LALQUI', 'SIN ORDEN'),
(997, 'TRATAMIENTO DE AGUA', 'TRATAG', 'SIN ORDEN'),
(998, 'COSTOS POR REPARTIR', 'REPART', 'SIN ORDEN'),
(999, 'SIN CENTRO DE COSTOS', 'SINCEN', 'SIN ORDEN');

CREATE TABLE contabilidad.formas_pago (
    id SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(25) NOT NULL,
	siglas VARCHAR(10) NOT NULL,
    forma_pago VARCHAR(22) CHECK (forma_pago IN ('CONTADO', 'CONTADO DIFERIDO', 'CREDITO')),
    dias_gracia INTEGER,
    nro_letra INTEGER,
    periodo VARCHAR(12) CHECK (periodo IN ('NO APLICA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'ANUAL')),
    inv_compr_venta VARCHAR(8) CHECK (inv_compr_venta IN ('AMBOS', 'VENTAS', 'COMPRAS')),
    porc_import INTEGER DEFAULT 0,
    dias_vencimiento VARCHAR(25) DEFAULT 0,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO contabilidad.formas_pago (codigo, nombre, siglas, forma_pago, dias_gracia, nro_letra, periodo, inv_compr_venta, porc_import, dias_vencimiento) VALUES
(001, 'CONTADO', 'CONTAD', 'CONTADO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0'),
(002, 'CREDITO 07 DIAS', 'CREDIT', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 7, '7'),
(003, 'CREDITO 10 DIAS', 'CRE10', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 10, '10'),
(004, 'CREDITO 15 DIAS', 'CRE15', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 15, '15'),
(005, 'CREDITO 30 DIAS', 'CRE30', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 30, '30'),
(006, 'CREDITO 8 DIAS', 'CRE08', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 8, '8'),
(007, 'CREDITO 60 DIAS', 'CRE60', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 60, '60'),
(008, 'CREDITO 45 DIAS', 'CRE145', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 45, '45'),
(009, 'CREDITO 05 DIAS', 'CRE05', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 5, '5'),
(010, 'PEDIDO CON LETRA', 'PEDLET', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '5'),
(011, '60 B/L GIRO', 'OOOOO', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0'),
(012, '180 B/L GIRO', 'OOOOO', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0'),
(013, 'FACTORING 30 DIAS', 'FACTOR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30'),
(014, 'CONTADO 20 DIAS', 'CONT20', 'CONTADO DIFERIDO', 0, 0, 'NO APLICA', 'AMBOS', 20, '20'),
(015, 'CARTA DE CREDITO', 'CARCRE', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0'),
(016, 'CONTADO 15 A 30 DIAS', '15A30D', 'CONTADO DIFERIDO', 0, 0, 'NO APLICA', 'AMBOS', 0, '15-30'),
(017, 'CREDITO 90 DIAS', '90DIAS', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 90, '90'),
(018, 'CREDITO', 'CREDIT', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 30, '30'),
(019, 'LETRA 70 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '70'),
(020, 'LETRA 30 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30'),
(021, 'LETRA 45 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45'),
(022, 'LETRA 60 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60'),
(023, 'LETRA 75 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '75'),
(024, 'LETRA 90 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '90'),
(025, 'FACTORING 120 DIAS', 'FACTO', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '120'),
(026, 'FACTORING 90 DIAS', 'FACTO', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '90'),
(027, 'LETRA 30 Y 45 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-45'),
(028, 'LETRA 30-45-60-75-90', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-45-60-75-90'),
(029, 'LETRA 30-60-90 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-60-90'),
(030, 'LETRA 45 - 60 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60'),
(031, 'LETRA 45-60-75 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60-75'),
(032, 'LETRA 45-60-75-90', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60-75-90'),
(039, 'LETRA 30-45-60 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-45-60'),
(041, 'LETRA 45-60 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60'),
(042, 'LETRA 60-75 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60-75'),
(044, 'LETRA 45-60-90 DIAS', 'JLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60-90'),
(045, 'LETRA 60-90 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60-90'),
(046, 'LETRA 60-75-90', 'JLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60-75-90'),
(047, 'LETRA 45 -60-75 DIAS', 'JLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60-75'),
(048, 'FACTORING 60 DIAS', 'FACTOR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60'),
(050, 'LET 30-60', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-60'),
(053, 'LET 45-60-75-90 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-60-75-90'),
(058, 'LETRA 45-75 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-75'),
(063, 'LETRA 30 -60-90 DIAS', 'JLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-60-90'),
(064, 'LETRA 40-60 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-60'),
(065, 'L 40-50-60-75-90', 'SLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-50-60-75-90'),
(066, '75 DIAS FECHA B/L', '75 B/L', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '75'),
(067, '120 DIAS DIAS FECHA', '120 B/', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '120'),
(068, '90 DIAS FECHA B/L', '90 B/L', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '90'),
(069, 'L/ 30-40-50-60 DIAS', 'ZLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-60'),
(070, 'L/ 35-45-60 DIAS', 'SLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '35-45-60'),
(072, 'L/ 30-40-50-55-60', 'SLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-55-60'),
(073, 'LETRA 50-60 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '50-60'),
(074, 'L/ 40-50-60', 'OSLETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-50-60'),
(075, 'L/ 30-40-50-60-70-90', '06LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-60-70-90'),
(076, 'L/ 30-40-45-50-55-60', '06LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-45-50-55-60'),
(077, '30-40-50-60-70-80-90', '07LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-60-70-80-90'),
(078, '3,35,4,45,5,55,60,65', '08LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-35-40-45-50-55-60-65'),
(079, '30,35,40,45,50,55,60', '07LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-35-40-45-50-55-60'),
(080, 'L/ 30-40-50-60-70', '05LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-60-70'),
(081, 'L/ 60-65-70-75-80', '05LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '60-65-70-75-80'),
(082, 'LO/ 40-50-60-70-80', '05LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-50-60-70-80'),
(083, 'L/ 40-50-60-70', '04LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-50-60-70'),
(084, 'L/ 35-40-45-50-55-60', '06LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '35-40-45-50-55-60'),
(085, '10 LETRAS', '10LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, 'VARIOS'),
(086, '45-55 DIAS', '02LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '45-55'),
(087, '40-45-50-55-60 DIAS', '05LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '40-45-50-55-60'),
(088, '30-45-40-45-50-55-60', '07LETR', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-45-50-55-60'),
(089, 'DIFERIDO', 'DIFER', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, 'VARIOS'),
(090, 'DIFERIDO 30 DIAS', 'DIF30', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30'),
(091, 'LT 30/10 y 15/11', 'LT', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-15'),
(092, 'LETRA 30-40-50-60', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30-40-50-60'),
(093, '1LETRAAL30 NOV.', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '30'),
(094, '2LT: 60 y 90 DIAS', 'LETRA', 'CREDITO', 0, 2, 'NO APLICA', 'AMBOS', 0, '60-90'),
(096, 'DLT 34/12 y 1510415', 'LETRA', 'CREDITO', 0, 2, 'NO APLICA', 'AMBOS', 0, '0'),
(097, 'LETRA 120', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '120'),
(098, 'LETRA 80 DIAS', 'LETRA', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 0, '80'),
(099, 'CREDITO 20 DIAS', 'CRE30', 'CREDITO', 0, 0, 'NO APLICA', 'AMBOS', 20, '20'),
(100, '50% CONTADO 50% 45D', 'CONT40', 'CONTADO DIFERIDO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0'),
(101, '50% ADEL 50%ENTREGA', '50-50', 'CONTADO', 0, 0, 'NO APLICA', 'AMBOS', 0, '0');

CREATE TABLE contabilidad.cod_moneda (
    id_moneda SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    simbolo VARCHAR(3) NOT NULL,
    pais VARCHAR(30) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

INSERT INTO contabilidad.cod_moneda (codigo, nombre, simbolo, pais) VALUES
('PEN', 'NUEVO SOL', 'S/', 'PERÚ'),
('USD', 'DÓLAR AMERICANO', '$', 'ESTADOS UNIDOS'),
('EUR', 'EURO', '€', 'ZONA EURO');


CREATE TABLE contabilidad.tipo_cambio (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,  -- La fecha del tipo de cambio
    moneda_origen_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
    moneda_destino_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
    compra DECIMAL(12, 4) NOT NULL,     -- Tipo de cambio de compra
    venta DECIMAL(12, 4) NOT NULL,      -- Tipo de cambio de venta
    estado BOOLEAN DEFAULT TRUE,        -- Activo o no
    registrado_por INTEGER REFERENCES public.usuarios(id),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INTEGER REFERENCES public.usuarios(id),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--SE PUEDE EJECUTAR----------------
-- SE RELACIONA ALMACENES CON CATEGORIA
CREATE TABLE almacen.almacenes (
    id_alm SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(40) UNIQUE NOT NULL,
    siglas VARCHAR(10) NOT NULL,
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    tipo_alm VARCHAR(8) CHECK (tipo_alm IN ('INTERNO', 'EXTERNO'))
);

INSERT INTO almacen.almacenes (codigo, nombre, siglas, id_categoria, tipo_alm) VALUES
(110, 'ALMACEN CENTRAL PT', 'ALMCEN', 3, 'INTERNO'),
(113, 'FORTALEZA- AREQUIPA', 'RF AQP', 3, 'INTERNO'),
(114, 'ALMACEN MERCADERIA', 'ALMER', 5, 'INTERNO'),
(116, 'FORTCOMP-AREQUIPA', 'AREQUI', 5, 'INTERNO'),
(117, 'ALMACEN TRANSITO ME', 'TRANME', 5, 'EXTERNO'),
(119, 'ALMACEN STOCK FORTAL', 'ALMASF', 3, 'INTERNO'),
(198, 'ALM.PROD.TERM FALLAS', 'ALMPNC', 3, 'INTERNO'),
(199, 'ALMACEN CHATARRA', 'CHATAR', 3, 'INTERNO'),
(201, 'MAT.PRI SUM.DIV. EPP', 'ALMMAT', 6, 'INTERNO'),
(501, 'REPUESTOS D MAQUINAS', 'REPTOS', 7, 'INTERNO');

 -- TABLA DE PRODUCTO 
CREATE TABLE almacen.productos (
    id_producto SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    codigo_barras VARCHAR(50), 
    descripcion VARCHAR (200) NOT NULL,
    id_unidad INTEGER REFERENCES public.unidades_medida(id_unidades),
    id_categoria INTEGER REFERENCES public.categoria (id_categoria),
    id_div_merca INTEGER REFERENCES public.division_mercaderia(id_div_merca),
    moneda_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
	centro_costo_id INTEGER REFERENCES contabilidad.c_costo(id_c_costo),
	procedencia VARCHAR(12) CHECK (procedencia IN ('NACIONAL', 'IMPORTADO')),
    caracteristicas TEXT,
    fecha DATE NOT NULL,
	precio_unitario DECIMAL(12, 2),
    precio_total DECIMAL(12, 2), 
    precio_fabricacion DECIMAL(12, 2),-- para producto terminao / 
    precio_venta DECIMAL(12, 2),-- para producto terminado / servicios
    stock_minimo DECIMAL(12, 3) DEFAULT 0,
    stock_maximo DECIMAL(12, 3),
    stock_actual DECIMAL(12, 3) DEFAULT 0,
	afecto_igv BOOLEAN DEFAULT TRUE,
    ubicacion VARCHAR(20) CHECK (ubicacion IN ('MANTENIMIENTO', 'LIMA')),
    estado BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: PRODUCTO TERMINADO (T)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, codigo_barras, descripcion, id_unidad, id_categoria, id_div_merca, 
    moneda_id, centro_costo_id, procedencia, caracteristicas, fecha, 
    precio_fabricacion, precio_venta, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, estado, created_by
) VALUES
('PT-001', '7501234567890', 'RADIADOR AUTOMOTRIZ STANDARD 40X60', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '101'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '100'),
    'NACIONAL', 'Radiador convencional liviano 40x60cm', CURRENT_DATE,
    150.00, 220.00, 10, 100, 45, true, true, 1),

('PT-002', '7501234567891', 'RADIADOR INDUSTRIAL 60X80', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '102'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '100'),
    'NACIONAL', 'Radiador industrial alta capacidad', CURRENT_DATE,
    280.00, 420.00, 5, 50, 22, true, true, 1),

('PT-003', '7501234567892', 'INTERCAMBIADOR DE CALOR TC-45', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '103'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '300'),
    'NACIONAL', 'Intercambiador especial TC-45', CURRENT_DATE,
    350.00, 540.00, 3, 30, 12, true, true, 1),

('PT-004', '7501234567893', 'RADIADOR CLIMAX INDUSTRIAL CI-100', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '104'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '300'),
    'NACIONAL', 'Radiador Climax Industrial serie 100', CURRENT_DATE,
    420.00, 650.00, 5, 25, 8, true, true, 1),

('PT-005', '7501234567894', 'PARRILLA REFORZADA PR-50', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '125'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '100'),
    'NACIONAL', 'Parrilla reforzada para radiador', CURRENT_DATE,
    65.00, 95.00, 20, 150, 78, true, true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: MERCADERIA (M)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_unidad, id_categoria, id_div_merca,
    moneda_id, procedencia, caracteristicas, fecha,
    precio_unitario, precio_total, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, estado, created_by
) VALUES
('MER-001', 'REFRIGERANTE FORTALUM 5L', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '183'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'IMPORTADO', 'Refrigerante Fortalum presentación 5 litros', CURRENT_DATE,
    35.00, 35.00, 50, 500, 285, true, true, 1),

('MER-002', 'REFRIGERANTE ALUMET GALON', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'GAL'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '185'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'NACIONAL', 'Refrigerante Alumet presentación galón', CURRENT_DATE,
    42.50, 42.50, 30, 300, 156, true, true, 1),

('MER-003', 'ACCESORIO GRIFO UNIVERSAL', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '115'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    'IMPORTADO', 'Grifo universal para radiador', CURRENT_DATE,
    8.50, 8.50, 100, 1000, 450, true, true, 1),

('MER-004', 'KIT ACCESORIOS RADIADOR', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '116'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'NACIONAL', 'Kit completo de accesorios para radiador', CURRENT_DATE,
    25.00, 25.00, 40, 200, 89, true, true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: MATERIA PRIMA (P)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_unidad, id_categoria, id_div_merca,
    moneda_id, centro_costo_id, procedencia, caracteristicas, fecha,
    precio_unitario, precio_total, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, estado, created_by
) VALUES
('MP-001', 'TUBO ALUMINIO 5/8 X 0.5MM', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'KG.'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '201'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '500'),
    'IMPORTADO', 'Tubo de aluminio 5/8 espesor 0.5mm', CURRENT_DATE,
    3.85, 3.85, 500, 5000, 2350, true, true, 1),

('MP-002', 'TUBO COBRE 1/2 X 0.7MM', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'KG.'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '601'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '500'),
    'IMPORTADO', 'Tubo de cobre 1/2 pulgada espesor 0.7mm', CURRENT_DATE,
    9.25, 9.25, 300, 3000, 1450, true, true, 1),

('MP-003', 'PLANCHA ALUMINIO 1.2MM', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'KG.'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '201'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '500'),
    'IMPORTADO', 'Plancha de aluminio espesor 1.2mm', CURRENT_DATE,
    2.95, 2.95, 800, 8000, 4200, true, true, 1),

('MP-004', 'SOLDADURA PLATA 15%', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'KG.'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '202'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '600'),
    'IMPORTADO', 'Soldadura plata 15% alta resistencia', CURRENT_DATE,
    45.00, 45.00, 50, 500, 245, true, true, 1),

('MP-005', 'EMBALAJE CARTON CORRUGADO', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '208'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '700'),
    'NACIONAL', 'Caja embalaje cartón corrugado', CURRENT_DATE,
    2.50, 2.50, 200, 2000, 850, true, true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: REPUESTOS Y HERRAMIENTAS (R)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_unidad, id_categoria, id_div_merca,
    moneda_id, centro_costo_id, procedencia, caracteristicas, fecha,
    precio_unitario, precio_total, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, ubicacion, estado, created_by
) VALUES
('REP-001', 'RODAMIENTO 6205 SKF', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '501'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '910'),
    'IMPORTADO', 'Rodamiento SKF 6205 alta rotación', CURRENT_DATE,
    15.50, 15.50, 10, 100, 45, true, 'MANTENIMIENTO', true, 1),

('REP-002', 'DISCO CORTE 7 PULG', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '502'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '910'),
    'IMPORTADO', 'Disco de corte 7 pulgadas Norton', CURRENT_DATE,
    3.50, 3.50, 50, 500, 285, true, 'LIMA', true, 1),

('REP-003', 'BROCA HSS 8MM', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '502'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '910'),
    'IMPORTADO', 'Broca acero rápido 8mm', CURRENT_DATE,
    5.00, 5.00, 20, 200, 89, true, 'LIMA', true, 1),

('REP-004', 'FILTRO AIRE COMPRESOR', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '501'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '910'),
    'IMPORTADO', 'Filtro aire para compresor industrial', CURRENT_DATE,
    28.00, 28.00, 5, 50, 18, true, 'MANTENIMIENTO', true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: CONSUMIBLES/VARIOS (V)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_unidad, id_categoria, id_div_merca,
    moneda_id, procedencia, caracteristicas, fecha,
    precio_unitario, precio_total, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, estado, created_by
) VALUES
('VAR-001', 'GUANTES NITRILO CAJA X100', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'CAJ'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'V'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '504'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'NACIONAL', 'Guantes de nitrilo caja x 100 unidades', CURRENT_DATE,
    45.00, 45.00, 10, 100, 42, true, true, 1),

('VAR-002', 'PAPEL TOALLA INDUSTRIAL', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'ROL'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'V'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '504'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'NACIONAL', 'Papel toalla industrial rollo', CURRENT_DATE,
    8.50, 8.50, 50, 500, 234, true, true, 1),

('VAR-003', 'TRAPO INDUSTRIAL X KG', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'KG.'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'V'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '504'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    'NACIONAL', 'Trapo industrial blanco por kilogramo', CURRENT_DATE,
    12.00, 12.00, 30, 300, 145, true, true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: SERVICIOS (S)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_categoria, id_div_merca,
    moneda_id, fecha, precio_venta, afecto_igv, estado, created_by
) VALUES
('SRV-001', 'REPARACION RADIADOR AUTOMOTRIZ', 
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'S'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '131'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    CURRENT_DATE, 85.00, true, true, 1),

('SRV-002', 'MANTENIMIENTO RADIADOR INDUSTRIAL', 
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'S'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '119'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    CURRENT_DATE, 150.00, true, true, 1),

('SRV-003', 'SERVICIO SOLDADURA ESPECIALIZADA', 
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'S'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '131'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    CURRENT_DATE, 120.00, true, true, 1);

-- =====================================================
-- INSERTAR PRODUCTOS - CATEGORÍA: ACTIVO EN ALMACEN (A)
-- =====================================================
INSERT INTO almacen.productos (
    codigo, descripcion, id_unidad, id_categoria, id_div_merca,
    moneda_id, centro_costo_id, procedencia, caracteristicas, fecha,
    precio_unitario, precio_total, stock_minimo, stock_maximo, stock_actual,
    afecto_igv, estado, created_by
) VALUES
('ACT-001', 'COMPRESOR AIRE 5HP', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'A'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '506'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '800'),
    'IMPORTADO', 'Compresor de aire 5HP industrial', CURRENT_DATE,
    1250.00, 1250.00, 1, 5, 2, true, true, 1),

('ACT-002', 'SOLDADORA INVERTER 200A', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'A'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '506'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'USD'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '800'),
    'IMPORTADO', 'Soldadora inverter 200 amperes', CURRENT_DATE,
    850.00, 850.00, 1, 3, 1, true, true, 1),

('ACT-003', 'ESMERIL DE BANCO 8 PULG', 
    (SELECT id_unidades FROM public.unidades_medida WHERE codigo = 'UND'),
    (SELECT id_categoria FROM public.categoria WHERE codigo = 'A'),
    (SELECT id_div_merca FROM public.division_mercaderia WHERE codigo = '506'),
    (SELECT id_moneda FROM contabilidad.cod_moneda WHERE codigo = 'PEN'),
    (SELECT id_c_costo FROM contabilidad.c_costo WHERE codigo = '800'),
    'NACIONAL', 'Esmeril de banco 8 pulgadas', CURRENT_DATE,
    420.00, 420.00, 1, 5, 3, true, true, 1);

CREATE TABLE almacen.configuracion_parrillas (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES almacen.productos(id_producto) ON DELETE CASCADE,
    
    -- ========================
    -- PARRILLA SUPERIOR
    -- ========================
    ps_largo NUMERIC(10,2),
    ps_ancho NUMERIC(10,2),
    ps_espesor NUMERIC(10,2),
    ps_tipo VARCHAR(20) CHECK (ps_tipo IN ('PLANAS', 'EMBUTIDAS')),
    ps_posicion VARCHAR(20) CHECK (ps_posicion IN ('CENTRADA', 'VOLADA', 'FULL')),
    ps_fijacion VARCHAR(20) CHECK (ps_fijacion IN ('EMPERNAR', 'SOLDAR')),
    ps_perforacion VARCHAR(20) CHECK (ps_perforacion IN ('PERFORADA', 'CIEGA')),
    
    -- ========================
    -- PARRILLA INFERIOR
    -- ========================
    pi_largo NUMERIC(10,2),
    pi_ancho NUMERIC(10,2),
    pi_espesor NUMERIC(10,2),
    pi_tipo VARCHAR(20) CHECK (pi_tipo IN ('PLANAS', 'EMBUTIDAS')),
    pi_posicion VARCHAR(20) CHECK (pi_posicion IN ('CENTRADA', 'VOLADA', 'FULL')),
    pi_fijacion VARCHAR(20) CHECK (pi_fijacion IN ('EMPERNAR', 'SOLDAR')),
    pi_perforacion VARCHAR(20) CHECK (pi_perforacion IN ('PERFORADA', 'CIEGA')),
    
    -- ========================
    -- CONFIGURACIONES ADICIONALES
    -- ========================
    tubos_flotantes BOOLEAN DEFAULT false,
    parrilla_intermedia BOOLEAN DEFAULT false,
    
    -- ========================
    -- AUDITORÍA (mismo formato que almacen.productos)
    -- ========================
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ========================
    -- CONSTRAINT: Un producto solo puede tener UNA configuración
    -- ========================
    CONSTRAINT unique_producto_parrilla UNIQUE (producto_id)
);


CREATE INDEX idx_config_parrillas_producto ON almacen.configuracion_parrillas(producto_id);
CREATE INDEX idx_config_parrillas_tipo_ps ON almacen.configuracion_parrillas(ps_tipo);
CREATE INDEX idx_config_parrillas_tipo_pi ON almacen.configuracion_parrillas(pi_tipo);

---------------------------------------------------------------
-- DOCUMENTOS RELACIONADOS CON TIPOS DOCUMENTOS SUNAT (ACTUALIZADO) --
---------------------------------------------------------------
CREATE TABLE public.documentos (
    id_documento SERIAL PRIMARY KEY,
    codigo CHAR(5) UNIQUE NOT NULL,
    nombre VARCHAR(40) NOT NULL,
    siglas VARCHAR(10) NOT NULL,
    nro_serie VARCHAR(2) NOT NULL,
    nro_max_aviso INTEGER NOT NULL,
    correlativo INT DEFAULT 0,
    documento INTEGER REFERENCES public.tipo_documento(id_doc),
    tipo_movimiento VARCHAR(10) CHECK (tipo_movimiento IN ('NO APLICA', 'INGRESO', 'SALIDA')),
    id_sucursal INTEGER REFERENCES public.sucursal(id_sucursal),
    id_documento_sal_ing INTEGER REFERENCES public.documentos(id_documento),
    id_almacen INTEGER REFERENCES almacen.almacenes(id_alm),
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    estado BOOLEAN DEFAULT TRUE
);

-- Insertar documentos básicos primero (sin referencias circulares)
INSERT INTO public.documentos (codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_almacen, id_categoria, estado) VALUES
('GR1', 'GUIA REMIS. SERIE 1', 'GR_01', '1', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '9'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('GR2', 'GUIA REMIS. SERIE 2', 'GR_02', '2', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '9'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('GR3', 'GUIA REMIS. SERIE 3', 'GR_03', '3', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '9'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('GR4', 'GUIA REMIS. SERIE 1', 'GR_04', '1', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '9'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('GR5', 'GUIA REMIS. SERIE 5', 'GR_05', '5', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '9'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '113'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('NI1', 'NOTA ING. PROD.TERM', 'N.ING1', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true);

-- Ahora insertar el resto de documentos
INSERT INTO public.documentos (codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_documento_sal_ing, id_almacen, id_categoria, estado) VALUES
('B001', 'Boleta Serie Nro,1', 'Bol_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '3'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('B002', 'Boleta Serie Nro,2', 'Bol_02', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '3'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('B01', 'Boleta Serie Nro,1', 'Bol_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '3'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('BNC1', 'NOTA CRED. BOL 1', 'NC_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '7'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'NI1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('CTZ', 'Cotizaciones', 'COTIZ.', '0', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '901'), 'NO APLICA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, NULL),
('F001', 'Fact Elec Serie No.1', 'Fct_01', '1', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('F002', 'Fact Elec Serie No.2', 'Fct_02', '1', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('F005', 'Fact Elec Serie No.5', 'Fct_05', '5', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('F01', 'Factura Serie No.1', 'Fct_01', '1', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('F02', 'Factura Serie No.2', 'Fct_02', '2', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR3'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('F05', 'Factura Serie No.5', 'Fct_05', '5', 99999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'GR1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, true),
('FAP', 'FACTURA PROVEEDOR', 'FAP', '1', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, true),
('FPE', 'FACTURA PROVEEDOR EXTERNO', 'FPE', '1', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '1'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, true),
('FNC1', 'NC ELECT. SERIE 1', 'FNC_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '7'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'NI1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('FND1', 'NB ELECT. SERIE 1', 'FND_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '8'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true);

-- Continuar con más documentos...
INSERT INTO public.documentos (codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_documento_sal_ing, id_almacen, id_categoria, estado) VALUES
('IP1', 'Compras.Ext. AURUBIS', 'CE.AUR', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('IP2', 'Compras.Ext. MAT PRI', 'CE.MPR', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('IP3', 'Compras.SUM.DIVERSOS', 'CE.SDV', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '932'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('IP4', 'Compras.Ext.REP.', 'C.ERep', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'NO APLICA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('IP5', 'Compras.Mercade', 'CMER', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '114'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'), true),
('IP6', 'COMPRA ACTIVO FIJO', 'CEXACT', '0', 200000, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'A'), true),
('L/.', 'Letras Forma Contin.', 'LETRAS', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '950'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, NULL),
('MEM', 'Memos Internos', 'Memos', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '961'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, NULL),
('NC1', 'NOTA CRED. SERIE 1', 'NC_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '7'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), (SELECT id_documento FROM public.documentos WHERE codigo = 'NI1'), (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('ND1', 'NOTA DEB. SERIE 1', 'ND_01', '1', 9999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '8'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NI0', 'NOTA ING. INVENTARIO', 'NI.inv', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('NI2', 'NOTA ING. M.PRIMAS', 'N.IMAT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), true),
('NIC', 'N.NGRE. COMPRA LOCAL', 'NICLOC', '1', 999999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '913'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), true),
('NIE', 'NOTA ING. COM EXTER.', 'NICEXT', '0', 999999, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '914'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), true),
('NIH', 'NOTA ING. HERR. RPTO', 'NI.HER', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '501'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'), true),
('NIM', 'NOTA ING. MATERIALES', 'NI.MAT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('NIMER', 'NOTA ING. MERCADERIA', 'NIMER', '0', 10000, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', NULL, NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '114'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'), false),
('NIP', 'NOTA ING. PRODUCCION', 'NI.prd', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '910'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NIR', 'NOTA ING. REGULARIZ.', 'NI.reg', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NIT', 'NOTA ING. TEMPORAL', 'NI.tmp', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NRO', 'COMPROBANTE ACTIVO F', 'ComAct', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '960'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, NULL),
('NS4', 'NOTA SAL. INTERNA4', 'NS_SA4', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('NS5', 'NOTA SALIDA VARIOS', 'NS_VA5', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NSAR', 'NOTA SALIDA REG AREQ', 'NSRA', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', NULL, NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '113'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NSH', 'NOTA SALIDA HERR.REP', 'NS_HER', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '501'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'R'), NULL),
('NSI', 'NOTA SALIDA INTERNA', 'NS_INT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NSM', 'NOTA SALIDA MAT.PRI.', 'NS.mpr', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), true),
('NSMER', 'NOTA DE SALIDA MER', 'NSMER', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '114'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'M'), true),
('NSR', 'NOTA SALIDA REGULRZ.', 'NS_REG', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('NST', 'NOTA SALIDA TRANSF.', 'NS_TRN', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('NSU', 'NOTA SALIDA UTILES', 'NS UTI', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, (SELECT id_categoria FROM public.categoria WHERE codigo = 'V'), NULL),
('NSX', 'NOTA SALIDA MP REG..', 'NS.mpR', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), NULL),
('OCO', 'ORDEN DE COMPRA', 'O.COMP', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '921'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('O/F', 'Orden de Fabricacion', 'O.Fab.', '1', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '904'), 'NO APLICA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('PCO', 'PEDIDOS CONFIR. EXT.', 'PEDCNF', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '932'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, NULL),
('PED', 'PEDIDOS DE CLIENTES', 'PEDID', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '903'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('PEF', 'PEDIDOS FORTALEZA', 'PEDRF', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '903'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('PEI', 'PEDIDOS DE INVENTARI', 'PEDII', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '903'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('PEX', 'PEDIDOS AL EXTERIOR', 'PEDEXT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '931'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), true),
('PNC', 'PRODUCTO NO CONFORME', 'PRNCON', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '911'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '198'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), true),
('PRE', 'PRESTAMOS AL PERSONA', 'PRSPER', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '940'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, NULL, NULL, NULL),
('REQ', 'REQUERIMI. INTERNOS', 'REQINT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '920'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('REX', 'REQUERIM. EXTERIOR', 'REQEXT', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '930'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '201'), NULL, true),
('S/M', 'SEPARAC. MERCADERIA', 'SepMer', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '901'), 'NO APLICA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), NULL, NULL),
('SRV', 'SERV DE REPARACION', 'SRVR', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '903'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL),
('VLZ', 'VALORIZACION', 'VALORZ', '0', 0, 0, (SELECT id_doc FROM public.tipo_documento WHERE codigo = '902'), 'INGRESO', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'), NULL, (SELECT id_alm FROM almacen.almacenes WHERE codigo = '110'), (SELECT id_categoria FROM public.categoria WHERE codigo = 'T'), NULL);

INSERT INTO public.documentos 
(codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_almacen, id_categoria, estado)
VALUES (
    'NI',
    'NOTA DE INGRESO',
    'NI',
    '0',
    99999,
    0,
    NULL,            
    'INGRESO',     
    (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'),
    NULL,
    NULL,             
    TRUE
);

INSERT INTO public.documentos
(codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_documento_sal_ing, id_almacen, id_categoria, estado)
VALUES (
  'NS', 'NOTA DE SALIDA', 'NS', '0', 99999, 0,
  (SELECT id_doc FROM public.tipo_documento WHERE codigo = '912'), 'SALIDA', (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'),
  NULL, NULL, NULL, TRUE);


INSERT INTO public.documentos
(codigo, nombre, siglas, nro_serie, nro_max_aviso, correlativo, documento, tipo_movimiento, id_sucursal, id_documento_sal_ing, id_almacen, id_categoria, estado)
VALUES (
    'NT',
    'NOTA DE TRANSFERENCIA',
    'NT',
    '0',
    99999,
    0,
    NULL,               -- No es documento SUNAT
    'NO APLICA',        -- Clave: ni ingreso ni salida
    (SELECT id_sucursal FROM public.sucursal WHERE codigo = '1'),
    NULL,
    NULL,
    NULL,
    TRUE
);



-------------------------------------------------------------
-- CODIGO DE COMPRAS RELACIONADOS CON TIPO DE DOCUMENTO (ACTUALIZADO) --
-------------------------------------------------------------

CREATE TABLE public.cod_compras (
    id_cod_compras SERIAL PRIMARY KEY,
    codigo CHAR (3) UNIQUE NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    siglas VARCHAR(8),
    referencia VARCHAR(20) CHECK (referencia IN ('SIN REFERENCIA', 'CODIGO ACTIVO FIJO', 'CON ORDEN DE FABR')),
    id_categoria INTEGER REFERENCES public.categoria(id_categoria),
    tipo_comp VARCHAR(10) CHECK (tipo_comp IN ('AMBAS', 'LOCAL', 'IMPORTADA')),
    id_documento_ingreso_alm INTEGER REFERENCES public.documentos(id_documento),
    id_cod_operacion INTEGER REFERENCES public.cod_operacion(id_cod_operacion)
);


INSERT INTO public.cod_compras (codigo, nombre, siglas, referencia, id_categoria, tipo_comp, id_documento_ingreso_alm, id_cod_operacion) VALUES
(201, 'MATERIA PRIMA , O/F', 'MATPRI', 'CON ORDEN DE FABR', (SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), 'LOCAL',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'), (SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '201')),
(202, 'MATERIAL AUX, O/F', 'MATAUX', 'CON ORDEN DE FABR',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),'LOCAL', (SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '202')),
(203, 'SUMINIST.DIVER.O/F', 'SUMDIV', 'CON ORDEN DE FABR',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'), 'LOCAL',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '122')),
(204, 'MATERIA PRIMA', 'MATPRI', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),'IMPORTADA',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '201')),
(205, 'EPP', 'EPP', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),'LOCAL',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '122')),
(206, 'SUMINISTROS DIV', 'SUMDIV', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),'IMPORTADA',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '122')),
(207, 'MERCADERIAS', 'MER', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'M'),'IMPORTADA',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '106')),
(208, 'ENVASE Y EMBALAJE', 'ENVEMB', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'P'),'AMBAS',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '113')),
(501, 'REPUESTO HERRAMIENTA', 'REPHER', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'R'),'IMPORTADA',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIH'), (SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '501')),
(502, 'UTILES DE OFICINA', 'UTIOFC', 'SIN REFERENCIA',(SELECT id_categoria FROM public.categoria WHERE codigo = 'V'),'AMBAS',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIC'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '121')),
(503, 'ACTIVOS', 'ACTIVO', 'CODIGO ACTIVO FIJO',(SELECT id_categoria FROM public.categoria WHERE codigo = 'A'),'AMBAS',(SELECT  id_documento FROM public.documentos WHERE codigo = 'NIE'),(SELECT id_cod_operacion FROM public.cod_operacion WHERE codigo = '114'));

---------------------------------------------------------------------------------------
-------------MODULO DE COMPRAS SE RELACIONA CON TIPO DE DOCUMENTO, PAISES (ACTUALIZADO) --
----------------------------------------------------------------------------------------

CREATE TABLE compras.proveedores (
    id_prov SERIAL PRIMARY KEY, 
    codigo VARCHAR(15) UNIQUE NOT NULL,
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nomb_comercial VARCHAR(200) NOT NULL,
    id_pais INTEGER REFERENCES public.paises(id),
    direccion TEXT,
    email VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE,
    contacto VARCHAR(100) NOT NULL,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    telefono1 VARCHAR(20),
    telefono2 VARCHAR(20),
    celular1 VARCHAR(20),
    celular2 VARCHAR(20),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTAR PROVEEDORES DE EJEMPLO

-- Proveedor Nacional con RUC
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, telefono2, celular1, 
    created_by
) VALUES (
    'PROV001', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20123456789', 
    'DISTRIBUIDORA INDUSTRIAL SAC', 
    'DISINSA', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Av. Argentina 1234, Cercado de Lima', 
    'ventas@disinsa.com.pe', 
    'Luis Ramírez',
    '01-4567890', 
    '01-4567891', 
    '987654321', 
    1 -- Usuario superadmin
);

-- Proveedor Nacional con RUC - Materias Primas
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV002', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20987654321', 
    'METALÚRGICA ANDINA EIRL', 
    'METANDINA', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Jr. Los Metales 456, San Juan de Lurigancho', 
    'compras@metandina.com',
    'Luis Ramírez',
    '01-3456789', 
    '956789123', 
    1
);

-- Proveedor Internacional - Estados Unidos
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV003', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '0'), -- OTROS
    'TAX12345678', 
    'ALUMINUM SUPPLY CORPORATION', 
    'ALSUPPLY CORP', 
    (SELECT id FROM public.paises WHERE codigo = 'USA'), -- Estados Unidos
    '1234 Industrial Blvd, Houston TX 77001', 
    'international.sales@aluminumsupplycorporation.com', 
    'Luis Ramírez',
    '+1-713-555-0123', 
    '+1-713-555-0124', 
    1
);

-- Proveedor Nacional con DNI - Persona Natural
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV004', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), -- DNI
    '12345678', 
    'JUAN CARLOS MENDOZA SILVA', 
    'SERVICIOS TÉCNICOS JCM', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Calle Las Flores 789, Surco, Lima', 
    'juancarlos.mendoza.servicios@gmail.com', 
    'Luis Ramírez',
    '01-2345678', 
    '945678912', 
    1
);

-- Proveedor Nacional - Repuestos y Herramientas
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, telefono2, celular1, 
    created_by
) VALUES (
    'PROV005', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20456789123', 
    'FERRETERÍA INDUSTRIAL DEL PERÚ SOCIEDAD ANÓNIMA', 
    'FERRINPERU SA', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Av. Colonial 2567, Callao', 
    'ventas.corporativas@ferreteriainindustrialdelperu.com.pe', 
    'Luis Ramírez',
    '01-5678901', 
    '01-5678902', 
    '923456789', 
    1
);

-- Proveedor Internacional - Brasil
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV006', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '0'), -- OTROS
    'CNPJ12345678', 
    'INDUSTRIAS METALÚRGICAS BRASILEIRAS LIMITADA', 
    'IMETAL BRASIL LTDA', 
    (SELECT id FROM public.paises WHERE codigo = 'BRA'), -- Brasil
    'Rua Industrial 567, São Paulo - SP, CEP 01234-567', 
    'vendas.internacionais@industriasmetalurgicasbrasileiras.com.br', 
    'Luis Ramírez',
    '+55-11-3456-7890', 
    '+55-11-98765-4321', 
    1
);

-- Proveedor Nacional - Suministros Diversos
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV007', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20789123456', 
    'SUMINISTROS Y EQUIPOS INDUSTRIALES SOCIEDAD ANÓNIMA CERRADA', 
    'SUMEQUIP SAC', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Av. Universitaria 3456, Los Olivos, Lima', 
    'gerencia.comercial@suministrosyequiposindustriales.com.pe', 
    'Luis Ramírez',
    '01-7890123', 
    '912345678', 
    1
);

-- Proveedor Internacional - Chile
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto,  telefono1, celular1, 
    created_by
) VALUES (
    'PROV008', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '0'), -- OTROS
    'RUT12345678-9', 
    'COMERCIAL ANDINA CHILE LIMITADA', 
    'COMANDINA LTDA', 
    (SELECT id FROM public.paises WHERE codigo = 'CHL'), -- Chile
    'Av. Providencia 1234, Santiago, Región Metropolitana', 
    'exportaciones@comercialandinachile.cl', 
    'Luis Ramírez',
    '+56-2-2345-6789', 
    '+56-9-8765-4321', 
    1
);

-- Proveedor Nacional - Servicios Especializados
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto,  telefono1, telefono2, celular1, celular2,
    created_by
) VALUES (
    'PROV009', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20321654987', 
    'SERVICIOS TÉCNICOS ESPECIALIZADOS SOCIEDAD ANÓNIMA', 
    'SERTECESP SA', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Jr. Tecnología 890, Ate Vitarte, Lima', 
    'coordinacion.servicios@serviciostecnicosespecializados.com.pe', 
    'Luis Ramírez',
    '01-8901234', 
    '01-8901235', 
    '934567890', 
    '945678901',
    1
);

-- Proveedor Nacional - Transporte y Logística
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV010', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20147258369', 
    'TRANSPORTES RÁPIDOS DEL SUR EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA', 
    'TRANSUR EIRL', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Av. Panamericana Sur Km 15.5, Villa El Salvador, Lima', 
    'operaciones.lima@transportesrapidosdelsur.com.pe', 
    'Luis Ramírez',
    '01-9012345', 
    '967890123', 
    1
);
			
-- Proveedor Internacional - Colombia
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, celular1, 
    created_by
) VALUES (
    'PROV011', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '0'), -- OTROS
    'NIT900123456', 
    'METALES Y ALEACIONES COLOMBIANAS SOCIEDAD ANÓNIMA', 
    'METACOL SA', 
    (SELECT id FROM public.paises WHERE codigo = 'COL'), -- Colombia
    'Calle 72 No. 10-34, Bogotá D.C.', 
    'ventas.internacionales@metalesyaleacionescolombianas.com.co', 
    'Luis Ramírez',
    '+57-1-234-5678', 
    '+57-300-123-4567', 
    1
);

-- Proveedor Nacional - Químicos y Soldaduras
INSERT INTO compras.proveedores (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, contacto, telefono1, telefono2, celular1, 
    created_by
) VALUES (
    'PROV012', 
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), -- RUC
    '20852741963', 
    'PRODUCTOS QUÍMICOS INDUSTRIALES DEL PERÚ SOCIEDAD ANÓNIMA CERRADA', 
    'PROQUIMSA', 
    (SELECT id FROM public.paises WHERE codigo = 'PER'), -- Perú
    'Av. Las Torres 456, Independencia, Lima', 
    'ventas.especializadas@productosquimicosindustrialesdelperu.com.pe', 
    'Luis Ramírez',
    '01-6547890', 
    '01-6547891', 
    '998877665', 
    1
);

CREATE TABLE contabilidad.cuentas_bancarias_prov (
    id_cuenta SERIAL PRIMARY KEY,
    id_prov INTEGER NOT NULL REFERENCES compras.proveedores(id_prov),
    id_bancos INTEGER NOT NULL REFERENCES public.bancos(id_bancos),
    direccion VARCHAR(150),
    id_moneda INTEGER REFERENCES contabilidad.cod_moneda(id_moneda),
    numero_cuenta VARCHAR(50) NOT NULL,
    cta_interbancaria VARCHAR(50),
    codigo_swift VARCHAR(20),
    codigo_aba VARCHAR(20),
    id_pais INTEGER REFERENCES public.paises(id),
    estado BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




--------------------------------------------------------------------
----- REQUERIMIENTO TIENE RELACION CON CODIGO DE COMPRA, TABLA DE 
--DOCUMENTOS Y TIPO DE DOCUMENTO SUNAT (ACTUALIZADO) ----
------------------------------------------------------------------
CREATE TABLE compras.requerimientos_compra (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL,
    id_documento INTEGER REFERENCES public.documentos(id_documento),
    fecha DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL DEFAULT 'INTERNO'
        CHECK (tipo IN ('INTERNO', 'EXTERNO')),
    solicitante_id INTEGER REFERENCES public.usuarios(id),
    id_cod_compras INTEGER REFERENCES public.cod_compras(id_cod_compras),
    fecha_entrega DATE NOT NULL,
    proposito VARCHAR(20) DEFAULT 'COMPRA'
        CHECK (proposito IN ('COMPRA', 'PRODUCCION', 'MANTENIMIENTO')),
    prioridad VARCHAR(10) DEFAULT 'NORMAL' 
        CHECK (prioridad IN ('NORMAL', 'URGENTE')),
    centro_costo_id INTEGER REFERENCES contabilidad.c_costo(id_c_costo),
    total_cantidad_solicitada DECIMAL(12, 3) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PROCESADO')), --FALTA ANULADO
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para acelerar búsquedas por numero
CREATE INDEX idx_requerimientos_compra_numero
    ON compras.requerimientos_compra (numero);

-- Crear unique combinado por (tipo, numero)
ALTER TABLE compras.requerimientos_compra 
ADD CONSTRAINT requerimientos_compra_tipo_numero_key UNIQUE (tipo, numero);



CREATE TABLE compras.requerimientos_compra_detalle (
    id SERIAL PRIMARY KEY,
    requerimiento_id INTEGER NOT NULL REFERENCES compras.requerimientos_compra(id) ON DELETE CASCADE,
    numitem INTEGER NOT NULL,
    producto_codigo VARCHAR(50) NOT NULL REFERENCES almacen.productos(codigo),
    cantidad_solicitada DECIMAL(12, 3) NOT NULL,
    stock_actual DECIMAL(12, 3) DEFAULT 0.00,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requerimiento_id, numitem)
);

CREATE TABLE ventas.puntos_partida(
    id_partida SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    direccion TEXT NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- TABLA DE ORDENES DE COMPRA COMPLETA (ACTUALIZADA) --
CREATE TABLE compras.orden_compra (
    id SERIAL PRIMARY KEY,
    id_documento INTEGER NOT NULL REFERENCES public.documentos(id_documento),
    numero VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    fecha_entrega_prevista DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL DEFAULT 'LOCAL'
        CHECK (tipo IN ('LOCAL', 'EXTERNO')),
    proveedor_id INTEGER NOT NULL REFERENCES compras.proveedores(id_prov),
    direccion VARCHAR(200),
    moneda_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
    tipo_cambio DECIMAL(12, 4) DEFAULT 1.0,
    forma_pago INTEGER NOT NULL REFERENCES contabilidad.formas_pago(id),
    plazo_entrega VARCHAR(100),
    lugar_entrega INTEGER REFERENCES ventas.puntos_partida(id_partida),
    sub_total DECIMAL(12, 2) DEFAULT 0.00,
    igv_id INTEGER REFERENCES public.igv(id) DEFAULT 1,
    igv DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) DEFAULT 0.00,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'ENTREGADA', 'EN FACTURACIÓN', 'CERRADA', 'ANULADA')),
    observaciones TEXT,
    aduana_id INTEGER REFERENCES public.cod_aduana(id_aduana),
    incoterm_id INTEGER REFERENCES public.incoterms(id),
    medio_transporte_id INTEGER REFERENCES public.medios_transporte(id),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--ALTER TABLE compras.orden_compra DROP COLUMN requerimiento_id;

-- Crear índice para acelerar búsquedas por numero
CREATE INDEX idx_orden_compra_numero
    ON compras.orden_compra (numero);

-- Constraint UNIQUE para evitar duplicados dentro del mismo documento
ALTER TABLE compras.orden_compra 
ADD CONSTRAINT orden_compra_documento_numero_unique 
UNIQUE (id_documento, numero);


/*TRIGGER PARA CALCULAR IGV Y TOTAL EN ORDEN_COMPRA (CABECERA)*/
CREATE OR REPLACE FUNCTION compras.calcular_igv_total()
RETURNS TRIGGER AS $$
DECLARE
    igv_porcentaje DECIMAL(5,2);
BEGIN
    -- Si el tipo es EXTERNO, no modificar IGV ni TOTAL
    IF NEW.tipo = 'EXTERNO' THEN
        IF NEW.igv IS NULL THEN
            NEW.igv = 0;
        END IF;
        IF NEW.total IS NULL THEN
            NEW.total = NEW.sub_total;
        END IF;
        RETURN NEW;
    END IF;

    -- Para órdenes LOCAL, sí se aplica el cálculo normal
    SELECT porcentaje INTO igv_porcentaje 
    FROM public.igv 
    WHERE id = NEW.igv_id;

    NEW.igv = NEW.sub_total * (igv_porcentaje / 100);
    NEW.total = NEW.sub_total + NEW.igv;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_calcular_igv_total
    BEFORE INSERT OR UPDATE ON compras.orden_compra
    FOR EACH ROW
    EXECUTE FUNCTION compras.calcular_igv_total();




-- DETALLE DE ORDEN DE COMPRA --
CREATE TABLE compras.orden_compra_detalle (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL REFERENCES compras.orden_compra(id) ON DELETE CASCADE,
    numitem INTEGER NOT NULL,
    producto_codigo VARCHAR(50) NOT NULL REFERENCES almacen.productos(codigo),
    cantidad_solicitada DECIMAL(12, 3) NOT NULL,
    cantidad_recibida DECIMAL(12, 3) DEFAULT 0.00,
    precio_unitario DECIMAL(12, 4) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0.00,
    descuento_monto DECIMAL(12, 2) DEFAULT 0.00,
    valor_venta DECIMAL(12, 2) DEFAULT 0.00,
    igv DECIMAL(12, 2) DEFAULT 0.00,
    precio_total DECIMAL(12, 2) DEFAULT 0.00,
    linea_cerrada BOOLEAN NOT NULL DEFAULT FALSE,  -- para producto que no va a llegar o se recpcionó cierta cantidad
    centro_costo_id INTEGER REFERENCES contabilidad.c_costo(id_c_costo),
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(orden_compra_id, numitem)
);

ALTER TABLE compras.orden_compra_detalle
ADD COLUMN requerimiento_id INTEGER REFERENCES compras.requerimientos_compra(id); /*opcional*/

ALTER TABLE compras.orden_compra_detalle
ADD COLUMN requerimiento_detalle_id INTEGER REFERENCES compras.requerimientos_compra_detalle(id);

/*TRIGGER PARA CALCULAR IGV POR ITEM*/
CREATE OR REPLACE FUNCTION compras.calcular_detalle_igv()
RETURNS TRIGGER AS $$
DECLARE
    igv_porcentaje DECIMAL(5,2);
    subtotal_item DECIMAL(12,2);
    tipo_orden VARCHAR(10);
BEGIN
    -- Obtener tipo de la orden
    SELECT tipo, i.porcentaje INTO tipo_orden, igv_porcentaje
    FROM compras.orden_compra oc
    LEFT JOIN public.igv i ON oc.igv_id = i.id
    WHERE oc.id = NEW.orden_compra_id;

    subtotal_item := NEW.cantidad_solicitada * NEW.precio_unitario;

    IF NEW.descuento_porcentaje > 0 THEN
        NEW.descuento_monto := subtotal_item * (NEW.descuento_porcentaje / 100);
    END IF;

    subtotal_item := subtotal_item - COALESCE(NEW.descuento_monto, 0);
    NEW.valor_venta := subtotal_item;

    -- Si es EXTERNO → IGV en 0
    IF tipo_orden = 'EXTERNO' THEN
        NEW.igv := 0;
        NEW.precio_total := subtotal_item;
    ELSE
        NEW.igv := subtotal_item * (igv_porcentaje / 100);
        NEW.precio_total := subtotal_item + NEW.igv;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_detalle_igv
BEFORE INSERT OR UPDATE ON compras.orden_compra_detalle
FOR EACH ROW
EXECUTE FUNCTION compras.calcular_detalle_igv();



/*TRIGGER PARA ACTUALIZAR RESUMEN EN CABECERA*/
CREATE OR REPLACE FUNCTION compras.actualizar_totales_orden()
RETURNS TRIGGER AS $$
DECLARE
    tipo_orden VARCHAR(10);
BEGIN
    SELECT tipo INTO tipo_orden
    FROM compras.orden_compra
    WHERE id = NEW.orden_compra_id;

    UPDATE compras.orden_compra
    SET 
        sub_total = COALESCE((
            SELECT SUM(valor_venta)
            FROM compras.orden_compra_detalle
            WHERE orden_compra_id = NEW.orden_compra_id
        ), 0),
        igv = CASE 
            WHEN tipo_orden = 'EXTERNO' THEN 0
            ELSE COALESCE((
                SELECT SUM(igv)
                FROM compras.orden_compra_detalle
                WHERE orden_compra_id = NEW.orden_compra_id
            ), 0)
        END,
        total = CASE 
            WHEN tipo_orden = 'EXTERNO' THEN COALESCE((
                SELECT SUM(valor_venta)
                FROM compras.orden_compra_detalle
                WHERE orden_compra_id = NEW.orden_compra_id
            ), 0)
            ELSE COALESCE((
                SELECT SUM(precio_total)
                FROM compras.orden_compra_detalle
                WHERE orden_compra_id = NEW.orden_compra_id
            ), 0)
        END
    WHERE id = NEW.orden_compra_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


/*ELIMINAR DATOS DE LA TABLA, QUE EMPIECE POR EL ID 1*/
/*TRUNCATE TABLE 
    compras.orden_compra,
    compras.orden_compra_detalle,
    compras.requerimientos_compra,
    compras.requerimientos_compra_detalle 
RESTART IDENTITY CASCADE;*/


CREATE TABLE compras.orden_compra_requerimientos (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL REFERENCES compras.orden_compra(id) ON DELETE CASCADE,
    requerimiento_id INTEGER NOT NULL REFERENCES compras.requerimientos_compra(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(orden_compra_id, requerimiento_id)
);

CREATE TABLE contabilidad.facturas_proveedor (
    -- Campos base
    id SERIAL PRIMARY KEY,
    documento_id INTEGER NOT NULL REFERENCES public.documentos(id_documento), -- PARA LOCAL ES FAP Y PARA EXTERNO ES FPE
    numero VARCHAR(20) NOT NULL, -- numero del documento 9 dígitos
    orden_compra_id INTEGER NOT NULL REFERENCES compras.orden_compra(id),
    proveedor_id INTEGER NOT NULL REFERENCES compras.proveedores(id_prov), --jala dato de la orden de compra
    direccion VARCHAR(200), --JALA DEL PROVEEDOR
    tipo_compra VARCHAR(10) NOT NULL CHECK (tipo_compra IN ('LOCAL', 'EXTERNO')),
    
    -- Datos de la factura
    tipo_doc VARCHAR(30)
        CHECK (tipo_doc IN (
            'Factura', 'Boleta de Venta', 'Nota de Crédito', 'Nota de Débito', 'Formular Declaración')), -- para local
    serie VARCHAR(10), -- para local
    numero_fac VARCHAR(20), -- para local


    fecha_emision DATE NOT NULL, -- para ambos local y externo
    fecha_vencimiento DATE NOT NULL, -- para ambos local y externo
    
    -- Datos monetarios que jalan de LA ORDEN DE COMPRA
    moneda_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda), -- local y externo
    forma_pago_id INTEGER REFERENCES contabilidad.formas_pago(id), -- local y externo
    subtotal DECIMAL(12, 2) NOT NULL, -- local y externo
    igv DECIMAL(12, 2), -- para local
    total DECIMAL(12, 2) NOT NULL, -- local y externo


    -- tipo cambio (PARA AMBOS LOCAL Y EXTERNO)
    tipo_cambio_id INTEGER REFERENCES contabilidad.tipo_cambio(id),
    tipo_cambio DECIMAL(12, 4) NOT NULL, --jala de la tabla tipo_cambio (compra) de acuerdo con la fecha de emisión.
    
    -- Campos específicos para EXTERNO
    numero_invoice VARCHAR(50), -- Factura o documento
    fecha_llegada DATE,
    incoterm_id INTEGER REFERENCES public.incoterms(id), -- jala de orden de compra externo
    medio_transporte_id INTEGER REFERENCES public.medios_transporte(id), -- jala de orden de compra externo
    aduana_id INTEGER REFERENCES public.cod_aduana(id_aduana), -- jala de orden de compra externo
    importe_fob DECIMAL(12, 2) DEFAULT 0.00,
    flete DECIMAL(12, 2) DEFAULT 0.00,
    seguro DECIMAL(12, 2) DEFAULT 0.00,
    otros_gastos DECIMAL(12, 2) DEFAULT 0.00,
    importe_cif DECIMAL(12, 2) DEFAULT 0.00,
    importe_moneda_prov DECIMAL(12, 2) DEFAULT 0.00, -- importe moneda dolares
    importe_soles DECIMAL(12, 2) DEFAULT 0.00, -- conversión a soles (calculo con tipo de cambio)

    -- Datos bancarios (ambos local y externo, y jala del proveedor de la orden de compra)
    -- Datos bancarios (ambos local y exterior)
    banco_id INTEGER REFERENCES public.bancos(id_bancos),
    cuenta_bancaria VARCHAR(50),
    cuenta_interbancaria VARCHAR(50),
    swift VARCHAR(20),
    direccion_banco VARCHAR(200),

    -- Campos específicos para tipo compra LOCAL
    guia_remision VARCHAR(50),
    detraccion DECIMAL(12, 2) DEFAULT 0.00,
    retencion DECIMAL(12, 2) DEFAULT 0.00,
    fecha_guia_remision DATE,
    
    -- Campos comunes
    comentario TEXT,
    archivo_factura TEXT,
    estado VARCHAR(20) DEFAULT 'REGISTRADA' 
        CHECK (estado IN ('REGISTRADA', 'OBSERVADA', 'PAGADA', 'ANULADA')),
    
    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES public.usuarios(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES public.usuarios(id)
);

-- numero de documento para cada tipo de documento
ALTER TABLE contabilidad.facturas_proveedor
ADD CONSTRAINT facturas_proveedor_tipo_numero_key UNIQUE (tipo_compra, numero);

CREATE TABLE contabilidad.facturas_proveedor_detalle (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL REFERENCES contabilidad.facturas_proveedor(id) ON DELETE CASCADE,
    orden_compra_id INTEGER REFERENCES compras.orden_compra(id),
    orden_compra_detalle_id INTEGER REFERENCES compras.orden_compra_detalle(id),
    numitem INTEGER NOT NULL,
    producto_codigo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    unidad_medida VARCHAR(20),
    cantidad_solicitada NUMERIC(18,3),   -- jala orden de compra detalle
    cantidad_recibida NUMERIC(18,3),     -- jala orden de compra detalle
    cantidad_facturada NUMERIC(18,3) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL, -- jala orden de compra detalle
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0,  -- jala orden de compra detalle
    valor_venta NUMERIC(18,2) NOT NULL,
    igv NUMERIC(18,2),  -- campo para ordenes de compra local
    precio_total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contabilidad.gastos_importacion (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL
        REFERENCES compras.orden_compra(id)
        ON DELETE CASCADE,
    tipo_gasto VARCHAR(50) NOT NULL,  -- Ej: FLETE, SEGURO, ADUANA, ALMACENAJE, TRANSPORTE LOCAL, ETC.
    proveedor_id INTEGER 
        REFERENCES compras.proveedores(id_prov), -- Quien emite la factura del gasto
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL,
    moneda_id INTEGER NOT NULL 
        REFERENCES contabilidad.cod_moneda(id_moneda),
    tipo_cambio DECIMAL(12, 4) DEFAULT 1.0, -- Si es en moneda extranjera
    facturado BOOLEAN DEFAULT FALSE,
    pagado BOOLEAN DEFAULT FALSE,
    documento_id INTEGER 
        REFERENCES public.documentos(id_documento), -- Ej: Factura, Boleta, etc.   
    numero_documento VARCHAR(30), -- Número de la factura o boleta 
    fecha_emision DATE,
    fecha_vencimiento DATE,
    comentario TEXT,
    archivo_comprobante TEXT, -- Ruta del PDF, imagen, etc.
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER REFERENCES public.usuarios(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES public.usuarios(id)
);


--SE PUEDE EJECUTARRR-----------


 CREATE TABLE ventas.vendedores(
    id_vendedor SERIAL PRIMARY KEY,
    codigo CHAR(3) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    siglas VARCHAR(10),
    con_contado DECIMAL(12,2) DEFAULT 0.00,
    con_credito DECIMAL(12,2) DEFAULT 0.00,
    con_cobranza DECIMAL(12,2) DEFAULT 0.00,
    estado BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

 CREATE TABLE ventas.transportistas(
    id_transportista SERIAL PRIMARY KEY,
    codigo VARCHAR(15) UNIQUE NOT NULL,
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nomb_comercial VARCHAR(200) NOT NULL,
    id_pais INTEGER REFERENCES public.paises(id),
    direccion TEXT,
    email VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    telefono1 VARCHAR(20),
    telefono2 VARCHAR(20),
    celular1 VARCHAR(20),
    celular2 VARCHAR(20),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


 
CREATE TABLE ventas.vehiculos(
    id_vehiculo SERIAL PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,
    marca VARCHAR(20) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio_fabricacion INTEGER CHECK (anio_fabricacion >= 1900 AND anio_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE)),
    combustible VARCHAR(20) CHECK (combustible IN ('Gasolina', 'Diesel', 'Gas Natural', 'Gas Lic Petroleo', 'Otros')),
    carroceria VARCHAR(20) CHECK (carroceria IN ('Camión', 'Bus', 'Furgoneta', 'Sedán', 'Pickup', 'SUV', 'Van', 'Otro')),
    tipo_transmision VARCHAR(20) CHECK (tipo_transmision IN ('Mecanico', 'Automatico')),
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE ventas.clientes(
    id_cliente SERIAL PRIMARY KEY,
    codigo VARCHAR(15) UNIQUE NOT NULL,
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) UNIQUE NOT NULL,
    vendedor_id INTEGER REFERENCES ventas.vendedores(id_vendedor),
    razon_social VARCHAR(200) NOT NULL,
    nomb_comercial VARCHAR(200) NOT NULL,
    id_pais INTEGER REFERENCES public.paises(id),
    direccion TEXT,
    email VARCHAR(100),
    estado BOOLEAN DEFAULT TRUE,
    fecha_registro DATE DEFAULT CURRENT_DATE,
    telefono1 VARCHAR(20),
    telefono2 VARCHAR(20),
    celular1 VARCHAR(20),
    celular2 VARCHAR(20),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ventas.clientes 
ADD COLUMN id_departamento INTEGER REFERENCES public.departamentos(id),
ADD COLUMN id_distrito INTEGER REFERENCES public.distritos(id);

CREATE TABLE ventas.info_financiera_clientes (
    id_info_financiera SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES ventas.clientes(id_cliente),
    
    -- CONDICIONES FINANCIERAS
    linea_credito DECIMAL(12, 2) DEFAULT 0.00,
    tasa_interes DECIMAL(5, 2) DEFAULT 0.00,
    forma_pago_id INTEGER REFERENCES contabilidad.formas_pago(id),
    descuento_1 DECIMAL(5, 2) DEFAULT 0.00,
    descuento_2 DECIMAL(5, 2) DEFAULT 0.00,
    cuenta_detraccion VARCHAR(20),
    
    -- AUDITORÍA
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	estado BOOLEAN DEFAULT TRUE,
    
    -- CONSTRAINTS
    UNIQUE(id_cliente)
);

CREATE TABLE public.empresa (
    id_empresa SERIAL PRIMARY KEY,
    codigo VARCHAR(15) UNIQUE NOT NULL,
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(100),
    direccion TEXT
);

INSERT INTO empresa (codigo, id_documento, nro_documento, razon_social, direccion) VALUES
('10163641', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6') , '20101636411', 'RADIADORES FORTALEZA S.A.', 'Av. Separadora Industrial, Ate 15023');


CREATE TABLE personal (
    id_personal SERIAL PRIMARY KEY,
    codigo INTEGER UNIQUE NOT NULL, -- Código interno (10000000)
    id_empresa INTEGER REFERENCES public.empresa(id_empresa) DEFAULT 1,
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) UNIQUE NOT NULL, 
    nombre_completo VARCHAR(100) NOT NULL,
    direccion VARCHAR(100) NOT NULL
);

-- Secuencia para codigo
CREATE SEQUENCE personal_codigo_seq START 10000001; -- Comenzar desde tu número actual

-- Trigger para autoincrementar
CREATE OR REPLACE FUNCTION generar_codigo_personal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.codigo := NEXTVAL('personal_codigo_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_personal
    BEFORE INSERT ON personal
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_personal();

-- Personal con DNI (Tipo documento '1')
INSERT INTO personal (
    id_documento, 
    nro_documento, 
    nombre_completo, 
    direccion
) VALUES (
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'),
    '44825098',
    'VILLODAS TORRES JUAN CARLOS',
    'AV. NICOLAS AYLLON Nro. 2185 AAHH. LA'
);

-- Personal con Carnet de Extranjería (Tipo documento '4')
INSERT INTO personal (
    id_documento, 
    nro_documento, 
    nombre_completo, 
    direccion
) VALUES (
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '4'),
    'X12345678',
    'SMITH JOHN DOE',
    'Av. Lima 123'
);

-- Personal con Pasaporte (Tipo documento '7')
INSERT INTO personal (
    id_documento, 
    nro_documento, 
    nombre_completo, 
    direccion
) VALUES (
    (SELECT id FROM public.tipo_documento_id WHERE codigo = '7'),
    'AB123456',
    'GARCIA PEREZ MARIA',
    'Jr. Union 456'
);


SELECT 
    id_personal,
    codigo,
    nombre_completo,
    nro_documento,
    (SELECT nombre FROM public.tipo_documento_id WHERE id = personal.id_documento) as tipo_documento
FROM personal;


-- Tabla choferes ajustada
CREATE TABLE ventas.choferes (
    id_chofer SERIAL PRIMARY KEY,
    codigo VARCHAR(15) UNIQUE NOT NULL,

    -- Información personal del chofer
    id_documento INTEGER REFERENCES public.tipo_documento_id(id),
    nro_documento VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    
    -- SELECCIÓN POR TIPO
    tipo_pertenencia VARCHAR(15) NOT NULL CHECK (tipo_pertenencia IN ('PERSONAL', 'TRANSPORTISTA', 'CLIENTE')),
    
    -- Relaciones según el tipo seleccionado
    id_personal INTEGER REFERENCES public.personal(id_personal), -- Para personal interno
    id_transportista INTEGER REFERENCES ventas.transportistas(id_transportista),
    id_cliente INTEGER REFERENCES ventas.clientes(id_cliente),
    
    -- Información de la empresa (se completa automáticamente según el tipo)
    empresa_documento VARCHAR(20), -- RUC/DNI de la empresa/cliente/transportista
    empresa_razon_social VARCHAR(200), -- Razón social o nombre
    
    -- Información de contacto
	cod_chofer INTEGER UNIQUE NOT NULL, -- 001
    direccion TEXT,
    id_pais INTEGER REFERENCES public.paises(id),

    -- Información de licencia
    nro_licencia VARCHAR(20),
    
    -- Estado y auditoría
    estado BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints para validar según el tipo seleccionado
    CONSTRAINT chk_chofer_tipo_valido CHECK (
        (tipo_pertenencia = 'PERSONAL' AND id_personal IS NOT NULL AND id_transportista IS NULL AND id_cliente IS NULL) OR
        (tipo_pertenencia = 'TRANSPORTISTA' AND id_personal IS NULL AND id_transportista IS NOT NULL AND id_cliente IS NULL) OR
        (tipo_pertenencia = 'CLIENTE' AND id_personal IS NULL AND id_transportista IS NULL AND id_cliente IS NOT NULL)
    )
);

-- Secuencia para cod_chofer (comienza en 1)
CREATE SEQUENCE ventas.cod_chofer_seq START 1;

-- Trigger para autoincrementar cod_chofer
CREATE OR REPLACE FUNCTION ventas.generar_cod_chofer()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cod_chofer := NEXTVAL('ventas.cod_chofer_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_cod_chofer
    BEFORE INSERT ON ventas.choferes
    FOR EACH ROW
    EXECUTE FUNCTION ventas.generar_cod_chofer();


CREATE TABLE ventas.cotizacion_cliente (
    id_cotizacion SERIAL PRIMARY KEY,

    -- INFORMACION DEL DOCUMENTO
    id_documento INTEGER NOT NULL REFERENCES public.documentos(id_documento), --automaticamente el tipo de documentyo es CTZ UE ES DE COTIZACIONES ME ENTEINDES 
    numero VARCHAR(20) UNIQUE NOT NULL,--QUE SEA AUTO IMCREMENTABLE DESDE 00000001
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    -- DATOS DEL CLIENTE 
    id_cliente INTEGER NOT NULL REFERENCES ventas.clientes(id_cliente),
    codigo_cliente VARCHAR(15) NOT NULL,
    nro_documento_cliente VARCHAR(20) NOT NULL,
    razon_social_cliente VARCHAR(200) NOT NULL,
    direccion_cliente TEXT,
    telefono_cliente VARCHAR(20),
    vendedor VARCHAR(100),

    -- DATOS COMERCIALES
    moneda_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
    tipo_cambio_id INTEGER REFERENCES contabilidad.tipo_cambio(id),
    tipo_cambio DECIMAL(12, 4) NULL, --mono del cambio del dolar de venta 
    forma_pago INTEGER NOT NULL REFERENCES contabilidad.formas_pago(id),

    reparacion BOOLEAN DEFAULT FALSE,
    prioridad VARCHAR(30) NOT NULL DEFAULT 'NORMAL' 
        CHECK(prioridad IN ('NORMAL', 'URGENTE', 'STOCK URGENTE', 'STOCK NORMAL')),

    comentario TEXT,
    
    -- CÁLCULOS FINANCIEROS
    importe_bruto DECIMAL(12, 2) DEFAULT 0.00, -- SUMA DEL PRECIO BRUTO DE TABLA DE DETALLES 
    monto_descuento DECIMAL(12, 2) DEFAULT 0.00, -- SUMA DE DESCUENTO DE LA TABLA DE DETALLES
    valor_venta DECIMAL(12, 2) DEFAULT 0.00, -- VALOR VENTA LA SUMA DEL MONTO TOTAL DE LA TABLA DE DETALLES COTIZACIÓN  (RESULTADO= IMPORTE BRUTO - DESCUENTO)
    linea_credito DECIMAL(12, 2) DEFAULT 0.00, -- Línea de crédito disponible
    igv_id INTEGER REFERENCES public.igv(id) DEFAULT 1, -- JALA ID DE TABLA IGV
    igv DECIMAL(12, 2) DEFAULT 0.00, -- CALCULO DEL IGV 18%
    total DECIMAL(12, 2) DEFAULT 0.00, -- SUMA TOTAL DE VALOR VENTA CON IGV
	importe_dolares DECIMAL(12, 2) DEFAULT 0.00, -- conversión a dolares

    -- ESTADO Y AUDITORÍA
    estado VARCHAR(20) DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO')),
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUTOINCREMENTO PARA NÚMERO DE COTIZACIÓN
-- =====================================================
CREATE INDEX idx_cotizaciones_tipo_cambio_id ON ventas.cotizacion_cliente(tipo_cambio_id);

-- 1. Crear secuencia para el número de cotización
CREATE SEQUENCE ventas.cotizacion_numero_seq START 1;

-- 2. Función para generar número con formato 00000001
CREATE OR REPLACE FUNCTION ventas.generar_numero_cotizacion()
RETURNS TRIGGER AS $$
DECLARE
    siguiente_numero INTEGER;
    numero_formateado VARCHAR(20);
BEGIN
    -- Obtener el siguiente valor de la secuencia
    siguiente_numero := NEXTVAL('ventas.cotizacion_numero_seq');
    
    -- Formatear con ceros a la izquierda (8 dígitos)
    numero_formateado := LPAD(siguiente_numero::TEXT, 8, '0');
    
    -- Asignar el número formateado
    NEW.numero := numero_formateado;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para autogenerar el número
CREATE TRIGGER trigger_generar_numero_cotizacion
    BEFORE INSERT ON ventas.cotizacion_cliente
    FOR EACH ROW
    WHEN (NEW.numero IS NULL)
    EXECUTE FUNCTION ventas.generar_numero_cotizacion();


-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver el documento CTZ
SELECT id_documento, codigo, nombre, siglas 
FROM public.documentos 
WHERE codigo = 'CTZ';

-- 3. CREAR TABLA CORREGIDA: ventas.detalle_cotizacion
CREATE TABLE ventas.detalle_cotizacion (
    id_detalle_cotizacion SERIAL PRIMARY KEY,
    cotizacion_id INTEGER NOT NULL REFERENCES ventas.cotizacion_cliente(id_cotizacion) ON DELETE CASCADE,
    fecha_entrega DATE NOT NULL,
    
    -- SECUENCIA DEL ÍTEM
    numitem INTEGER NOT NULL,
    
    -- PRODUCTO
    producto_id INTEGER REFERENCES almacen.productos(id_producto),
    almacen_id INTEGER REFERENCES almacen.almacenes(id_alm),
    descripcion_producto TEXT,

    descuento_1 DECIMAL(5, 2) DEFAULT 0.00, -- PORCENTAJE
    descuento_2 DECIMAL(5, 2) DEFAULT 0.00, -- PORCENTAJE
    
    -- INFORMACIÓN DE STOCK Y CANTIDADES
    stock_disponible DECIMAL(12, 3) DEFAULT 0.00,
    cantidad DECIMAL(12, 3) NOT NULL CHECK (cantidad > 0),
    
    -- PRECIOS
    precio_original DECIMAL(12, 4) DEFAULT 0.0000,
    precio_unitario DECIMAL(12, 4) NOT NULL CHECK (precio_unitario >= 0),
    descuento_monto DECIMAL(12, 2) DEFAULT 0.00,

    precio_bruto DECIMAL(12, 2) DEFAULT 0.00,
    valor_venta DECIMAL(12, 2) DEFAULT 0.00,
    igv DECIMAL(12, 2) DEFAULT 0.00,
    precio_total DECIMAL(12, 2) DEFAULT 0.00,
    importe_dolares DECIMAL(12, 2) DEFAULT 0.00,
    
    -- INFORMACIÓN ADICIONAL
    comentario TEXT,

    prioridad VARCHAR(30), -- Puede sobrescribir la prioridad general
    
    -- AUDITORÍA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINTS
    UNIQUE(cotizacion_id, numitem)
);

-- Crear tabla de pedidos de clientes
CREATE TABLE ventas.pedidos_cliente (
    id_pedido SERIAL PRIMARY KEY,
    
    -- INFORMACIÓN DEL DOCUMENTO
    id_documento INTEGER NOT NULL REFERENCES public.documentos(id_documento), -- Documento PED (Pedidos de Clientes)
    numero VARCHAR(20) UNIQUE NOT NULL, --debe de seer auto incrementable  desde 00000001
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- RELACIÓN CON LA COTIZACIÓN ORIGINAL
    id_cotizacion INTEGER NOT NULL REFERENCES ventas.cotizacion_cliente(id_cotizacion),
    
    -- DATOS DEL CLIENTE (copiados de la cotización)
    id_cliente INTEGER NOT NULL REFERENCES ventas.clientes(id_cliente),
    codigo_cliente VARCHAR(15) NOT NULL,
    nro_documento_cliente VARCHAR(20) NOT NULL,
    razon_social_cliente VARCHAR(200) NOT NULL,
    direccion_cliente TEXT,
    telefono_cliente VARCHAR(20),
    vendedor VARCHAR(100),
    
    -- DATOS COMERCIALES (copiados de la cotización)
    moneda_id INTEGER NOT NULL REFERENCES contabilidad.cod_moneda(id_moneda),
    forma_pago INTEGER NOT NULL REFERENCES contabilidad.formas_pago(id),
    tipo_cambio_id INTEGER REFERENCES contabilidad.tipo_cambio(id),
    tipo_cambio DECIMAL(12, 4) DEFAULT 0.0000,
    
    -- INFORMACIÓN DE ENTREGA
    fecha_entrega_prevista DATE NOT NULL,
    lugar_entrega INTEGER REFERENCES ventas.puntos_partida(id_partida),
    prioridad VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    
    -- CÁLCULOS FINANCIEROS (copiados de la cotización)
    importe_bruto DECIMAL(12, 2) DEFAULT 0.00,
    monto_descuento DECIMAL(12, 2) DEFAULT 0.00,
    valor_venta DECIMAL(12, 2) DEFAULT 0.00,
    igv_id INTEGER REFERENCES public.igv(id) DEFAULT 1,
    igv DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) DEFAULT 0.00,
	importe_dolares DECIMAL(12, 2) DEFAULT 0.00, 
    
    -- ESTADO DEL PEDIDO
    estado VARCHAR(20) DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'EN PREPARACIÓN', 'DESPACHADO', 'ENTREGADO', 'FACTURADO', 'ANULADO')),
    
    -- OBSERVACIONES
    observaciones TEXT,
    
    -- AUDITORÍA
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índice para mejor rendimiento
CREATE INDEX idx_pedidos_tipo_cambio_id ON ventas.pedidos_cliente(tipo_cambio_id);


-- Crear secuencia para número de pedido
CREATE SEQUENCE ventas.pedidos_numero_seq START 1;

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION ventas.generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
    siguiente_numero INTEGER;
    numero_formateado VARCHAR(20);
BEGIN
    siguiente_numero := NEXTVAL('ventas.pedidos_numero_seq');
    numero_formateado := LPAD(siguiente_numero::TEXT, 8, '0');
    NEW.numero := numero_formateado;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para autogenerar número de pedido
CREATE TRIGGER trigger_generar_numero_pedido
    BEFORE INSERT ON ventas.pedidos_cliente
    FOR EACH ROW
    WHEN (NEW.numero IS NULL)
    EXECUTE FUNCTION ventas.generar_numero_pedido();

-- Ver el documento PED
SELECT id_documento, codigo, nombre, siglas 
FROM public.documentos 
WHERE codigo = 'PED';



-- Tabla de detalle de pedidos (similar a detalle_cotizacion)
CREATE TABLE ventas.detalle_pedidos_cliente (
    id_detalle_pedido SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES ventas.pedidos_cliente(id_pedido) ON DELETE CASCADE,
    
    -- RELACIÓN CON EL DETALLE DE COTIZACIÓN ORIGINAL
    id_detalle_cotizacion INTEGER REFERENCES ventas.detalle_cotizacion(id_detalle_cotizacion),
    
    numitem INTEGER NOT NULL,
    producto_id INTEGER REFERENCES almacen.productos(id_producto),
    almacen_id INTEGER REFERENCES almacen.almacenes(id_alm),
    descripcion_producto TEXT,

    -- DESCUENTOS (igual que detalle_cotizacion)
    descuento_1 DECIMAL(5, 2) DEFAULT 0.00,
    descuento_2 DECIMAL(5, 2) DEFAULT 0.00,
    
    -- CANTIDADES
    stock_disponible DECIMAL(12, 3) DEFAULT 0.00,
    cantidad_solicitada DECIMAL(12, 3) NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_despachada DECIMAL(12, 3) DEFAULT 0.00,
    cantidad_pendiente DECIMAL(12, 3) GENERATED ALWAYS AS (cantidad_solicitada - cantidad_despachada) STORED,
    
    -- PRECIOS (mantenidos de la cotización)
    precio_original DECIMAL(12, 4) DEFAULT 0.0000,
    precio_unitario DECIMAL(12, 4) NOT NULL CHECK (precio_unitario >= 0),
    descuento_monto DECIMAL(12, 2) DEFAULT 0.00,

    precio_bruto DECIMAL(12, 2) DEFAULT 0.00,
    valor_venta DECIMAL(12, 2) DEFAULT 0.00,
    igv DECIMAL(12, 2) DEFAULT 0.00,
    precio_total DECIMAL(12, 2) DEFAULT 0.00,
	importe_dolares DECIMAL(12, 2) DEFAULT 0.00,
    
    -- INFORMACIÓN ADICIONAL
    fecha_entrega_item DATE NOT NULL,
    comentario TEXT,
    
    -- AUDITORÍA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pedido_id, numitem)
);

-- ===================================================================
-- FUNCIÓN PROFESIONAL: Obtener productos para guía de remisión
-- Filtra productos pendientes de un pedido por almacén
-- ===================================================================
CREATE OR REPLACE FUNCTION ventas.obtener_productos_para_guia(
    p_pedido_id INTEGER,
    p_almacen_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id_detalle_pedido INTEGER,
    producto_id INTEGER,
    codigo_producto VARCHAR,
    descripcion TEXT,
    almacen_id INTEGER,
    almacen_codigo VARCHAR,
    almacen_nombre VARCHAR,
    cantidad_solicitada DECIMAL,
    cantidad_despachada DECIMAL,
    cantidad_pendiente DECIMAL,
    stock_actual DECIMAL,
    precio_unitario DECIMAL,
    valor_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.id_detalle_pedido,
        dp.producto_id,
        p.codigo as codigo_producto,
        dp.descripcion_producto as descripcion,
        dp.almacen_id,
        a.codigo as almacen_codigo,
        a.nombre as almacen_nombre,
        dp.cantidad_solicitada,
        dp.cantidad_despachada,
        dp.cantidad_pendiente,
        p.stock_actual,
        dp.precio_unitario,
        (dp.cantidad_pendiente * dp.precio_unitario) as valor_total

    FROM ventas.detalle_pedidos_cliente dp
    INNER JOIN almacen.productos p ON dp.producto_id = p.id_producto
    LEFT JOIN almacen.almacenes a ON dp.almacen_id = a.id_alm

    WHERE dp.pedido_id = p_pedido_id
      AND dp.cantidad_pendiente > 0
      AND (p_almacen_id IS NULL OR dp.almacen_id = p_almacen_id)

    ORDER BY dp.numitem;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- FUNCIÓN PROFESIONAL: Validar que una guía no mezcle almacenes
-- ===================================================================
CREATE OR REPLACE FUNCTION ventas.validar_almacenes_guia(
    p_detalles_pedido INTEGER[]
)
RETURNS TABLE (
    es_valido BOOLEAN,
    mensaje TEXT,
    almacenes_encontrados INTEGER
) AS $$
DECLARE
    v_almacenes_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT dp.almacen_id)
    INTO v_almacenes_count
    FROM ventas.detalle_pedidos_cliente dp
    WHERE dp.id_detalle_pedido = ANY(p_detalles_pedido);

    IF v_almacenes_count > 1 THEN
        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            'No se puede generar una guía con productos de diferentes almacenes. Por favor, genere guías separadas.'::TEXT,
            v_almacenes_count;
    ELSE
        RETURN QUERY SELECT
            TRUE::BOOLEAN,
            'OK - Todos los productos son del mismo almacén'::TEXT,
            v_almacenes_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- FUNCIÓN PROFESIONAL: Obtener resumen de almacenes de un pedido
-- ===================================================================
CREATE OR REPLACE FUNCTION ventas.resumen_almacenes_pedido(
    p_pedido_id INTEGER
)
RETURNS TABLE (
    almacen_id INTEGER,
    almacen_codigo VARCHAR,
    almacen_nombre VARCHAR,
    cantidad_productos BIGINT,
    cantidad_total DECIMAL,
    valor_total DECIMAL,
    tiene_pendientes BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.almacen_id,
        a.codigo as almacen_codigo,
        a.nombre as almacen_nombre,
        COUNT(dp.id_detalle_pedido) as cantidad_productos,
        SUM(dp.cantidad_pendiente) as cantidad_total,
        SUM(dp.cantidad_pendiente * dp.precio_unitario) as valor_total,
        (SUM(dp.cantidad_pendiente) > 0) as tiene_pendientes

    FROM ventas.detalle_pedidos_cliente dp
    LEFT JOIN almacen.almacenes a ON dp.almacen_id = a.id_alm

    WHERE dp.pedido_id = p_pedido_id

    GROUP BY dp.almacen_id, a.codigo, a.nombre
    ORDER BY cantidad_productos DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para convertir cotización a pedido
CREATE OR REPLACE FUNCTION ventas.convertir_cotizacion_a_pedido(
    p_id_cotizacion INTEGER,
    p_fecha_entrega DATE,
    p_lugar_entrega INTEGER,
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_id_pedido INTEGER;
    v_cotizacion RECORD;
    v_detalle_cotizacion RECORD;
BEGIN
    -- Verificar que la cotización existe y está aprobada
    SELECT * INTO v_cotizacion 
    FROM ventas.cotizacion_cliente 
    WHERE id_cotizacion = p_id_cotizacion 
    AND estado = 'APROBADO';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La cotización no existe o no está aprobada';
    END IF;
    
    -- Insertar cabecera del pedido
    INSERT INTO ventas.pedidos_cliente (
        id_documento,
        id_cotizacion,
        id_cliente,
        codigo_cliente,
        nro_documento_cliente,
        razon_social_cliente,
        direccion_cliente,
        telefono_cliente,
        vendedor,
        moneda_id,
        forma_pago,
        fecha_entrega_prevista,
        lugar_entrega,
        importe_bruto,
        monto_descuento,
        valor_venta,
        igv_id,
        igv,
        total,
        observaciones,
        created_by
    ) 
    SELECT 
        (SELECT id_documento FROM public.documentos WHERE codigo = 'PED'),
        id_cotizacion,
        id_cliente,
        codigo_cliente,
        nro_documento_cliente,
        razon_social_cliente,
        direccion_cliente,
        telefono_cliente,
        vendedor,
        moneda_id,
        forma_pago,
        COALESCE(p_fecha_entrega, CURRENT_DATE + INTERVAL '7 days'),
        p_lugar_entrega,
        importe_bruto,
        monto_descuento,
        valor_venta,
        igv_id,
        igv,
        total,
        'Pedido generado desde cotización: ' || numero,
        p_usuario_id
    FROM ventas.cotizacion_cliente 
    WHERE id_cotizacion = p_id_cotizacion
    RETURNING id_pedido INTO v_id_pedido;
    
    -- Copiar los detalles del detalle_cotizacion
    FOR v_detalle_cotizacion IN 
        SELECT * FROM ventas.detalle_cotizacion 
        WHERE cotizacion_id = p_id_cotizacion
    LOOP
        INSERT INTO ventas.detalle_pedidos_cliente (
            pedido_id,
            id_detalle_cotizacion,
            numitem,
            producto_id,
            descripcion_producto,
            cantidad_solicitada,
            precio_unitario,
            descuento_porcentaje,
            descuento_monto,
            valor_venta,
            igv,
            precio_total,
            fecha_entrega_item
        )
        VALUES (
            v_id_pedido,
            v_detalle_cotizacion.id_detalle_cotizacion, -- Referencia al detalle original
            v_detalle_cotizacion.numitem,
            v_detalle_cotizacion.producto_id,
            v_detalle_cotizacion.descripcion_producto,
            v_detalle_cotizacion.cantidad,
            v_detalle_cotizacion.precio_unitario,
            (v_detalle_cotizacion.descuento_1 + v_detalle_cotizacion.descuento_2),
            v_detalle_cotizacion.descuento_monto,
            v_detalle_cotizacion.valor_venta,
            v_detalle_cotizacion.igv,
            v_detalle_cotizacion.precio_total,
            v_detalle_cotizacion.fecha_entrega
        );
    END LOOP;
    
    -- Actualizar estado de la cotización
    UPDATE ventas.cotizacion_cliente 
    SET estado = 'PROCESADO',
        updated_at = CURRENT_TIMESTAMP,
        updated_by = p_usuario_id
    WHERE id_cotizacion = p_id_cotizacion;
    
    RETURN v_id_pedido;
END;
$$ LANGUAGE plpgsql;



-- =====================================================
-- INSERTAR DATOS DE EJEMPLO - ESQUEMA DE VENTAS
-- DATOS REALISTAS PARA EMPRESA PERUANA
-- =====================================================

-- =====================================================
-- INSERTAR DATOS EN: ventas.vendedores
-- =====================================================

INSERT INTO ventas.vendedores (codigo, nombre, siglas, con_contado, con_credito, con_cobranza, estado, created_by) VALUES
('V01', 'JUAN CARLOS MENDOZA SILVA', 'JCM', 2.50, 3.00, 1.50, true, 1),
('V02', 'MARIA ELENA RODRIGUEZ TORRES', 'MRT', 2.00, 2.50, 1.25, true, 1),
('V03', 'PEDRO ANTONIO GARCIA LOPEZ', 'PAG', 3.00, 3.50, 2.00, true, 1),
('V04', 'ANA LUCIA FERNANDEZ CASTRO', 'ALF', 2.25, 2.75, 1.75, true, 1),
('V05', 'CARLOS ALBERTO JIMENEZ RUIZ', 'CAJ', 2.75, 3.25, 1.50, true, 1),
('V06', 'ROSA MARIA SANTOS DELGADO', 'RMS', 2.00, 2.50, 1.00, true, 1),
('V07', 'MIGUEL ANGEL VARGAS MORENO', 'MAV', 3.50, 4.00, 2.50, true, 1),
('V08', 'CARMEN JULIA QUISPE MAMANI', 'CQM', 2.50, 3.00, 1.75, true, 1),
('V09', 'JOSE LUIS HERRERA CAMPOS', 'JLH', 2.75, 3.25, 2.00, false, 1),
('V10', 'PATRICIA ELENA WONG CHANG', 'PWC', 3.25, 3.75, 2.25, true, 1);

-- =====================================================
-- INSERTAR DATOS EN: ventas.puntos_partida
-- =====================================================

INSERT INTO ventas.puntos_partida (codigo, direccion, estado) VALUES
('P01', 'AV. SEPARADORA INDUSTRIAL NRO. 1555 ATE - LIMA', true),
('P02', 'AV. ASOCIACION APTASA MZ.H LT.5 CERRO COLORADO - AREQUIPA', true),
('P03', 'JR. LOS METALES 456, SAN JUAN DE LURIGANCHO - LIMA', true),
('P04', 'AV. ARGENTINA 2847, CALLAO - LIMA', true),
('P05', 'AV. COLONIAL 1523, LIMA CENTRO - LIMA', true),
('P06', 'PARQUE INDUSTRIAL DE VILLA EL SALVADOR MZ.B LT.15', true),
('P07', 'AV. NESTOR GAMBETTA KM 14.5, VENTANILLA - CALLAO', true),
('P08', 'JR. HUASCAR 890, JESUS MARIA - LIMA', false),
('P09', 'AV. UNIVERSITARIA 3456, LOS OLIVOS - LIMA', true),
('P10', 'AV. TUPAC AMARU KM 25, CARABAYLLO - LIMA', true);

-- =====================================================
-- INSERTAR DATOS EN: ventas.vehiculos
-- =====================================================

INSERT INTO ventas.vehiculos (placa, marca, modelo, anio_fabricacion, combustible, carroceria, tipo_transmision, estado) VALUES
('ABC-123', 'MERCEDES BENZ', 'ACTROS 2041', 2020, 'Diesel', 'Camión', 'Mecanico', true),
('DEF-456', 'VOLVO', 'FH 440', 2019, 'Diesel', 'Camión', 'Automatico', true),
('GHI-789', 'SCANIA', 'R 450', 2021, 'Diesel', 'Camión', 'Mecanico', true),
('JKL-012', 'HYUNDAI', 'PORTER II', 2022, 'Diesel', 'Furgoneta', 'Mecanico', true),
('MNO-345', 'ISUZU', 'NPR 75', 2020, 'Diesel', 'Camión', 'Mecanico', true),
('PQR-678', 'FORD', 'TRANSIT CUSTOM', 2021, 'Diesel', 'Van', 'Mecanico', true),
('STU-901', 'CHEVROLET', 'N300 MAX', 2023, 'Gasolina', 'Furgoneta', 'Mecanico', true),
('VWX-234', 'TOYOTA', 'HIACE', 2022, 'Diesel', 'Van', 'Automatico', true),
('YZA-567', 'IVECO', 'DAILY 35S14', 2020, 'Diesel', 'Camión', 'Mecanico', true),
('BCD-890', 'JAC', 'HFC1035K', 2021, 'Gasolina', 'Pickup', 'Mecanico', true),
('EFG-123', 'MERCEDES BENZ', 'SPRINTER 415', 2019, 'Diesel', 'Furgoneta', 'Automatico', true),
('HIJ-456', 'VOLKSWAGEN', 'CRAFTER', 2018, 'Diesel', 'Van', 'Mecanico', false),
('KLM-789', 'FIAT', 'DUCATO MAXI', 2023, 'Diesel', 'Furgoneta', 'Mecanico', true),
('NOP-012', 'RENAULT', 'MASTER', 2020, 'Diesel', 'Van', 'Mecanico', true),
('QRS-345', 'PEUGEOT', 'BOXER', 2021, 'Diesel', 'Furgoneta', 'Mecanico', true);

-- =====================================================
-- INSERTAR DATOS EN: ventas.transportistas
-- =====================================================

-- Eliminar la función con problemas
DROP FUNCTION IF EXISTS validar_numero_documento_cliente() CASCADE;

-- Crear la función corregida
CREATE OR REPLACE FUNCTION validar_numero_documento_cliente()
RETURNS TRIGGER AS $$
DECLARE
    tipo_doc_codigo CHAR(3);
BEGIN
    -- Obtener el código del tipo de documento
    SELECT codigo INTO tipo_doc_codigo 
    FROM public.tipo_documento_id 
    WHERE id = NEW.id_documento;
    
    -- Validaciones según tipo de documento
    CASE tipo_doc_codigo
        WHEN '1' THEN -- DNI
            IF LENGTH(NEW.nro_documento) != 8 OR NEW.nro_documento !~ '^[0-9]{8}$' THEN
                RAISE EXCEPTION 'DNI debe tener exactamente 8 dígitos numéricos';
            END IF;
        WHEN '6' THEN -- RUC
            IF LENGTH(NEW.nro_documento) != 11 OR NEW.nro_documento !~ '^[0-9]{11}$' THEN
                RAISE EXCEPTION 'RUC debe tener exactamente 11 dígitos numéricos';
            END IF;
        WHEN '4' THEN -- CARNET EXTRANJERIA
            IF LENGTH(NEW.nro_documento) < 8 OR LENGTH(NEW.nro_documento) > 12 THEN
                RAISE EXCEPTION 'Carnet de extranjería debe tener entre 8 y 12 caracteres';
            END IF;
        WHEN '7' THEN -- PASAPORTE
            IF LENGTH(NEW.nro_documento) < 6 OR LENGTH(NEW.nro_documento) > 12 THEN
                RAISE EXCEPTION 'Pasaporte debe tener entre 6 y 12 caracteres';
            END IF;
        ELSE
            -- Para otros tipos de documento, validación básica
            IF LENGTH(NEW.nro_documento) < 4 OR LENGTH(NEW.nro_documento) > 20 THEN
                RAISE EXCEPTION 'Número de documento debe tener entre 4 y 20 caracteres';
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAR IDs CORRECTOS DE TIPOS DE DOCUMENTO
-- =====================================================

-- Ver qué IDs tienen realmente los tipos de documento
SELECT id, codigo, nombre FROM public.tipo_documento_id ORDER BY id;

-- =====================================================
-- DATOS CORREGIDOS PARA TRANSPORTISTAS
-- =====================================================

-- Primero, obtener los IDs correctos para los tipos de documento más comunes
DO $$
DECLARE
    dni_id INTEGER;
    ruc_id INTEGER;
    carnet_id INTEGER;
BEGIN
    -- Obtener los IDs correctos
    SELECT id INTO dni_id FROM public.tipo_documento_id WHERE codigo = '1'; -- DNI
    SELECT id INTO ruc_id FROM public.tipo_documento_id WHERE codigo = '6'; -- RUC  
    SELECT id INTO carnet_id FROM public.tipo_documento_id WHERE codigo = '4'; -- CARNET EXTRANJERIA
    
    -- Mostrar los IDs para referencia
    RAISE NOTICE 'ID para DNI (código 1): %', dni_id;
    RAISE NOTICE 'ID para RUC (código 6): %', ruc_id;
    RAISE NOTICE 'ID para CARNET (código 4): %', carnet_id;
END $$;

-- =====================================================
-- INSERT CORREGIDO PARA TRANSPORTISTAS
-- =====================================================

-- Usar los IDs correctos en lugar de asumir valores
INSERT INTO ventas.transportistas (
    codigo, id_documento, nro_documento, razon_social, nomb_comercial, 
    id_pais, direccion, email, telefono1, telefono2, celular1, celular2,
    estado, created_by
) VALUES 

-- Empresas con RUC (usar el ID correcto del tipo de documento RUC)
('TRANS001', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20123456789', 'TRANSPORTES RAPIDOS DEL SUR SAC', 'TRANSUR SAC', 
 1, 'AV. COLONIAL 1234, LIMA', 'ventas@transportesrapidos.com', '01-4567890', '01-4567891', '987654321', '987654322', true, 1),
 
('TRANS002', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20987654321', 'LOGISTICA INTEGRAL EIRL', 'LOGINTEGRAL', 
 1, 'JR. COMERCIO 567, CALLAO', 'operaciones@logisticaintegral.com', '01-7894561', '01-7894562', '956123789', '956123790', true, 1),

('TRANS003', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20456789123', 'SERVICIOS DE TRANSPORTE LIMA NORTE SAC', 'TRANSLIMA', 
 1, 'AV. TUPAC AMARU 2890, LOS OLIVOS', 'gerencia@serviciosdetransportelimanorte.com', '01-5432109', '01-5432110', '923456789', '923456790', true, 1),

('TRANS004', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20789123456', 'TRANSPORTES Y MUDANZAS DEL PACIFICO EIRL', 'TRANSPACIFICO', 
 1, 'AV. NESTOR GAMBETTA 1567, CALLAO', 'coordinacion@transportesymudanzasdelpacifico.com', '01-8765432', null, '965432109', '965432110', true, 1),

('TRANS005', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20321654987', 'FLOTA EMPRESARIAL DE CARGA SAC', 'FLOCARGA', 
 1, 'JR. LOS INDUSTRIALES 456, ATE', 'despachos@flotaempresarialdecarga.com', '01-2109876', '01-2109877', '987321654', null, true, 1),

-- Personas naturales con DNI (usar el ID correcto del tipo de documento DNI)
('TRANS006', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '12345678', 'JUAN CARLOS PEREZ GONZALEZ', 'TRANSPORTES JCM', 
 1, 'CALLE LAS FLORES 789, SURCO', 'juancarlos.perez.transportes@gmail.com', '01-2345678', null, '945678912', null, true, 1),

('TRANS007', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '87654321', 'MARIA ELENA RODRIGUEZ SILVA', 'MUDANZAS MARIA', 
 1, 'AV. GRAU 321, BARRANCO', 'maria.elena.mudanzas@hotmail.com', null, null, '912345678', '912345679', true, 1),

('TRANS008', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '23456789', 'CARLOS ALBERTO MENDOZA TORRES', 'CARGO CAM', 
 1, 'JR. HUASCAR 654, JESUS MARIA', 'carlos.mendoza.cargo@outlook.com', '01-8901234', null, '934567890', null, true, 1),

-- Extranjeros con carnet de extranjería
('TRANS009', (SELECT id FROM public.tipo_documento_id WHERE codigo = '4'), 'CE12345678', 'RICARDO ANTONIO SILVA MORALES', 'TRANS RICARDO', 
 1, 'AV. JAVIER PRADO 1234, SAN ISIDRO', 'ricardo.silva.transporte@yahoo.com', '01-3456789', null, '956789123', null, true, 1),

-- Más empresas con RUC
('TRANS010', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20147258369', 'TRANSPORTES ECONOMICOS SAC', 'TRANSECO', 
 1, 'AV. PANAMERICANA SUR KM 15.5, VILLA EL SALVADOR', 'info@transporteseconomicos.com', '01-9012345', null, '967890123', null, false, 1),

('TRANS011', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20258147369', 'TRANSPORTES AREQUIPA EXPRESS SAC', 'AREQUIPA EXPRESS', 
 1, 'AV. JESUS MZ.B LT.15, AREQUIPA', 'ventas@transportesarequipaexpress.com', '054-123456', null, '959876543', null, true, 1),

('TRANS012', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20369147258', 'LOGISTICA NORTE PERU EIRL', 'LONORTE', 
 1, 'AV. AMERICA NORTE 567, TRUJILLO', 'operaciones@logisticanorteperu.com', '044-987654', '044-987655', '949123456', null, true, 1),

('TRANS013', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20741852963', 'SERVICIOS LOGISTICOS CUSCO SAC', 'SERLOC', 
 1, 'AV. EL SOL 890, CUSCO', 'coordinacion@servicioslogisticoscusco.com', '084-456789', null, '974567891', null, true, 1),

-- Más personas naturales
('TRANS014', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '98765432', 'PEDRO LUIS VARGAS QUISPE', 'TRANSPORTES PEDRO', 
 1, 'CALLE REAL 123, HUANCAYO', 'pedro.vargas.transportes@gmail.com', '064-321789', null, '963258741', null, true, 1),

('TRANS015', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20852963741', 'MOVICARGA SELVA SAC', 'MOVICARGA', 
 1, 'JR. PUTUMAYO 456, IQUITOS', 'ventas@movicargaselva.com', '065-789123', null, '982147356', null, true, 1);

-- =====================================================
-- VERIFICACIÓN DE INSERCIÓN
-- =====================================================

-- Verificar que se insertaron correctamente
SELECT 
    'Transportistas insertados exitosamente' as resultado,
    COUNT(*) as total
FROM ventas.transportistas;

-- Ver los transportistas con sus tipos de documento
SELECT 
    t.codigo,
    t.razon_social,
    td.nombre as tipo_documento,
    t.nro_documento,
    t.estado
FROM ventas.transportistas t
JOIN public.tipo_documento_id td ON t.id_documento = td.id
ORDER BY t.codigo;

-- =====================================================
-- INSERTAR DATOS EN: ventas.clientes
-- =====================================================

INSERT INTO ventas.clientes (
    codigo, id_documento, nro_documento, vendedor_id, razon_social, nomb_comercial, 
    id_pais, direccion, email, telefono1, telefono2, celular1, celular2,
    estado, created_by
) VALUES 

-- Clientes del vendedor V01 (Juan Carlos Mendoza)
('CLI001', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20456789123', 1, 'AUTOMOTRIZ LIMA SAC', 'AUTOLIMA', 
 1, 'AV. GRAU 1234, LIMA', 'compras@automotrizlima.com', '01-2345678', '01-2345679', '987123456', null, true, 1),

('CLI002', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20789123456', 1, 'RADIADORES DEL CENTRO EIRL', 'RADCENTRO', 
 1, 'JR. LAMPA 567, LIMA CENTRO', 'gerencia@radiadoredelcentro.com', '01-3456789', null, '949876543', null, true, 1),

('CLI003', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '43567890', 1, 'CARLOS ALBERTO MENDOZA REPARACIONES', 'REPARACIONES CAM', 
 1, 'JR. LOS TALLERES 890, SURCO', 'carlos.mendoza.reparaciones@outlook.com', '01-5678901', null, '912345678', null, true, 1),

-- Clientes del vendedor V02 (Maria Elena Rodriguez)
('CLI004', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20321654987', 2, 'INTERCAMBIADORES INDUSTRIALES SA', 'INTINDSA', 
 1, 'AV. INDUSTRIAL 321, VILLA EL SALVADOR', 'ventas@intercambiadoresindustriales.com', '01-8901234', '01-8901235', '965432109', null, true, 1),

('CLI005', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20654321098', 2, 'EXPORTADORA METAL PARTS SAC', 'METPARTS', 
 1, 'AV. EXPORTADORES 654, CALLAO', 'exportaciones@metalpartsexportadora.com', '01-4321098', null, '954321098', null, true, 1),

('CLI006', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20147258369', 2, 'SERVICIOS AUTOMOTRICES RODRIGUEZ SAC', 'SEAR SAC', 
 1, 'AV. ARGENTINA 1890, CALLAO', 'servicios@serviciosautomotricesrodriguez.com', '01-7890123', null, '978654321', null, true, 1),

-- Clientes del vendedor V03 (Pedro Antonio Garcia)
('CLI007', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20258369147', 3, 'TALLERES MECANICOS ASOCIADOS EIRL', 'TAMEC', 
 1, 'AV. COLONIAL 2345, LIMA', 'talleres@talleresmecanicosasociados.com', '01-6547890', '01-6547891', '987456123', null, true, 1),

('CLI008', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20369258147', 3, 'INDUSTRIAS METALURGICAS DEL SUR SAC', 'INMETALSUR', 
 1, 'AV. SEPARADORA IND 1678, ATE', 'produccion@industriasmetalurgicasdelsur.com', '01-1234567', null, '923456789', null, true, 1),

('CLI009', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '12367890', 3, 'MIGUEL ANGEL TORRES SERVICIOS', 'MAT SERVICIOS', 
 1, 'CALLE JUNIN 456, BREÑA', 'miguel.torres.servicios@gmail.com', '01-9876543', null, '945612378', null, true, 1),

('CLI010', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20741963852', 3, 'COMERCIALIZADORA DE REPUESTOS GARCIA SAC', 'COMERGAR', 
 1, 'AV. UNIVERSITARIA 2890, SMP', 'ventas@comercializadoraderepuestosgarcia.com', '01-5647382', null, '956782341', null, false, 1),

-- Clientes del vendedor V04 (Ana Lucia Fernandez)
('CLI011', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20852741963', 4, 'DISTRIBUIDORA INDUSTRIAL FERNAN SAC', 'DIINFER', 
 1, 'AV. LAS TORRES 456, INDEPENDENCIA', 'distribucion@distribuidoraindustrialfernan.com', '01-3698521', '01-3698522', '967854123', null, true, 1),

('CLI012', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20963852741', 4, 'TECNOLOGIA TERMICA APLICADA EIRL', 'TECTAP', 
 1, 'JR. TECNOLOGIA 890, COMAS', 'ingenieria@tecnologiatermicaaplicada.com', '01-7412963', null, '985741236', null, true, 1),

('CLI013', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '85296374', 4, 'ROSA MARIA CASTRO TALLERES', 'RMC TALLERES', 
 1, 'AV. PERU 123, MAGDALENA', 'rosa.castro.talleres@hotmail.com', '01-4567123', null, '912758463', null, true, 1),

-- Clientes del vendedor V05 (Carlos Alberto Jimenez)
('CLI014', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20174296385', 5, 'SISTEMAS DE REFRIGERACION JIMENEZ SAC', 'SIREFRI', 
 1, 'AV. VENEZUELA 567, BREÑA', 'sistemas@sistemasderefrigeracionjimenez.com', '01-8523697', null, '947851236', null, true, 1),

('CLI015', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20285174693', 5, 'MANTENIMIENTO INDUSTRIAL CARLOS SAC', 'MINCAR', 
 1, 'JR. LOS INDUSTRIALES 234, ATE', 'mantenimiento@mantenimientoindustrialcarlos.com', '01-6174829', '01-6174830', '974185263', null, true, 1),

('CLI016', (SELECT id FROM public.tipo_documento_id WHERE codigo = '4'), 'CE98765432', 5, 'ALBERTO RAMIREZ SERVICIOS TECNICOS', 'ARST', 
 1, 'AV. JAVIER PRADO 789, SAN BORJA', 'alberto.ramirez.st@yahoo.com', '01-2963741', null, '958742163', null, true, 1),

-- Clientes del vendedor V06 (Rosa Maria Santos)
('CLI017', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20396174285', 6, 'SOLUCIONES TERMICAS SANTOS SAC', 'SOLTER', 
 1, 'AV. EL DERBY 345, SURCO', 'soluciones@solucionestermicassantos.com', '01-5174296', null, '963852741', null, true, 1),

('CLI018', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '74185263', 6, 'PATRICIA ELENA DELGADO REPARACIONES', 'PED REPARACIONES', 
 1, 'CALLE MARISCAL MILLER 456, LINCE', 'patricia.delgado.rep@gmail.com', '01-8529637', null, '925874163', null, true, 1),

('CLI019', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20507418529', 6, 'EQUIPOS TERMICOS ASOCIADOS EIRL', 'EQUITER', 
 1, 'AV. GUARDIA CIVIL 678, SAN BORJA', 'equipos@equipostermicosasociados.com', '01-1472583', null, '987412563', null, true, 1),

-- Clientes del vendedor V07 (Miguel Angel Vargas)
('CLI020', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20618529374', 7, 'SERVICIOS ESPECIALIZADOS VARGAS SAC', 'SESPVAR', 
 1, 'AV. PRIMAVERA 890, SURCO', 'servicios@serviciosespecializadosvargas.com', '01-9517428', '01-9517429', '952847163', null, true, 1),

('CLI021', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20729630851', 7, 'INDUSTRIA Y COMERCIO MIGUEL SAC', 'INCOMI', 
 1, 'JR. CAHUIDE 123, JESUS MARIA', 'industria@industriaycomercimiguel.com', '01-3074185', null, '974852163', null, true, 1),

('CLI022', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '96307418', 7, 'ANGEL MORENO TALLERES MECANICOS', 'AMT MECANICOS', 
 1, 'AV. ABANCAY 567, LIMA CENTRO', 'angel.moreno.talleres@outlook.com', '01-6285174', null, '936174285', null, false, 1),

-- Clientes del vendedor V08 (Carmen Julia Quispe)
('CLI023', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20840517396', 8, 'QUISPE HERMANOS SERVICIOS SAC', 'QUISER', 
 1, 'AV. GARCILAZO DE LA VEGA 234, LIMA', 'hermanos@quispehermanosservicios.com', '01-4071863', null, '961740852', null, true, 1),

('CLI024', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20951628374', 8, 'MANUFACTURAS TERMICAS MAMANI EIRL', 'MANTEM', 
 1, 'AV. TUPAC AMARU 456, RIMAC', 'manufacturas@manufacturastermicasmamani.com', '01-7308519', '01-7308520', '983074185', null, true, 1),

('CLI025', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '30741852', 8, 'JULIA CARMEN RODRIGUEZ SERVICIOS', 'JCR SERVICIOS', 
 1, 'CALLE CHANCAY 789, LIMA CENTRO', 'julia.rodriguez.servicios@gmail.com', '01-5296174', null, '917408526', null, true, 1),

-- Clientes del vendedor V10 (Patricia Elena Wong) - V09 está inactivo
('CLI026', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20162739405', 10, 'IMPORTADORA WONG CHANG SAC', 'IWONCH', 
 1, 'AV. PASEO DE LA REPUBLICA 567, MIRAFLORES', 'importadora@importadorawongchang.com', '01-8407195', null, '970841526', null, true, 1),

('CLI027', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20273950614', 10, 'ELENA PATRICIA DISTRIBUCIONES EIRL', 'EPADIS', 
 1, 'JR. UCAYALI 890, LIMA CENTRO', 'distribuciones@elenapatriciadistribuciones.com', '01-6195074', null, '954073816', null, true, 1),

('CLI028', (SELECT id FROM public.tipo_documento_id WHERE codigo = '4'), 'CE74185296', 10, 'CHANG WEI SERVICIOS TECNICOS', 'CWST', 
 1, 'AV. ARENALES 123, LINCE', 'chang.wei.st@yahoo.com', '01-4073961', null, '963074185', null, true, 1),

('CLI029', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20384951627', 10, 'SOLUCIONES INTEGRALES WONG SAC', 'SIWONG', 
 1, 'AV. JAVIER PRADO ESTE 456, LA MOLINA', 'soluciones@solucionesintegraleswong.com', '01-1740829', '01-1740830', '985074163', null, true, 1),

('CLI030', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20495062738', 10, 'TECH SOLUTIONS PATRICIA EIRL', 'TECHPAT', 
 1, 'AV. REPUBLICA DE PANAMA 789, SAN ISIDRO', 'tech@techsolutionspatricia.com', '01-8396174', null, '947382615', null, true, 1),

-- Clientes adicionales distribuidos entre otros vendedores
('CLI031', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20506173849', 1, 'TALLERES UNIDOS DEL NORTE SAC', 'TUNOR', 
 1, 'AV. TUPAC AMARU 234, LOS OLIVOS', 'talleres@talleresunidosdelnorte.com', '01-5062847', null, '928506174', null, true, 1),

('CLI032', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20617284950', 2, 'REFRIGERACION COMERCIAL DEL SUR EIRL', 'RECOMSUR', 
 1, 'AV. BENAVIDES 567, MIRAFLORES', 'refrigeracion@refrigeracioncomercialdelsur.com', '01-7394051', null, '961728495', null, true, 1),

('CLI033', (SELECT id FROM public.tipo_documento_id WHERE codigo = '1'), '50627384', 3, 'GARCIA LOPEZ SERVICIOS INTEGRALES', 'GLSI', 
 1, 'CALLE CARABAYA 890, LIMA CENTRO', 'garcia.lopez.si@hotmail.com', '01-4061728', null, '950617284', null, true, 1),

('CLI034', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20728395061', 4, 'EQUIPOS Y SERVICIOS FERNANDEZ SAC', 'EQSFER', 
 1, 'AV. CANADA 123, SAN BORJA', 'equipos@equiposyserviciosfernandez.com', '01-2850617', null, '973950628', null, true, 1),

('CLI035', (SELECT id FROM public.tipo_documento_id WHERE codigo = '6'), '20839506172', 5, 'CARLOS JIMENEZ DISTRIBUCIONES EIRL', 'CJDIS', 
 1, 'JR. WASHINGTON 456, LIMA CENTRO', 'distribuciones@carlosjimenezdistribuciones.com', '01-6173950', null, '984061739', null, false, 1);


 -- =====================================================
-- INSERTAR DATOS EN: ventas.info_financiera_clientes
-- =====================================================

-- Cliente 1: AUTOMOTRIZ LIMA SAC
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    1, -- AUTOMOTRIZ LIMA SAC
    50000.00, -- Línea de crédito: S/ 50,000
    1.50, -- Tasa de interés: 1.5%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '5'), -- CREDITO 30 DIAS
    5.00, -- Descuento 1: 5%
    2.00, -- Descuento 2: 2%
    '001-123456789', -- Cuenta de detracción
    1
);

-- Cliente 2: RADIADORES DEL CENTRO EIRL
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    2,
    25000.00, -- Línea de crédito: S/ 25,000
    2.00, -- Tasa de interés: 2.0%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '3'), -- CREDITO 10 DIAS
    3.00, -- Descuento 1: 3%
    1.00, -- Descuento 2: 1%
    '001-987654321',
    1
);

-- Cliente 4: INTERCAMBIADORES INDUSTRIALES SA
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    4,
    100000.00, -- Línea de crédito: S/ 100,000
    1.25, -- Tasa de interés: 1.25%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '7'), -- CREDITO 60 DIAS
    7.00, -- Descuento 1: 7%
    3.00, -- Descuento 2: 3%
    '001-456789123',
    1
);

-- Cliente 5: EXPORTADORA METAL PARTS SAC
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    5,
    75000.00, -- Línea de crédito: S/ 75,000
    1.75, -- Tasa de interés: 1.75%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '18'), -- CREDITO
    6.00, -- Descuento 1: 6%
    2.50, -- Descuento 2: 2.5%
    '001-321654987',
    1
);

-- Cliente 7: TALLERES MECANICOS ASOCIADOS EIRL
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    7,
    15000.00, -- Línea de crédito: S/ 15,000
    2.50, -- Tasa de interés: 2.5%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '1'), -- CONTADO
    2.00, -- Descuento 1: 2%
    0.50, -- Descuento 2: 0.5%
    '001-789123456',
    1
);

-- Cliente 8: INDUSTRIAS METALURGICAS DEL SUR SAC
INSERT INTO ventas.info_financiera_clientes (
    id_cliente, linea_credito, tasa_interes, forma_pago_id, 
    descuento_1, descuento_2, cuenta_detraccion, created_by
) VALUES (
    8,
    80000.00, -- Línea de crédito: S/ 80,000
    1.60, -- Tasa de interés: 1.6%
    (SELECT id FROM contabilidad.formas_pago WHERE codigo = '29'), -- LETRA 30-60-90 DIAS
    8.00, -- Descuento 1: 8%
    4.00, -- Descuento 2: 4%
    '001-654987321',
    1
);

---SE PUEDE EJECUTAR------------

-- =====================================================
-- Tablas para mantenimiento
-- =====================================================
-- Tabla de motivo de recepción
CREATE TABLE IF NOT EXISTS mantenimiento.motivo_recepcion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado BOOLEAN DEFAULT TRUE
);

DO $$ BEGIN 
    IF (SELECT COUNT(*) FROM mantenimiento.motivo_recepcion) = 0 THEN
        INSERT INTO mantenimiento.motivo_recepcion (nombre, descripcion) VALUES
        ('RECLAMO', 'Equipo recibido por garantía o disconformidad del cliente.'),
        ('MUESTRA_FABRICANTE', 'Muestra para análisis solicitado por el fabricante o proveedor.'),
        ('MUESTRA_EVALUACION', 'Equipo ingresado para diagnóstico y cotización de servicio o reparación.');
    END IF;
END $$;

-- Tabla para los equipos de mantenimiento
CREATE TABLE mantenimiento.recepcion_equipo (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES ventas.clientes(id_cliente),
    fecha_recepcion DATE NOT NULL,
    codigo_bpc VARCHAR(4) NOT NULL, 
    codigo_solped VARCHAR(12),
    descripcion_problema TEXT NOT NULL,
    observaciones TEXT,            
    marca VARCHAR(50),
    modelo VARCHAR(50),
    motivo_id INTEGER NOT NULL REFERENCES mantenimiento.motivo_recepcion(id),
    
    -- Estado interno del proceso 
    estado_proceso VARCHAR(30) NOT NULL DEFAULT 'RECEPCIONADO'
        CHECK (estado_proceso IN ('RECEPCIONADO', 'EN EVALUACION', 'EN REPARACION', 'COTIZACION PENDIENTE', 'DEVUELTO', 'COMPLETADO')),

    -- Auditoría
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RESTRICCIÓN DE UNICIDAD CLAVE: BPC y SOLPED deben ser únicos en combinación
ALTER TABLE mantenimiento.recepcion_equipo 
ADD CONSTRAINT uk_recepcion_equipo_bpc_solped 
UNIQUE (codigo_bpc, codigo_solped);

-- Crear índices para búsquedas rápidas por BPC y SOLPED
CREATE INDEX idx_recepcion_equipo_bpc ON mantenimiento.recepcion_equipo (codigo_bpc);
CREATE INDEX idx_recepcion_equipo_solped ON mantenimiento.recepcion_equipo (codigo_solped);

-- Obtener el ID del cliente para los datos de ejemplo (usando RUC 20456789123 y 20789123456)
DO $$
DECLARE
    cliente_id_1 INTEGER;
    cliente_id_2 INTEGER;
    motivo_evaluacion_id INTEGER;
    motivo_reclamo_id INTEGER;
BEGIN
    -- Se usan los IDs de la tabla ventas.clientes
    SELECT id_cliente INTO cliente_id_1 FROM ventas.clientes WHERE nro_documento = '20456789123' LIMIT 1;
    SELECT id_cliente INTO cliente_id_2 FROM ventas.clientes WHERE nro_documento = '20789123456' LIMIT 1;
    
    SELECT id INTO motivo_evaluacion_id FROM mantenimiento.motivo_recepcion WHERE nombre = 'MUESTRA_EVALUACION';
    SELECT id INTO motivo_reclamo_id FROM mantenimiento.motivo_recepcion WHERE nombre = 'RECLAMO';

    -- Insertar datos de ejemplo solo si se encontraron IDs válidos
    IF cliente_id_1 IS NOT NULL AND motivo_evaluacion_id IS NOT NULL THEN
        INSERT INTO mantenimiento.recepcion_equipo (
            cliente_id, fecha_recepcion, codigo_bpc, codigo_solped, descripcion_problema, 
            marca, modelo, motivo_id, created_by
        ) VALUES
        (
            cliente_id_1, 
            CURRENT_DATE, 
            'BPC1', 
            'SOLPED0001', 
            'El equipo presenta fallos intermitentes al encender. Se apaga solo a los 5 minutos de uso.', 
            'ABB', 
            'DRIVE ACS580', 
            motivo_evaluacion_id, 
            1
        );
    END IF;

    IF cliente_id_2 IS NOT NULL AND motivo_reclamo_id IS NOT NULL THEN
        INSERT INTO mantenimiento.recepcion_equipo (
            cliente_id, fecha_recepcion, codigo_bpc, codigo_solped, descripcion_problema, 
            marca, modelo, motivo_id, created_by
        ) VALUES
        (
            cliente_id_2, 
            CURRENT_DATE - INTERVAL '5 days', 
            'BPC2', 
            'SOLPED0002', 
            'Ruptura de carcasa y daño en conector de entrada de corriente.', 
            'SIEMENS', 
            'PLC S7-1500', 
            motivo_reclamo_id, 
            1
        );
    END IF;
END $$;


-- Tablas para la evaluación de equipos --
-- 1. Tabla de Actividades de Mano de Obra
CREATE TABLE mantenimiento.actividad_mano_obra (
    id SERIAL PRIMARY KEY,
    actividad VARCHAR(100) NOT NULL UNIQUE,
    costo_hh DECIMAL(12, 2) NOT NULL,       -- Costo por hora
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de ejemplo de Mano de Obra
INSERT INTO mantenimiento.actividad_mano_obra (actividad, costo_hh) VALUES
('MONTAJE', 6.11),
('DESMONTAJE', 6.11),
('DIBUJANTE', 6.79),
('MECANIZADO CNC', 8.15),
('MAQUINA LASER', 4.93),
('SOLDADORES', 8.60),
('MECANICOS', 4.75),
('LAVADO', 6.34),
('TORNO', 3.85),
('CONTROL DE CALIDAD', 7.24),
('AYUDANTES INDUSTRIAL', 3.85),
('PINTOR', 5.77);

-- 2. Tabla de Evaluación Técnica
-- Corresponde al modelo EvaluacionTecnica
CREATE TABLE mantenimiento.evaluacion_tecnica (
    id SERIAL PRIMARY KEY,
    
    -- Relación con el equipo recibido
    recepcion_equipo_id INTEGER NOT NULL REFERENCES mantenimiento.recepcion_equipo(id) UNIQUE,
    
    -- Relación con el técnico que realiza la evaluación (asumimos que el usuario es el técnico)
    tecnico_id INTEGER NOT NULL REFERENCES public.usuarios(id),
    
    -- Detalle de la evaluación
    fecha_evaluacion DATE NOT NULL DEFAULT CURRENT_DATE,
    comentarios TEXT,
    
    -- Totales (a calcular y almacenar para la cotización)
    total_materiales DECIMAL(12, 2) DEFAULT 0.00,
    total_mano_obra DECIMAL(12, 2) DEFAULT 0.00,
    total_auxiliares DECIMAL(12, 2) DEFAULT 0.00,
    total_costo_directo DECIMAL(12, 2) DEFAULT 0.00, -- Suma de los 3 totales anteriores
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Materiales Requeridos para la Evaluación
-- Corresponde al modelo MaterialEvaluacion
CREATE TABLE mantenimiento.material_evaluacion (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER NOT NULL REFERENCES mantenimiento.evaluacion_tecnica(id) ON DELETE CASCADE,
    
    -- Relación con el producto/material del almacén
    producto_codigo VARCHAR(50) NOT NULL REFERENCES almacen.productos(codigo),
    
    cantidad DECIMAL(12, 2) NOT NULL,
    observaciones TEXT,
    
    -- Costo de referencia al momento de la evaluación
    costo_unitario_ref DECIMAL(12, 4), -- Costo actual del almacén
    costo_total DECIMAL(12, 2) GENERATED ALWAYS AS (ROUND(cantidad * costo_unitario_ref, 2)) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (evaluacion_id, producto_codigo)
);

-- 4. Tabla de Actividades de Mano de Obra en la Evaluación
-- Corresponde al modelo ActividadObraEvaluacion
CREATE TABLE mantenimiento.actividad_obra_evaluacion (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER NOT NULL REFERENCES mantenimiento.evaluacion_tecnica(id) ON DELETE CASCADE,
    
    -- Relación con la actividad global
    actividad_id INTEGER NOT NULL REFERENCES mantenimiento.actividad_mano_obra(id),
    
    cantidad_horas DECIMAL(8, 2) NOT NULL, -- Uso `cantidad` de models.py como horas
    observaciones TEXT,
    
    -- Costo calculado
    costo_hh_ref DECIMAL(12, 2), -- Costo por HH de referencia al momento de registrar
    costo_total DECIMAL(12, 2) GENERATED ALWAYS AS (ROUND(cantidad_horas * costo_hh_ref, 2)) STORED,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (evaluacion_id, actividad_id)
);

-- 5. Tabla de Elementos Auxiliares/Adicionales
-- Corresponde al modelo ElementoAuxiliar
CREATE TABLE mantenimiento.elemento_auxiliar (
    id SERIAL PRIMARY KEY,
    evaluacion_id INTEGER NOT NULL REFERENCES mantenimiento.evaluacion_tecnica(id) ON DELETE CASCADE,
    
    tipo VARCHAR(50) NOT NULL,      -- Ej: "Tercerización", "Viáticos", "Herramienta alquilada"
    nombre VARCHAR(100) NOT NULL,   -- Descripción del elemento
    unidad VARCHAR(10) NOT NULL DEFAULT 'UND',
    cantidad DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(5) NOT NULL DEFAULT 'USD',
    precio_unitario DECIMAL(12, 4) NOT NULL,
    
    costo_total DECIMAL(12, 2) GENERATED ALWAYS AS (ROUND(cantidad * precio_unitario, 2)) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP VIEW IF EXISTS mantenimiento.vw_recepciones_equipo;

-- Vistas de apoyo (corregidas para usar ventas.clientes)
CREATE OR REPLACE VIEW mantenimiento.vw_recepciones_equipo AS
    SELECT 
        re.id,
        re.cliente_id,
        re.fecha_recepcion,
        re.codigo_bpc,
        re.codigo_solped,
        re.descripcion_problema,
        re.observaciones,
        re.marca,
        re.modelo,
        re.motivo_id,
        re.estado_proceso,
        c.razon_social AS cliente_nombre,
        c.nro_documento AS cliente_ruc,
        mr.nombre AS motivo_recepcion,
        et.id IS NOT NULL AS evaluacion_existente, -- Indica si ya tiene una evaluación
        et.id AS evaluacion_id                     -- ID de la evaluación, si existe
    FROM mantenimiento.recepcion_equipo re
    JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
    JOIN mantenimiento.motivo_recepcion mr ON re.motivo_id = mr.id
    LEFT JOIN mantenimiento.evaluacion_tecnica et ON re.id = et.recepcion_equipo_id
    ORDER BY re.created_at DESC;


-- TABLA DE AUDITORÍA
CREATE TABLE public.auditoria (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(50),
    operacion VARCHAR(10),
    usuario_id INTEGER,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

-- Aumentar el tamaño de la columna operacion
ALTER TABLE public.auditoria 
ALTER COLUMN operacion TYPE VARCHAR(30);

-- =====================================================
-- CORRECCIÓN PREVIA: FOREIGN KEY EN UNIDADES_MEDIDA
-- =====================================================

-- Corregir la referencia incorrecta en unidades_medida
ALTER TABLE public.unidades_medida 
DROP CONSTRAINT IF EXISTS unidades_medida_cod_sunat_fkey;

-- Crear la referencia correcta por código
ALTER TABLE public.unidades_medida
ADD CONSTRAINT unidades_medida_cod_sunat_fkey 
FOREIGN KEY (cod_sunat) REFERENCES public.unidades_medida_sunat(id_unidad);


----------------------------------------------------------------------------------
----------Mantenimiento - planificación-----------------------
-- ===============================================
-- TABLA: mantenimiento.plan_mantenimiento_preventivo
-- ===============================================
CREATE TABLE IF NOT EXISTS mantenimiento.plan_mantenimiento_preventivo (
    id                  SERIAL PRIMARY KEY,
    
    -- Relación opcional al equipo (si luego quieres enlazar con otra tabla)
    equipo_id           INTEGER NULL,
    equipo_nombre       VARCHAR(200) NOT NULL,
    equipo_codigo       VARCHAR(50),

    tecnico_id          INTEGER NULL,
    tecnico_nombre      VARCHAR(150),

    -- Frecuencia y tipo
    frecuencia_valor    INTEGER NOT NULL, -- ej: 30
    frecuencia_tipo     VARCHAR(20) NOT NULL CHECK (frecuencia_tipo IN ('DIAS', 'SEMANAS', 'MESES')),

    descripcion         TEXT NOT NULL,

    proxima_fecha       DATE NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
                        CHECK (estado IN ('ACTIVO', 'PROGRAMADO', 'VENCIDO', 'INACTIVO')),

    creado_por          INTEGER NULL,
    actualizado_por     INTEGER NULL,
    created_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_plan_prev_proxima_fecha
    ON mantenimiento.plan_mantenimiento_preventivo (proxima_fecha);

CREATE INDEX IF NOT EXISTS idx_plan_prev_estado
    ON mantenimiento.plan_mantenimiento_preventivo (estado);
 
 ------------------ALTER------------------------
 
 ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
DROP CONSTRAINT IF EXISTS plan_mantenimiento_preventivo_frecuencia_tipo_check;

ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
ADD CONSTRAINT plan_mantenimiento_preventivo_frecuencia_tipo_check
CHECK (frecuencia_tipo IN ('DIAS', 'SEMANAS', 'MESES', 'HORAS', 'KILOMETROS'));

ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
DROP CONSTRAINT IF EXISTS plan_mantenimiento_preventivo_estado_check;

ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
ADD CONSTRAINT plan_mantenimiento_preventivo_estado_check
CHECK (estado IN ('ACTIVO', 'INACTIVO', 'VENCIDO'));

ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
DROP CONSTRAINT IF EXISTS fk_plan_equipo;

ALTER TABLE mantenimiento.plan_mantenimiento_preventivo
ADD CONSTRAINT fk_plan_equipo
FOREIGN KEY (equipo_id)
REFERENCES mantenimiento.recepcion_equipo(id)
ON DELETE SET NULL;

CREATE OR REPLACE VIEW mantenimiento.vw_tecnicos AS
SELECT
  u.id,
  u.nombre_completo
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
WHERE r.nombre = 'TECNICO'
  AND u.activo = TRUE;


---------EJECUTAR HASTA AQUÍ---------------------------------------------------------------------------------------------

--------------------------------------------------------
--------------------------------------------------------
--------------------------------------------------------
--------------------------------------------------------
--------------------------------------------------------
--------------------------------------------------------
--TABLA DE ORDEN DE FARBICACIÓN

CREATE TABLE ventas.orden_fabricacion (
    id_ord SERIAL PRIMARY KEY,
    
    documento_id INTEGER NOT NULL
        REFERENCES public.documentos(id_documento),

    numero_ord VARCHAR(30) NOT NULL,

    pedido_id INTEGER
        REFERENCES ventas.pedidos_cliente(id_pedido),

    cliente_id INTEGER
        REFERENCES ventas.clientes(id_cliente),
    
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,

    prioridad VARCHAR(20) DEFAULT 'NORMAL'
        CHECK (prioridad IN ('NORMAL','ALTA','URGENTE')),

    estado_orden VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA'
        CHECK (estado_orden IN ('PROGRAMADA','EN_PROCESO','PAUSADA','TERMINADA','ANULADA')),

    observaciones TEXT,

    usuario_registro VARCHAR(50),
    usuario_modifica VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modifica TIMESTAMP
);

CREATE TABLE ventas.orden_fab_detalle (
    id SERIAL PRIMARY KEY,

    id_ord INTEGER NOT NULL
        REFERENCES ventas.orden_fabricacion(id_ord)
        ON DELETE CASCADE,

    num_item INTEGER NOT NULL,

    producto_id INTEGER NOT NULL
        REFERENCES almacen.productos(id_producto),

    descripcion TEXT,
    unidad_medida VARCHAR(10),

    prioridad VARCHAR(20) DEFAULT 'NORMAL'
        CHECK (prioridad IN ('NORMAL','ALTA','URGENTE')),

    cantidad NUMERIC(12,2) NOT NULL,

    cantidad_producida NUMERIC(12,2) DEFAULT 0,
    cantidad_pendiente NUMERIC(12,2) GENERATED ALWAYS AS (cantidad - cantidad_producida) STORED,

    cantidad_defectuosa NUMERIC(12,2) DEFAULT 0,

    centro_costo INTEGER
        REFERENCES contabilidad.c_costo(id_c_costo),

    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN (
            'PENDIENTE',
            'PROGRAMADO',
            'EN_PROCESO',
            'PAUSADO',
            'EN_CALIDAD',
            'DEVUELTO',
            'TERMINADO',
            'ANULADO'
        )),

    fecha_inicio_item TIMESTAMP,
    fecha_fin_item TIMESTAMP,
    
    usuario_registro VARCHAR(50),
    usuario_modifica VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modifica TIMESTAMP
);



CREATE TABLE ventas.requisicion_materiales (
    id_requisicion SERIAL PRIMARY KEY,
    numero VARCHAR(20) UNIQUE,
    orden_fabricacion_id INTEGER REFERENCES ventas.orden_fabricacion(id_ord),
    fecha_requisicion TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'PENDIENTE', 
    -- PENDIENTE, APROBADO, EN_PROCESO, COMPLETADO
    almacen_origen INTEGER REFERENCES almacen.almacenes(id_alm),
    observaciones TEXT,
    usuario_solicita INTEGER REFERENCES public.usuarios(id)
);

CREATE TABLE ventas.requisicion_materiales_detalle (
    id SERIAL PRIMARY KEY,
    requisicion_id INTEGER REFERENCES ventas.requisicion_materiales(id_requisicion),
    producto_codigo VARCHAR(50) REFERENCES almacen.productos(codigo),
    cantidad_requerida NUMERIC(14,4),
    cantidad_entregada NUMERIC(14,4) DEFAULT 0,
    unidad_medida VARCHAR(20)
);


---PROCESO DE PRODUCCIÓN

CREATE TABLE ventas.proceso_produccion (
    id_proceso SERIAL PRIMARY KEY,
    orden_fabricacion_id INTEGER REFERENCES ventas.orden_fabricacion(id_ord),
    etapa VARCHAR(50), -- 'CORTE', 'ENSAMBLE', 'SOLDADURA', 'PINTADO', etc.
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    porcentaje_avance NUMERIC(5,2),
    operario_id INTEGER REFERENCES public.usuarios(id),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'EN_PROCESO'
);

----CONTROL DE CALIDAD

CREATE TABLE ventas.control_calidad (
    id_control SERIAL PRIMARY KEY,
    orden_fabricacion_id INTEGER REFERENCES ventas.orden_fabricacion(id_ord),
    inspector_id INTEGER REFERENCES public.usuarios(id),
    fecha_inspeccion TIMESTAMP DEFAULT NOW(),
    resultado VARCHAR(20), -- 'APROBADO', 'RECHAZADO', 'RETRABAJAR'
    observaciones TEXT,
    defectos_encontrados TEXT
);

-- =====================================================
-- MÓDULO COMPLETO: GUÍAS DE REMISIÓN
-- Radiadores Fortaleza S.A.
-- Versión: 1.0 - FINAL Y LIMPIO
-- Fecha: 2025-12-19
-- =====================================================
-- Este archivo contiene TODO lo necesario desde cero:
-- - Tablas
-- - Índices
-- - Secuencias
-- - Triggers
-- - Funciones
-- - Vistas
-- - Datos iniciales
-- =====================================================

-- =====================================================
-- TABLA PRINCIPAL: GUÍAS DE REMISIÓN (CABECERA)
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas.guias_remision (
    id_guia SERIAL PRIMARY KEY,

    -- INFORMACIÓN DEL DOCUMENTO
    id_documento INTEGER NOT NULL REFERENCES public.documentos(id_documento),
    serie VARCHAR(4) NOT NULL DEFAULT 'T001',
    numero VARCHAR(20) UNIQUE NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_traslado DATE NOT NULL,

    -- RELACIÓN CON PEDIDO
    pedido_id INTEGER NOT NULL REFERENCES ventas.pedidos_cliente(id_pedido),

    -- DATOS DEL DESTINATARIO (Cliente)
    cliente_id INTEGER NOT NULL REFERENCES ventas.clientes(id_cliente),
    cliente_documento VARCHAR(20) NOT NULL,
    cliente_razon_social VARCHAR(200) NOT NULL,
    cliente_direccion TEXT NOT NULL,

    -- DATOS DEL REMITENTE (Empresa)
    empresa_id INTEGER REFERENCES public.empresa(id_empresa) DEFAULT 1,
    empresa_documento VARCHAR(20) NOT NULL DEFAULT '20101636411',
    empresa_razon_social VARCHAR(100) NOT NULL DEFAULT 'RADIADORES FORTALEZA S.A.',

    -- PUNTO DE PARTIDA (Almacén de origen)
    punto_partida_id INTEGER REFERENCES ventas.puntos_partida(id_partida),
    direccion_partida TEXT NOT NULL,

    -- PUNTO DE LLEGADA
    direccion_llegada TEXT NOT NULL,
    ubigeo_llegada VARCHAR(6),

    -- ALMACÉN DE ORIGEN
    almacen_id INTEGER NOT NULL REFERENCES almacen.almacenes(id_alm),

    -- MOTIVO DE TRASLADO
    motivo_traslado VARCHAR(50) NOT NULL DEFAULT 'VENTA'
        CHECK (motivo_traslado IN (
            'VENTA',
            'COMPRA',
            'CONSIGNACION',
            'DEVOLUCION',
            'TRASLADO_EMISOR',
            'TRASLADO_ZONA_PRIMARIA',
            'OTROS'
        )),
    codigo_motivo VARCHAR(2),

    -- DATOS DEL TRANSPORTISTA
    transportista_id INTEGER REFERENCES ventas.transportistas(id_transportista),
    transportista_documento VARCHAR(20),
    transportista_razon_social VARCHAR(200),

    -- DATOS DEL VEHÍCULO
    vehiculo_id INTEGER REFERENCES ventas.vehiculos(id_vehiculo),
    vehiculo_placa VARCHAR(10),

    -- DATOS DEL CONDUCTOR
    chofer_id INTEGER REFERENCES ventas.choferes(id_chofer),
    chofer_documento VARCHAR(20),
    chofer_nombre VARCHAR(100),
    chofer_licencia VARCHAR(20),

    -- PESO Y BULTOS
    peso_bruto_total DECIMAL(12, 3) DEFAULT 0.000,
    numero_bultos INTEGER DEFAULT 0,

    -- VALORES
    valor_total DECIMAL(12, 2) DEFAULT 0.00,

    -- OBSERVACIONES
    observaciones TEXT,

    -- ESTADO
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN (
            'PENDIENTE',
            'EN_TRANSITO',
            'ENTREGADO',
            'ENTREGADO_PARCIAL',
            'ANULADO'
        )),

    -- FECHAS DE SEGUIMIENTO
    fecha_despacho TIMESTAMP,
    fecha_entrega TIMESTAMP,

    -- FACTURACIÓN ELECTRÓNICA
    hash_cpe VARCHAR(100),
    codigo_respuesta_sunat VARCHAR(10),
    descripcion_respuesta_sunat TEXT,
    fecha_envio_sunat TIMESTAMP,

    -- AUDITORÍA
    created_by INTEGER REFERENCES public.usuarios(id),
    updated_by INTEGER REFERENCES public.usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA DETALLE: ITEMS DE LA GUÍA
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas.detalle_guia_remision (
    id_detalle_guia SERIAL PRIMARY KEY,

    guia_id INTEGER NOT NULL REFERENCES ventas.guias_remision(id_guia) ON DELETE CASCADE,
    detalle_pedido_id INTEGER NOT NULL REFERENCES ventas.detalle_pedidos_cliente(id_detalle_pedido),

    numitem INTEGER NOT NULL,

    producto_id INTEGER NOT NULL REFERENCES almacen.productos(id_producto),
    codigo_producto VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'UND',

    cantidad_despachada DECIMAL(12, 3) NOT NULL CHECK (cantidad_despachada > 0),
    cantidad_recibida DECIMAL(12, 3) DEFAULT 0.000,

    precio_unitario DECIMAL(12, 4) DEFAULT 0.0000,
    valor_total DECIMAL(12, 2) DEFAULT 0.00,

    peso_unitario DECIMAL(10, 3) DEFAULT 0.000,
    peso_total DECIMAL(12, 3) DEFAULT 0.000,

    fecha_vencimiento DATE,
    numero_serie VARCHAR(50),

    estado VARCHAR(20) DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'DESPACHADO', 'ENTREGADO', 'DEVUELTO')),

    observacion TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(guia_id, numitem)
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_guias_pedido ON ventas.guias_remision(pedido_id);
CREATE INDEX IF NOT EXISTS idx_guias_cliente ON ventas.guias_remision(cliente_id);
CREATE INDEX IF NOT EXISTS idx_guias_estado ON ventas.guias_remision(estado);
CREATE INDEX IF NOT EXISTS idx_guias_fecha ON ventas.guias_remision(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_guias_almacen ON ventas.guias_remision(almacen_id);
CREATE INDEX IF NOT EXISTS idx_guias_serie_numero ON ventas.guias_remision(serie, numero);
CREATE INDEX IF NOT EXISTS idx_detalle_guia_producto ON ventas.detalle_guia_remision(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_guia_pedido ON ventas.detalle_guia_remision(detalle_pedido_id);

-- =====================================================
-- SECUENCIA PARA NÚMERO DE GUÍA
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS ventas.guia_remision_numero_seq START 1;

-- =====================================================
-- FUNCIÓN: Generar número de guía automático
-- Formato: T001-00000001
-- =====================================================
CREATE OR REPLACE FUNCTION ventas.generar_numero_guia()
RETURNS TRIGGER AS $$
DECLARE
    v_siguiente_numero INTEGER;
    v_numero_formateado VARCHAR(20);
BEGIN
    v_siguiente_numero := NEXTVAL('ventas.guia_remision_numero_seq');
    v_numero_formateado := NEW.serie || '-' || LPAD(v_siguiente_numero::TEXT, 8, '0');
    NEW.numero := v_numero_formateado;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número
DROP TRIGGER IF EXISTS trigger_generar_numero_guia ON ventas.guias_remision;
CREATE TRIGGER trigger_generar_numero_guia
    BEFORE INSERT ON ventas.guias_remision
    FOR EACH ROW
    WHEN (NEW.numero IS NULL)
    EXECUTE FUNCTION ventas.generar_numero_guia();

-- =====================================================
-- FUNCIÓN: Asignar código SUNAT del motivo de traslado
-- =====================================================
CREATE OR REPLACE FUNCTION ventas.asignar_codigo_motivo_traslado()
RETURNS TRIGGER AS $$
BEGIN
    NEW.codigo_motivo := CASE NEW.motivo_traslado
        WHEN 'VENTA' THEN '01'
        WHEN 'COMPRA' THEN '02'
        WHEN 'CONSIGNACION' THEN '04'
        WHEN 'DEVOLUCION' THEN '05'
        WHEN 'TRASLADO_EMISOR' THEN '13'
        WHEN 'TRASLADO_ZONA_PRIMARIA' THEN '14'
        WHEN 'OTROS' THEN '18'
        ELSE '01'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para asignar código
DROP TRIGGER IF EXISTS trigger_codigo_motivo_guia ON ventas.guias_remision;
CREATE TRIGGER trigger_codigo_motivo_guia
    BEFORE INSERT OR UPDATE ON ventas.guias_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.asignar_codigo_motivo_traslado();


-- =====================================================
-- VISTA: Guías con información completa
-- =====================================================
DROP VIEW IF EXISTS ventas.vista_guias_remision CASCADE;

CREATE OR REPLACE VIEW ventas.vista_guias_remision AS
SELECT
    g.id_guia,
    g.serie,
    g.numero,
    g.fecha_emision,
    g.fecha_traslado,
    g.pedido_id,
    p.numero as numero_pedido,
    g.cliente_id,
    g.cliente_documento,
    g.cliente_razon_social,
    g.direccion_partida,
    g.direccion_llegada,
    g.almacen_id,
    a.nombre as almacen_nombre,
    g.motivo_traslado,
    g.codigo_motivo,
    g.transportista_razon_social,
    g.vehiculo_placa,
    g.chofer_nombre,
    g.peso_bruto_total,
    g.numero_bultos,
    g.valor_total,
    g.estado,
    g.fecha_despacho,
    g.fecha_entrega,
    g.observaciones,
    g.created_at,
    u.nombre_completo as creado_por,
    (SELECT COUNT(*) FROM ventas.detalle_guia_remision dg WHERE dg.guia_id = g.id_guia) as total_items
FROM ventas.guias_remision g
LEFT JOIN ventas.pedidos_cliente p ON g.pedido_id = p.id_pedido
LEFT JOIN almacen.almacenes a ON g.almacen_id = a.id_alm
LEFT JOIN public.usuarios u ON g.created_by = u.id;

-- =====================================================
-- TRIGGER: Actualizar cantidad despachada en pedido
-- =====================================================
-- Esta función se ejecuta automáticamente cuando se inserta, actualiza o elimina
-- un detalle de guía de remisión, actualizando la cantidad_despachada en el pedido.
-- Esto a su vez actualiza automáticamente cantidad_pendiente (que es GENERATED).

CREATE OR REPLACE FUNCTION ventas.actualizar_cantidad_despachada_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_total_despachado DECIMAL(12, 3);
BEGIN
    -- Si es INSERT o UPDATE, recalcular el total despachado para ese detalle de pedido
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        -- Calcular total despachado para este detalle de pedido
        SELECT COALESCE(SUM(cantidad_despachada), 0)
        INTO v_total_despachado
        FROM ventas.detalle_guia_remision
        WHERE detalle_pedido_id = NEW.detalle_pedido_id;

        -- Actualizar cantidad_despachada en detalle_pedidos_cliente
        UPDATE ventas.detalle_pedidos_cliente
        SET cantidad_despachada = v_total_despachado
        WHERE id_detalle_pedido = NEW.detalle_pedido_id;

        RETURN NEW;
    END IF;

    -- Si es DELETE, recalcular sin incluir el registro eliminado
    IF (TG_OP = 'DELETE') THEN
        -- Calcular total despachado para este detalle de pedido (sin el eliminado)
        SELECT COALESCE(SUM(cantidad_despachada), 0)
        INTO v_total_despachado
        FROM ventas.detalle_guia_remision
        WHERE detalle_pedido_id = OLD.detalle_pedido_id
          AND id_detalle_guia != OLD.id_detalle_guia;

        -- Actualizar cantidad_despachada en detalle_pedidos_cliente
        UPDATE ventas.detalle_pedidos_cliente
        SET cantidad_despachada = v_total_despachado
        WHERE id_detalle_pedido = OLD.detalle_pedido_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger AFTER INSERT: Se ejecuta después de insertar un detalle de guía
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_insert ON ventas.detalle_guia_remision;
CREATE TRIGGER trigger_actualizar_despachado_insert
    AFTER INSERT ON ventas.detalle_guia_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.actualizar_cantidad_despachada_pedido();

-- Trigger AFTER UPDATE: Se ejecuta después de actualizar cantidad en un detalle de guía
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_update ON ventas.detalle_guia_remision;
CREATE TRIGGER trigger_actualizar_despachado_update
    AFTER UPDATE OF cantidad_despachada ON ventas.detalle_guia_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.actualizar_cantidad_despachada_pedido();

-- Trigger AFTER DELETE: Se ejecuta después de eliminar un detalle de guía (guía anulada)
DROP TRIGGER IF EXISTS trigger_actualizar_despachado_delete ON ventas.detalle_guia_remision;
CREATE TRIGGER trigger_actualizar_despachado_delete
    AFTER DELETE ON ventas.detalle_guia_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.actualizar_cantidad_despachada_pedido();

-- =====================================================
-- TRIGGER: Actualizar estado de reservas de stock
-- =====================================================
-- Cuando se crea una guía, las reservas pasan de ACTIVA a DESPACHADA
-- Cuando se anula una guía, las reservas vuelven a ACTIVA

CREATE OR REPLACE FUNCTION ventas.actualizar_estado_reserva()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Cuando se crea un detalle de guía, marcar la reserva como DESPACHADA
        UPDATE almacen.reservas_stock
        SET
            estado = 'DESPACHADA',
            fecha_liberacion = CURRENT_TIMESTAMP
        WHERE id_detalle_pedido = NEW.detalle_pedido_id
          AND estado = 'ACTIVA';

        RETURN NEW;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        -- Cuando se elimina un detalle de guía (anulación), restaurar reserva a ACTIVA
        UPDATE almacen.reservas_stock
        SET
            estado = 'ACTIVA',
            fecha_liberacion = NULL
        WHERE id_detalle_pedido = OLD.detalle_pedido_id
          AND estado = 'DESPACHADA';

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar reservas al crear guía
DROP TRIGGER IF EXISTS trigger_actualizar_reserva_insert ON ventas.detalle_guia_remision;
CREATE TRIGGER trigger_actualizar_reserva_insert
    AFTER INSERT ON ventas.detalle_guia_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.actualizar_estado_reserva();

-- Trigger para restaurar reservas al anular guía
DROP TRIGGER IF EXISTS trigger_actualizar_reserva_delete ON ventas.detalle_guia_remision;
CREATE TRIGGER trigger_actualizar_reserva_delete
    AFTER DELETE ON ventas.detalle_guia_remision
    FOR EACH ROW
    EXECUTE FUNCTION ventas.actualizar_estado_reserva();

-- =====================================================
-- TRIGGER: Actualizar estado del pedido automáticamente
-- =====================================================
-- Cambia el estado del pedido según las cantidades despachadas:
-- - PENDIENTE: Ningún producto despachado (o solo parcialmente)
-- - EN PREPARACIÓN: Guía en proceso (se usa manualmente)
-- - DESPACHADO: Todos los productos completamente despachados
-- - ENTREGADO: Cliente recibió la mercadería (se actualiza manualmente)
-- - FACTURADO: Se emitió factura (se actualiza manualmente)

-- =====================================================
-- ACTUALIZACIÓN: Trigger de estado de pedido
-- =====================================================
-- Este trigger ahora maneja correctamente 3 estados:
-- - PENDIENTE: Ningún producto despachado
-- - PARCIAL: Algunos productos despachados
-- - DESPACHADO: Todos los productos despachados
-- =====================================================

CREATE OR REPLACE FUNCTION ventas.actualizar_estado_pedido()
RETURNS TRIGGER AS $$
DECLARE
    v_pedido_id INTEGER;
    v_total_productos INTEGER;
    v_productos_completados INTEGER;
    v_productos_parciales INTEGER;
    v_nuevo_estado VARCHAR(20);
BEGIN
    -- Obtener el pedido_id del detalle que cambió
    IF (TG_OP = 'UPDATE') THEN
        v_pedido_id := NEW.pedido_id;
    ELSIF (TG_OP = 'INSERT') THEN
        v_pedido_id := NEW.pedido_id;
    ELSIF (TG_OP = 'DELETE') THEN
        v_pedido_id := OLD.pedido_id;
    END IF;

    -- Contar total de productos del pedido
    SELECT COUNT(*)
    INTO v_total_productos
    FROM ventas.detalle_pedidos_cliente
    WHERE pedido_id = v_pedido_id;

    -- Contar productos completamente despachados (cantidad_pendiente = 0)
    SELECT COUNT(*)
    INTO v_productos_completados
    FROM ventas.detalle_pedidos_cliente
    WHERE pedido_id = v_pedido_id
      AND cantidad_pendiente = 0;

    -- Contar productos parcialmente despachados
    SELECT COUNT(*)
    INTO v_productos_parciales
    FROM ventas.detalle_pedidos_cliente
    WHERE pedido_id = v_pedido_id
      AND cantidad_despachada > 0
      AND cantidad_pendiente > 0;

    -- Determinar nuevo estado
    IF v_productos_completados = v_total_productos THEN
        -- TODOS los productos fueron despachados completamente
        v_nuevo_estado := 'DESPACHADO';
    ELSIF v_productos_completados > 0 OR v_productos_parciales > 0 THEN
        -- ALGUNOS productos despachados (total o parcialmente)
        v_nuevo_estado := 'PARCIAL';
    ELSE
        -- NINGÚN producto fue despachado
        v_nuevo_estado := 'PENDIENTE';
    END IF;

    -- Log para debugging
    RAISE NOTICE 'Pedido %: Total productos: %, Completados: %, Parciales: %, Nuevo estado: %',
        v_pedido_id, v_total_productos, v_productos_completados, v_productos_parciales, v_nuevo_estado;

    -- Actualizar estado del pedido (solo si no está en estado final)
    UPDATE ventas.pedidos_cliente
    SET
        estado = v_nuevo_estado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_pedido = v_pedido_id
      AND estado NOT IN ('ENTREGADO', 'FACTURADO', 'ANULADO');

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger (no es necesario DROP porque CREATE OR REPLACE lo reemplaza)
DROP TRIGGER IF EXISTS trigger_actualizar_estado_pedido ON ventas.detalle_pedidos_cliente;
CREATE TRIGGER trigger_actualizar_estado_pedido
    AFTER UPDATE OF cantidad_despachada ON ventas.detalle_pedidos_cliente
    FOR EACH ROW
    WHEN (OLD.cantidad_despachada IS DISTINCT FROM NEW.cantidad_despachada)
    EXECUTE FUNCTION ventas.actualizar_estado_pedido();

-- =====================================================
-- NOTA: Los documentos GR1, GR3 y GR5 ya existen en public.documentos
-- (fueron insertados en 25-09.sql)
-- GR1 = Salida de venta (ventas normales) - SE USA AQUÍ
-- GR3 = Movimientos, traslado y devoluciones
-- GR5 = Venta de Arequipa
-- =====================================================

---- FACTURACIÓN


CREATE TABLE ventas.facturas (
    id_factura SERIAL PRIMARY KEY,
    numero_factura VARCHAR(20) UNIQUE,
    serie VARCHAR(10),
    pedido_id INTEGER REFERENCES ventas.pedidos_cliente(id_pedido),
    guia_remision_id INTEGER REFERENCES ventas.guias_remision(id_guia),
    cliente_id INTEGER REFERENCES ventas.clientes(id_cliente),
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    moneda_id INTEGER REFERENCES contabilidad.cod_moneda(id_moneda),
    tipo_cambio NUMERIC(10,4),
    subtotal NUMERIC(14,2),
    igv NUMERIC(14,2),
    total NUMERIC(14,2),
    forma_pago VARCHAR(50), -- 'CONTADO', 'CREDITO'
    dias_credito INTEGER,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADO, ANULADO
    estado_sunat VARCHAR(20), -- 'ACEPTADO', 'RECHAZADO', etc.
    xml_sunat TEXT,
    pdf_url TEXT
);


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

    -- Auditoría
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_registro INTEGER REFERENCES public.usuarios(id),

    fecha_modificacion TIMESTAMP,
    usuario_modificacion INTEGER REFERENCES public.usuarios(id)
);


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
CREATE INDEX idx_mov_fecha ON almacen.movimientos (fecha_movimiento DESC);


-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------


-- TABLA PARA MAPEAR CÓDIGOS DE PRODUCTOS TERMINADOS
CREATE TABLE public.codigo_producto_estructura (
    id SERIAL PRIMARY KEY,
    tipo_producto VARCHAR(50) NOT NULL, -- 'RADIADOR', 'INTERCAMBIADOR', etc.
    estructura JSONB NOT NULL, -- Estructura del código
    descripcion_plantilla TEXT NOT NULL, -- Plantilla para la descripción
    estado BOOLEAN DEFAULT TRUE
);

-- INSERTAR LA ESTRUCTURA PARA RADIADORES
INSERT INTO public.codigo_producto_estructura 
(tipo_producto, estructura, descripcion_plantilla) VALUES
('RADIADOR', 
 '{
   "segmentos": [
     {"nombre": "altura", "posicion": 1, "longitud": 2, "tipo": "numero"},
     {"nombre": "ancho", "posicion": 2, "longitud": 2, "tipo": "numero"},
     {"nombre": "letra_altura", "posicion": 3, "longitud": 1, "tipo": "letra", "tabla_equivalencia": "equivalencia_altura"},
     {"nombre": "letra_ancho", "posicion": 4, "longitud": 1, "tipo": "letra", "tabla_equivalencia": "equivalencia_ancho"},
     {"nombre": "hileras", "posicion": 5, "longitud": 1, "tipo": "numero"},
     {"nombre": "tipo_tubo", "posicion": 6, "longitud": 1, "tipo": "letra", "tabla_equivalencia": "equivalencia_tubo"},
     {"nombre": "modelo", "posicion": 7, "longitud": 1, "tipo": "letra", "tabla_equivalencia": "equivalencia_modelo"},
     {"nombre": "parrillas", "posicion": 8, "longitud": 1, "tipo": "letra", "tabla_equivalencia": "equivalencia_parrillas"}
   ]
 }',
 'RADIADOR {modelo} {altura_fraccion}" X {ancho_fraccion}" - {hileras} HILERAS - TUBO {tubo_fraccion}" {parrillas_desc}'
);



-- TABLA DE EQUIVALENCIAS (como en tus imágenes)
CREATE TABLE public.equivalencia_letras (
    id SERIAL PRIMARY KEY,
    tipo_equivalencia VARCHAR(50) NOT NULL, -- 'altura', 'ancho', 'tubo', etc.
    letra CHAR(1) NOT NULL,
    valor_fraccion VARCHAR(20),
    valor_decimal DECIMAL(10,4),
    descripcion VARCHAR(100)
);

-- LIMPIAR EQUIVALENCIAS EXISTENTES (opcional)
-- DELETE FROM public.equivalencia_letras;

-- INSERTAR TODAS LAS EQUIVALENCIAS COMPLETAS
INSERT INTO public.equivalencia_letras (tipo_equivalencia, letra, valor_fraccion, valor_decimal, descripcion) VALUES

-- EQUIVALENCIAS PARA ALTURA (equivalencia_altura)
('equivalencia_altura', 'A', '1/8"', 0.125, 'Un octavo de pulgada'),
('equivalencia_altura', 'B', '3/16"', 0.1875, 'Tres dieciseisavos'),
('equivalencia_altura', 'C', '1/4"', 0.25, 'Un cuarto'),
('equivalencia_altura', 'D', '5/16"', 0.3125, 'Cinco dieciseisavos'),
('equivalencia_altura', 'E', '3/8"', 0.375, 'Tres octavos'),
('equivalencia_altura', 'F', '7/16"', 0.4375, 'Siete dieciseisavos'),
('equivalencia_altura', 'G', '1/2"', 0.5, 'Media pulgada'),
('equivalencia_altura', 'H', '9/16"', 0.5625, 'Nueve dieciseisavos'),
('equivalencia_altura', 'I', '5/8"', 0.625, 'Cinco octavos'),
('equivalencia_altura', 'J', '11/16"', 0.6875, 'Once dieciseisavos'),
('equivalencia_altura', 'K', '3/4"', 0.75, 'Tres cuartos'),
('equivalencia_altura', 'L', '13/16"', 0.8125, 'Trece dieciseisavos'),
('equivalencia_altura', 'M', '7/8"', 0.875, 'Siete octavos'),
('equivalencia_altura', 'N', '15/16"', 0.9375, 'Quince dieciseisavos'),
('equivalencia_altura', 'X', '0"', 0.0, 'Cero'),
('equivalencia_altura', 'Z', '1"', 1.0, 'Una pulgada completa'),

-- EQUIVALENCIAS PARA ANCHO (equivalencia_ancho) - MISMAS QUE ALTURA
('equivalencia_ancho', 'A', '1/8"', 0.125, 'Un octavo de pulgada'),
('equivalencia_ancho', 'B', '3/16"', 0.1875, 'Tres dieciseisavos'),
('equivalencia_ancho', 'C', '1/4"', 0.25, 'Un cuarto'),
('equivalencia_ancho', 'D', '5/16"', 0.3125, 'Cinco dieciseisavos'),
('equivalencia_ancho', 'E', '3/8"', 0.375, 'Tres octavos'),
('equivalencia_ancho', 'F', '7/16"', 0.4375, 'Siete dieciseisavos'),
('equivalencia_ancho', 'G', '1/2"', 0.5, 'Media pulgada'),
('equivalencia_ancho', 'H', '9/16"', 0.5625, 'Nueve dieciseisavos'),
('equivalencia_ancho', 'I', '5/8"', 0.625, 'Cinco octavos'),
('equivalencia_ancho', 'J', '11/16"', 0.6875, 'Once dieciseisavos'),
('equivalencia_ancho', 'K', '3/4"', 0.75, 'Tres cuartos'),
('equivalencia_ancho', 'L', '13/16"', 0.8125, 'Trece dieciseisavos'),
('equivalencia_ancho', 'M', '7/8"', 0.875, 'Siete octavos'),
('equivalencia_ancho', 'N', '15/16"', 0.9375, 'Quince dieciseisavos'),
('equivalencia_ancho', 'X', '0"', 0.0, 'Cero'),
('equivalencia_ancho', 'Z', '1"', 1.0, 'Una pulgada completa'),

-- EQUIVALENCIAS PARA TIPO DE TUBO (equivalencia_tubo)
('equivalencia_tubo', 'K', '3/4"', 0.75, 'TUBO DE 3/4"'),
('equivalencia_tubo', 'G', '1/2"', 0.5, 'TUBO DE 1/2"'),
('equivalencia_tubo', 'H', NULL, NULL, 'TUBO CATERPILLAR PASO 15,8'),
('equivalencia_tubo', 'A', NULL, NULL, 'TUBO CATERPILLAR PASO 11MM'),

-- INSERTAR EQUIVALENCIAS CORRECTAS PARA MODELO (SEGUNDA LETRA)
('equivalencia_modelo', 'L', NULL, NULL, 'LOUVERS'),
('equivalencia_modelo', 'D', NULL, NULL, 'DIMPLES'),
('equivalencia_modelo', 'V', NULL, NULL, 'VOLVO PASO 11'),
('equivalencia_modelo', 'W', NULL, NULL, 'VOLVO PASO 7,9'),
('equivalencia_modelo', 'C', NULL, NULL, 'CATERPILLAR'),

-- INSERTAR EQUIVALENCIAS CORRECTAS PARA PARRILAS/MATERIAL (ÚLTIMA LETRA)
('equivalencia_parrillas', 'S', NULL, NULL, 'PARRILAS ESPECIALES'),
('equivalencia_parrillas', 'E', NULL, NULL, 'ESTAÑOS EN ALETAS'),
('equivalencia_parrillas', 'L', NULL, NULL, 'MATERIAL DE ALETAS EN LATON');


-- =====================================================
-- FIN MÓDULO: NOTAS DE INGRESO DE ALMACÉN
-- =====================================================


-------------------------------------
-- Crear tabla de reservas de stock--
-------------------------------------
CREATE TABLE IF NOT EXISTS almacen.reservas_stock (
    id_reserva SERIAL PRIMARY KEY,

    -- Relaciones
    pedido_id INTEGER NOT NULL REFERENCES ventas.pedidos_cliente(id_pedido) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES almacen.productos(id_producto),
    id_detalle_pedido INTEGER NOT NULL REFERENCES ventas.detalle_pedidos_cliente(id_detalle_pedido) ON DELETE CASCADE,

    -- Cantidades
    cantidad_reservada DECIMAL(12, 3) NOT NULL CHECK (cantidad_reservada > 0),

    -- Auditoría
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_liberacion TIMESTAMP,
    usuario_id INTEGER REFERENCES public.usuarios(id),

    -- Estado
    estado VARCHAR(20) DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'LIBERADA', 'DESPACHADA', 'CANCELADA')),

    -- Observaciones
    observacion TEXT,

    -- Evitar duplicados
    UNIQUE (id_detalle_pedido, producto_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_reservas_pedido ON almacen.reservas_stock(pedido_id);
CREATE INDEX idx_reservas_producto ON almacen.reservas_stock(producto_id);
CREATE INDEX idx_reservas_estado ON almacen.reservas_stock(estado);
CREATE INDEX idx_reservas_detalle ON almacen.reservas_stock(id_detalle_pedido);

-- Comentarios
COMMENT ON TABLE almacen.reservas_stock IS 'Tabla para gestionar reservas de stock cuando hay disponibilidad parcial';
COMMENT ON COLUMN almacen.reservas_stock.cantidad_reservada IS 'Cantidad de producto reservada para el pedido';
COMMENT ON COLUMN almacen.reservas_stock.estado IS 'ACTIVA: Reserva vigente | LIBERADA: Stock liberado | DESPACHADA: Productos entregados | CANCELADA: Pedido cancelado';

-- ================================================
-- FUNCIÓN: Calcular stock disponible real
-- (considera stock actual - reservas activas)
-- ================================================
CREATE OR REPLACE FUNCTION almacen.calcular_stock_disponible(p_producto_id INTEGER)
RETURNS DECIMAL(12, 3) AS $$
DECLARE
    v_stock_actual DECIMAL(12, 3);
    v_stock_reservado DECIMAL(12, 3);
    v_stock_disponible DECIMAL(12, 3);
BEGIN
    -- Obtener stock actual
    SELECT COALESCE(stock_actual, 0)
    INTO v_stock_actual
    FROM almacen.productos
    WHERE id_producto = p_producto_id;

    -- Calcular total de reservas activas
    SELECT COALESCE(SUM(cantidad_reservada), 0)
    INTO v_stock_reservado
    FROM almacen.reservas_stock
    WHERE producto_id = p_producto_id
      AND estado = 'ACTIVA';

    -- Stock disponible = Stock actual - Stock reservado
    v_stock_disponible := v_stock_actual - v_stock_reservado;

    -- Asegurar que no sea negativo
    IF v_stock_disponible < 0 THEN
        v_stock_disponible := 0;
    END IF;

    RETURN v_stock_disponible;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN: Reservar stock para un detalle de pedido
-- ================================================
CREATE OR REPLACE FUNCTION almacen.reservar_stock(
    p_id_detalle_pedido INTEGER,
    p_pedido_id INTEGER,
    p_producto_id INTEGER,
    p_cantidad_a_reservar DECIMAL(12, 3),
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    reservado BOOLEAN,
    cantidad_reservada DECIMAL(12, 3),
    cantidad_faltante DECIMAL(12, 3),
    mensaje TEXT
) AS $$
DECLARE
    v_stock_disponible DECIMAL(12, 3);
    v_cantidad_final DECIMAL(12, 3);
    v_id_reserva INTEGER;
BEGIN
    -- Calcular stock disponible real
    v_stock_disponible := almacen.calcular_stock_disponible(p_producto_id);

    -- Si no hay stock disponible
    IF v_stock_disponible <= 0 THEN
        RETURN QUERY SELECT
            FALSE,
            0::DECIMAL(12, 3),
            p_cantidad_a_reservar,
            'No hay stock disponible para reservar'::TEXT;
        RETURN;
    END IF;

    -- Determinar cuánto podemos reservar
    IF v_stock_disponible >= p_cantidad_a_reservar THEN
        v_cantidad_final := p_cantidad_a_reservar;
    ELSE
        v_cantidad_final := v_stock_disponible;
    END IF;

    -- Verificar si ya existe una reserva para este detalle
    SELECT id_reserva
    INTO v_id_reserva
    FROM almacen.reservas_stock
    WHERE id_detalle_pedido = p_id_detalle_pedido
      AND producto_id = p_producto_id;

    -- Si existe, actualizar
    IF FOUND THEN
        UPDATE almacen.reservas_stock
        SET cantidad_reservada = v_cantidad_final,
            fecha_reserva = CURRENT_TIMESTAMP,
            estado = 'ACTIVA',
            usuario_id = p_usuario_id
        WHERE id_reserva = v_id_reserva;
    ELSE
        -- Si no existe, insertar nueva reserva
        INSERT INTO almacen.reservas_stock (
            pedido_id,
            producto_id,
            id_detalle_pedido,
            cantidad_reservada,
            usuario_id,
            estado
        ) VALUES (
            p_pedido_id,
            p_producto_id,
            p_id_detalle_pedido,
            v_cantidad_final,
            p_usuario_id,
            'ACTIVA'
        );
    END IF;

    -- Retornar resultado
    RETURN QUERY SELECT
        TRUE,
        v_cantidad_final,
        GREATEST(0, p_cantidad_a_reservar - v_cantidad_final),
        CASE
            WHEN v_cantidad_final = p_cantidad_a_reservar THEN 'Stock reservado completamente'
            ELSE 'Stock reservado parcialmente. Requiere fabricación para el resto'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN: Liberar reservas de un pedido
-- ================================================
CREATE OR REPLACE FUNCTION almacen.liberar_reservas_pedido(
    p_pedido_id INTEGER,
    p_motivo TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_reservas_liberadas INTEGER;
BEGIN
    UPDATE almacen.reservas_stock
    SET estado = 'LIBERADA',
        fecha_liberacion = CURRENT_TIMESTAMP,
        observacion = p_motivo
    WHERE pedido_id = p_pedido_id
      AND estado = 'ACTIVA';

    GET DIAGNOSTICS v_reservas_liberadas = ROW_COUNT;

    RETURN v_reservas_liberadas;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCIÓN: Marcar reserva como despachada
-- ================================================
CREATE OR REPLACE FUNCTION almacen.marcar_reserva_despachada(
    p_id_detalle_pedido INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE almacen.reservas_stock
    SET estado = 'DESPACHADA',
        fecha_liberacion = CURRENT_TIMESTAMP
    WHERE id_detalle_pedido = p_id_detalle_pedido
      AND estado = 'ACTIVA';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- VISTA: Stock con reservas
-- ================================================
CREATE OR REPLACE VIEW almacen.vista_stock_con_reservas AS
SELECT
    p.id_producto,
    p.codigo,
    p.descripcion,
    p.stock_actual,
    COALESCE(r.stock_reservado, 0) as stock_reservado,
    (p.stock_actual - COALESCE(r.stock_reservado, 0)) as stock_disponible,
    p.stock_minimo,
    p.stock_maximo
FROM almacen.productos p
LEFT JOIN (
    SELECT
        producto_id,
        SUM(cantidad_reservada) as stock_reservado
    FROM almacen.reservas_stock
    WHERE estado = 'ACTIVA'
    GROUP BY producto_id
) r ON p.id_producto = r.producto_id;

COMMENT ON VIEW almacen.vista_stock_con_reservas IS 'Vista que muestra el stock actual, reservado y disponible de cada producto';














-- =====================================================
-- SUBMÓDULO: ÓRDENES DE TRABAJO (OT)
-- =====================================================

-- 1. Tabla Principal: Órdenes de Trabajo
CREATE TABLE mantenimiento.ordenes_trabajo (
    id SERIAL PRIMARY KEY,
    
    -- Código OT: Se separa el número para facilitar la lógica de huecos (gaps)
    numero_ot INTEGER NOT NULL UNIQUE, 
    codigo_ot VARCHAR(20) GENERATED ALWAYS AS ('OT-' || numero_ot) STORED,
    
    -- Relaciones
    recepcion_equipo_id INTEGER NOT NULL REFERENCES mantenimiento.recepcion_equipo(id),
    motivo_id INTEGER NOT NULL REFERENCES mantenimiento.motivo_recepcion(id),
    created_by INTEGER REFERENCES public.usuarios(id), -- Usuario que crea la OT
    
    -- Datos de la OT
    prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
    estado VARCHAR(20) NOT NULL DEFAULT 'SOLICITUD' 
        CHECK (estado IN ('SOLICITUD', 'REVISION', 'EVALUACION', 'EJECUCION', 'CERRADA')),
    
    descripcion_trabajo TEXT,
    
    -- Fechas Automáticas (Lógica de negocio 4.2)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio TIMESTAMP,      -- Se llena al pasar a 'EJECUCION'
    fecha_finalizacion TIMESTAMP, -- Se llena al pasar a 'CERRADA'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda rápida
CREATE INDEX idx_ot_codigo ON mantenimiento.ordenes_trabajo(codigo_ot);
CREATE INDEX idx_ot_estado ON mantenimiento.ordenes_trabajo(estado);
CREATE INDEX idx_ot_equipo ON mantenimiento.ordenes_trabajo(recepcion_equipo_id);

-- 2. Tabla Intermedia: Asignación de Técnicos (Multi-select)
CREATE TABLE mantenimiento.ot_tecnicos (
    ot_id INTEGER NOT NULL REFERENCES mantenimiento.ordenes_trabajo(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id),
    asignado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ot_id, usuario_id)
);

-- 3. Tabla: Historial de Estados (Línea de tiempo)
CREATE TABLE mantenimiento.ot_historial_estados (
    id SERIAL PRIMARY KEY,
    ot_id INTEGER NOT NULL REFERENCES mantenimiento.ordenes_trabajo(id) ON DELETE CASCADE,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    usuario_id INTEGER REFERENCES public.usuarios(id), -- Quién hizo el cambio
    nota TEXT, -- Ej: "OT generada automáticamente..."
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: Actividades Realizadas (Mano de Obra)
CREATE TABLE mantenimiento.ot_actividades (
    id SERIAL PRIMARY KEY,
    ot_id INTEGER NOT NULL REFERENCES mantenimiento.ordenes_trabajo(id) ON DELETE CASCADE,
    tecnico_id INTEGER NOT NULL REFERENCES public.usuarios(id),
    
    fecha_actividad DATE NOT NULL DEFAULT CURRENT_DATE,
    tarea_realizada TEXT NOT NULL,
    duracion_horas DECIMAL(5, 2) NOT NULL CHECK (duracion_horas > 0),
    observaciones TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla: Materiales y Repuestos Utilizados
CREATE TABLE mantenimiento.ot_materiales (
    id SERIAL PRIMARY KEY,
    ot_id INTEGER NOT NULL REFERENCES mantenimiento.ordenes_trabajo(id) ON DELETE CASCADE,
    
    -- Relación con productos del almacén (asumiendo esquema almacen.productos)
    producto_codigo VARCHAR(50) NOT NULL REFERENCES almacen.productos(codigo),
    
    cantidad DECIMAL(10, 2) NOT NULL CHECK (cantidad > 0),
    unidad VARCHAR(20) DEFAULT 'UND',
    
    -- Snapshot de costos al momento del uso (para evitar cambios históricos si cambia el precio global)
    costo_unitario DECIMAL(12, 2) NOT NULL,
    costo_total DECIMAL(12, 2) GENERATED ALWAYS AS (ROUND(cantidad * costo_unitario, 2)) STORED,
    
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla: Archivos Adjuntos
CREATE TABLE mantenimiento.ot_adjuntos (
    id SERIAL PRIMARY KEY,
    ot_id INTEGER NOT NULL REFERENCES mantenimiento.ordenes_trabajo(id) ON DELETE CASCADE,
    
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL, -- URL o path en el servidor/S3
    tipo_archivo VARCHAR(50), -- pdf, jpg, zip
    tamano_kb INTEGER,
    
    subido_por INTEGER REFERENCES public.usuarios(id),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LÓGICA AVANZADA (FUNCIONES Y TRIGGERS)
-- =====================================================

-- 7. Función para obtener el siguiente número disponible (Reutilización de IDs - Req 4.1)
-- Lógica: Busca el número más bajo que no existe en la secuencia 1, 2, 3...
CREATE OR REPLACE FUNCTION mantenimiento.fn_obtener_siguiente_numero_ot()
RETURNS INTEGER AS $$
DECLARE
    siguiente_num INTEGER;
BEGIN
    SELECT MIN(t1.numero_ot + 1)
    INTO siguiente_num
    FROM mantenimiento.ordenes_trabajo t1
    LEFT JOIN mantenimiento.ordenes_trabajo t2 ON t1.numero_ot + 1 = t2.numero_ot
    WHERE t2.numero_ot IS NULL;

    -- Si la tabla está vacía o no hay huecos, devuelve el máximo + 1 o inicia en 1
    RETURN COALESCE(siguiente_num, (SELECT COALESCE(MAX(numero_ot), 0) + 1 FROM mantenimiento.ordenes_trabajo));
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para Actualización Automática de Fechas (Req 4.2)
CREATE OR REPLACE FUNCTION mantenimiento.fn_actualizar_fechas_ot()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el estado cambia a EJECUCION y no tiene fecha de inicio, setearla
    IF NEW.estado = 'EJECUCION' AND OLD.estado != 'EJECUCION' THEN
        IF NEW.fecha_inicio IS NULL THEN
            NEW.fecha_inicio = CURRENT_TIMESTAMP;
        END IF;
    END IF;

    -- Si el estado cambia a CERRADA, setear fecha de finalización
    IF NEW.estado = 'CERRADA' AND OLD.estado != 'CERRADA' THEN
        NEW.fecha_finalizacion = CURRENT_TIMESTAMP;
    END IF;

    -- Registrar en historial automáticamente si cambia el estado
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        INSERT INTO mantenimiento.ot_historial_estados (ot_id, estado_anterior, estado_nuevo, usuario_id, nota)
        VALUES (NEW.id, OLD.estado, NEW.estado, NEW.created_by, 'Cambio de estado automático o manual');
    END IF;

    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_fechas_ot
BEFORE UPDATE ON mantenimiento.ordenes_trabajo
FOR EACH ROW
EXECUTE FUNCTION mantenimiento.fn_actualizar_fechas_ot();

-- 9. Trigger para Crear Historial Inicial al Crear OT
CREATE OR REPLACE FUNCTION mantenimiento.fn_historial_inicial_ot()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mantenimiento.ot_historial_estados (ot_id, estado_anterior, estado_nuevo, usuario_id, nota)
    VALUES (NEW.id, NULL, NEW.estado, NEW.created_by, 'OT generada - Estado Inicial');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historial_inicial_ot
AFTER INSERT ON mantenimiento.ordenes_trabajo
FOR EACH ROW
EXECUTE FUNCTION mantenimiento.fn_historial_inicial_ot();

-- =====================================================
-- VISTA DE RESUMEN (Para la Tabla del Frontend)
-- =====================================================

CREATE OR REPLACE VIEW mantenimiento.vw_ordenes_trabajo_listado AS
SELECT 
    ot.id,
    ot.codigo_ot,
    ot.estado,
    ot.prioridad,
    ot.fecha_creacion,
    ot.fecha_inicio,
    ot.fecha_finalizacion,
    
    -- Información del Equipo
    re.codigo_bpc AS equipo_bpc,
    re.marca AS equipo_marca,
    re.modelo AS equipo_modelo,
    mr.nombre AS motivo,
    
    -- Información del Cliente
    c.razon_social AS cliente,
    
    -- Técnicos Asignados (Concatenados para mostrar en tabla)
    (
        SELECT STRING_AGG(u.nombre_completo, ', ') 
        FROM mantenimiento.ot_tecnicos ott
        JOIN public.usuarios u ON ott.usuario_id = u.id
        WHERE ott.ot_id = ot.id
    ) AS tecnicos_asignados,

    -- Totales calculados (útil para dashboards rápidos)
    COALESCE((SELECT SUM(duracion_horas) FROM mantenimiento.ot_actividades WHERE ot_id = ot.id), 0) AS total_horas,
    COALESCE((SELECT SUM(costo_total) FROM mantenimiento.ot_materiales WHERE ot_id = ot.id), 0) AS costo_materiales

FROM mantenimiento.ordenes_trabajo ot
JOIN mantenimiento.recepcion_equipo re ON ot.recepcion_equipo_id = re.id
JOIN mantenimiento.motivo_recepcion mr ON ot.motivo_id = mr.id
JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
ORDER BY ot.prioridad DESC, ot.fecha_creacion DESC;



-- =====================================================
-- TABLA DE TÉCNICOS (No requieren acceso al sistema)
-- =====================================================

CREATE TABLE IF NOT EXISTS mantenimiento.tecnicos (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100), -- Ej: 'Electrónica', 'Mecánica', 'Sistemas'
    telefono VARCHAR(20),
    email VARCHAR(100),
    tarifa_hora DECIMAL(10, 2) DEFAULT 25.00, -- Tarifa por hora para costeo
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_tecnico_email UNIQUE(email)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_tecnicos_nombre ON mantenimiento.tecnicos(nombre_completo);
CREATE INDEX idx_tecnicos_activos ON mantenimiento.tecnicos(estado) WHERE estado = TRUE;

-- Insertar técnicos de prueba
INSERT INTO mantenimiento.tecnicos (nombre_completo, especialidad, telefono, email, tarifa_hora) 
VALUES 
    ('Carlos Rodríguez', 'Electrónica Industrial', '987654321', 'carlos.rodriguez@bpc.com', 30.00),
    ('María González', 'Mecánica de Precisión', '965874123', 'maria.gonzalez@bpc.com', 28.00),
    ('Juan Pérez', 'Sistemas Automatizados', '954123789', 'juan.perez@bpc.com', 32.00),
    ('Ana Torres', 'Calibración y Metrología', '978456123', 'ana.torres@bpc.com', 27.00)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ACTUALIZAR TABLA INTERMEDIA: OT_TECNICOS
-- =====================================================

-- Eliminar constraint antiguo de usuario_id
ALTER TABLE mantenimiento.ot_tecnicos 
DROP CONSTRAINT IF EXISTS ot_tecnicos_usuario_id_fkey;

-- Renombrar columna para mayor claridad
ALTER TABLE mantenimiento.ot_tecnicos 
RENAME COLUMN usuario_id TO tecnico_id;

-- Agregar nueva foreign key a la tabla de tecnicos
ALTER TABLE mantenimiento.ot_tecnicos 
ADD CONSTRAINT fk_ot_tecnicos_tecnico 
FOREIGN KEY (tecnico_id) REFERENCES mantenimiento.tecnicos(id) ON DELETE CASCADE;

-- =====================================================
-- ACTUALIZAR TABLA: OT_ACTIVIDADES
-- =====================================================

-- Eliminar constraint antiguo
ALTER TABLE mantenimiento.ot_actividades 
DROP CONSTRAINT IF EXISTS ot_actividades_tecnico_id_fkey;

-- Agregar nueva foreign key
ALTER TABLE mantenimiento.ot_actividades 
ADD CONSTRAINT fk_ot_actividades_tecnico 
FOREIGN KEY (tecnico_id) REFERENCES mantenimiento.tecnicos(id) ON DELETE RESTRICT;

-- =====================================================
-- ACTUALIZAR VISTA
-- =====================================================

CREATE OR REPLACE VIEW mantenimiento.vw_ordenes_trabajo_listado AS
SELECT 
    ot.id,
    ot.codigo_ot,
    ot.estado,
    ot.prioridad,
    ot.fecha_creacion,
    ot.fecha_inicio,
    ot.fecha_finalizacion,
    
    -- Información del Equipo
    re.codigo_bpc AS equipo_bpc,
    re.marca AS equipo_marca,
    re.modelo AS equipo_modelo,
    mr.nombre AS motivo,
    
    -- Información del Cliente
    c.razon_social AS cliente,
    
    -- Técnicos Asignados (Concatenados) - ✅ Ahora de la tabla tecnicos
    (
        SELECT STRING_AGG(t.nombre_completo, ', ') 
        FROM mantenimiento.ot_tecnicos ott
        JOIN mantenimiento.tecnicos t ON ott.tecnico_id = t.id
        WHERE ott.ot_id = ot.id
    ) AS tecnicos_asignados,

    -- Totales calculados
    COALESCE((SELECT SUM(duracion_horas) FROM mantenimiento.ot_actividades WHERE ot_id = ot.id), 0) AS total_horas,
    COALESCE((SELECT SUM(costo_total) FROM mantenimiento.ot_materiales WHERE ot_id = ot.id), 0) AS costo_materiales

FROM mantenimiento.ordenes_trabajo ot
JOIN mantenimiento.recepcion_equipo re ON ot.recepcion_equipo_id = re.id
JOIN mantenimiento.motivo_recepcion mr ON ot.motivo_id = mr.id
JOIN ventas.clientes c ON re.cliente_id = c.id_cliente
ORDER BY ot.prioridad DESC, ot.fecha_creacion DESC;