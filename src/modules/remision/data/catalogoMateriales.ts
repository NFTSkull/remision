import type { CatalogoMaterial } from '../types';

const FECHA = '2026-07-14';

function item(
  id: string,
  nombre: string,
  categoria: string,
  unidad: string,
  precio_min: number,
  precio_max: number,
  fuente_nombre: string,
  fuente_url: string,
  tags: string[],
): CatalogoMaterial {
  const precio_sugerido = Math.round(((precio_min + precio_max) / 2) * 100) / 100;
  return {
    id,
    nombre,
    categoria,
    unidad,
    precio_min,
    precio_max,
    precio_sugerido,
    fuente_nombre,
    fuente_url,
    ultima_actualizacion: FECHA,
    tags,
  };
}

/** Catálogo inicial de materiales y servicios — precios referenciales MX */
export const CATALOGO_MATERIALES: CatalogoMaterial[] = [
  // ── Construcción básica ──
  item('con-001', 'Cemento gris 50 kg', 'Construcción básica', 'saco', 240, 280, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'general', 'ampliacion']),
  item('con-002', 'Cemento gris 25 kg', 'Construcción básica', 'saco', 139, 159, 'Construrama', 'https://www.construrama.com', ['construccion', 'general']),
  item('con-003', 'Arena de río m³', 'Construcción básica', 'm³', 450, 650, 'Construrama', 'https://www.construrama.com', ['construccion', 'general', 'patio', 'ampliacion']),
  item('con-004', 'Grava 3/4 m³', 'Construcción básica', 'm³', 480, 720, 'Construrama', 'https://www.construrama.com', ['construccion', 'patio', 'ampliacion']),
  item('con-005', 'Varilla corrugada 3/8" 12 m', 'Construcción básica', 'pieza', 95, 130, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'ampliacion']),
  item('con-006', 'Varilla corrugada 1/2" 12 m', 'Construcción básica', 'pieza', 145, 195, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'ampliacion']),
  item('con-007', 'Alambre recocido kg', 'Construcción básica', 'kg', 28, 42, 'Construrama', 'https://www.construrama.com', ['construccion', 'ampliacion']),
  item('con-008', 'Block hueco 15x20x40 cm', 'Construcción básica', 'pieza', 14, 22, 'Construrama', 'https://www.construrama.com', ['construccion', 'ampliacion']),
  item('con-009', 'Tabicón 12x24x24 cm', 'Construcción básica', 'pieza', 8, 14, 'Construrama', 'https://www.construrama.com', ['construccion', 'ampliacion']),
  item('con-010', 'Mortero premezclado 25 kg', 'Construcción básica', 'saco', 95, 135, 'Sodimac México', 'https://www.sodimac.com.mx', ['construccion', 'general', 'pisos']),
  item('con-011', 'Yeso construcción 25 kg', 'Construcción básica', 'saco', 85, 120, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'sala', 'recamara', 'yeso']),
  item('con-012', 'Cal hidratada 25 kg', 'Construcción básica', 'saco', 75, 110, 'Construrama', 'https://www.construrama.com', ['construccion', 'general']),
  item('con-013', 'Polvo de roca 40 kg', 'Construcción básica', 'saco', 55, 85, 'Construrama', 'https://www.construrama.com', ['construccion', 'pintura']),
  item('con-014', 'Malla ciclonera rollo 10 m', 'Construcción básica', 'rollo', 380, 520, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'patio', 'exterior']),
  item('con-015', 'Impermeabilizante cementoso 20 kg', 'Construcción básica', 'cubeta', 320, 480, 'Sodimac México', 'https://www.sodimac.com.mx', ['construccion', 'impermeabilizacion', 'techo']),
  item('con-016', 'Sellador acrílico 4 L', 'Construcción básica', 'cubeta', 180, 280, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'pintura', 'fachada', 'impermeabilizacion']),
  item('con-017', 'Resanador plástico 4 kg', 'Construcción básica', 'bote', 95, 145, 'Home Depot México', 'https://www.homedepot.com.mx', ['construccion', 'pintura', 'fachada', 'mantenimiento']),
  item('con-018', 'Pasta para juntas 25 kg', 'Construcción básica', 'saco', 110, 165, 'Sodimac México', 'https://www.sodimac.com.mx', ['construccion', 'sala', 'recamara', 'yeso']),

  // ── Pisos y azulejos ──
  item('piso-001', 'Piso cerámico 45x45 cm caja 1.62 m²', 'Pisos y azulejos', 'caja', 280, 520, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'azulejo', 'bano', 'cocina', 'sala', 'recamara', 'lavanderia']),
  item('piso-002', 'Porcelanato 60x60 cm caja 1.44 m²', 'Pisos y azulejos', 'caja', 450, 890, 'Sodimac México', 'https://www.sodimac.com.mx', ['pisos', 'azulejo', 'cocina', 'sala']),
  item('piso-003', 'Piso antiderrapante baño m²', 'Pisos y azulejos', 'm²', 180, 350, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'bano', 'azulejo']),
  item('piso-004', 'Azulejo para muro 20x30 cm caja 1.5 m²', 'Pisos y azulejos', 'caja', 220, 420, 'Home Depot México', 'https://www.homedepot.com.mx', ['azulejo', 'bano', 'cocina', 'lavanderia']),
  item('piso-005', 'Azulejo tipo subway 10x20 cm caja', 'Pisos y azulejos', 'caja', 260, 480, 'Sodimac México', 'https://www.sodimac.com.mx', ['azulejo', 'cocina', 'bano']),
  item('piso-006', 'Pegazulejo blanco 20 kg', 'Pisos y azulejos', 'saco', 115, 145, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'azulejo', 'bano', 'cocina', 'lavanderia']),
  item('piso-007', 'Boquilla flexible 5 kg', 'Pisos y azulejos', 'bote', 85, 130, 'Construrama', 'https://www.construrama.com', ['pisos', 'azulejo', 'bano', 'cocina']),
  item('piso-008', 'Crucetas para azulejo 2 mm paq 200', 'Pisos y azulejos', 'paquete', 35, 65, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'azulejo']),
  item('piso-009', 'Nivelador para piso paq 50', 'Pisos y azulejos', 'paquete', 120, 200, 'Sodimac México', 'https://www.sodimac.com.mx', ['pisos', 'azulejo']),
  item('piso-010', 'Zoclo PVC 10 cm x 2.44 m', 'Pisos y azulejos', 'pieza', 45, 85, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'sala', 'recamara']),
  item('piso-011', 'Zoclo cerámico 8x60 cm', 'Pisos y azulejos', 'pieza', 35, 70, 'Sodimac México', 'https://www.sodimac.com.mx', ['pisos', 'azulejo']),
  item('piso-012', 'Piso exterior antiderrapante m²', 'Pisos y azulejos', 'm²', 220, 420, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'patio', 'exterior']),
  item('piso-013', 'Loseta de cantera 30x30 cm', 'Pisos y azulejos', 'm²', 350, 650, 'Construrama', 'https://www.construrama.com', ['pisos', 'patio', 'exterior']),
  item('piso-014', 'Adhesivo porcelanato 20 kg', 'Pisos y azulejos', 'saco', 180, 280, 'Sodimac México', 'https://www.sodimac.com.mx', ['pisos', 'azulejo']),
  item('piso-015', 'Impermeabilizante para loseta 19 L', 'Pisos y azulejos', 'cubeta', 680, 980, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'impermeabilizacion', 'techo']),

  // ── Baño ──
  item('ban-001', 'Sanitario económico blanco', 'Baño', 'pieza', 1200, 2200, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano', 'sanitario']),
  item('ban-002', 'Sanitario intermedio con descarga dual', 'Baño', 'pieza', 2800, 4500, 'Sodimac México', 'https://www.sodimac.com.mx', ['bano', 'sanitario']),
  item('ban-003', 'Lavabo sobreponer 60 cm', 'Baño', 'pieza', 850, 1800, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano']),
  item('ban-004', 'Mezcladora lavabo económica', 'Baño', 'pieza', 280, 380, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano', 'plomeria', 'cocina', 'lavanderia']),
  item('ban-005', 'Mezcladora lavabo media', 'Baño', 'pieza', 1600, 2100, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano', 'plomeria']),
  item('ban-006', 'Regadera con brazo y teléfono', 'Baño', 'juego', 450, 950, 'Sodimac México', 'https://www.sodimac.com.mx', ['bano', 'plomeria']),
  item('ban-007', 'Regadera termostática', 'Baño', 'pieza', 1800, 3500, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano', 'plomeria']),
  item('ban-008', 'Llave angular 1/2"', 'Baño', 'pieza', 45, 85, 'Plomerama', 'https://www.plomerama.com', ['bano', 'plomeria']),
  item('ban-009', 'Sifón flexible para lavabo', 'Baño', 'pieza', 65, 120, 'Plomerama', 'https://www.plomerama.com', ['bano', 'plomeria']),
  item('ban-010', 'Kit accesorios baño 6 piezas', 'Baño', 'juego', 280, 550, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano']),
  item('ban-011', 'Cancel de baño templado 80 cm', 'Baño', 'pieza', 3200, 5800, 'Sodimac México', 'https://www.sodimac.com.mx', ['bano']),
  item('ban-012', 'Tina de baño acrílica 1.50 m', 'Baño', 'pieza', 4500, 8500, 'Home Depot México', 'https://www.homedepot.com.mx', ['bano']),
  item('ban-013', 'Espejo con luminaria 80 cm', 'Baño', 'pieza', 1200, 2400, 'Sodimac México', 'https://www.sodimac.com.mx', ['bano', 'electrico']),
  item('ban-014', 'Válvula de descarga para WC', 'Baño', 'pieza', 180, 380, 'Plomerama', 'https://www.plomerama.com', ['bano', 'plomeria', 'sanitario']),

  // ── Cocina ──
  item('coc-001', 'Tarja acero inoxidable 1 tina', 'Cocina', 'pieza', 850, 1800, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina', 'plomeria']),
  item('coc-002', 'Tarja acero inoxidable 2 tinas', 'Cocina', 'pieza', 1400, 2800, 'Sodimac México', 'https://www.sodimac.com.mx', ['cocina', 'plomeria']),
  item('coc-003', 'Mezcladora monomando cocina', 'Cocina', 'pieza', 650, 1400, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina', 'plomeria']),
  item('coc-004', 'Cubierta granito sintético m²', 'Cocina', 'm²', 1200, 2800, 'Sodimac México', 'https://www.sodimac.com.mx', ['cocina']),
  item('coc-005', 'Cubierta postformada m²', 'Cocina', 'm²', 650, 1200, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina']),
  item('coc-006', 'Mueble base cocina 80 cm', 'Cocina', 'pieza', 1800, 3500, 'Sodimac México', 'https://www.sodimac.com.mx', ['cocina']),
  item('coc-007', 'Alacena cocina 80 cm', 'Cocina', 'pieza', 1200, 2800, 'Sodimac México', 'https://www.sodimac.com.mx', ['cocina']),
  item('coc-008', 'Campana extractora 60 cm', 'Cocina', 'pieza', 1800, 4500, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina', 'electrico']),
  item('coc-009', 'Barra de iluminación LED cocina', 'Cocina', 'pieza', 350, 850, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina', 'electrico']),
  item('coc-010', 'Contacto doble con tierra', 'Cocina', 'pieza', 35, 75, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina', 'electrico', 'sala', 'recamara']),
  item('coc-011', 'Salpicadero azulejo cocina m²', 'Cocina', 'm²', 180, 380, 'Sodimac México', 'https://www.sodimac.com.mx', ['cocina', 'azulejo']),
  item('coc-012', 'Cerradura pasador para alacena', 'Cocina', 'pieza', 45, 95, 'Home Depot México', 'https://www.homedepot.com.mx', ['cocina']),

  // ── Pintura ──
  item('pin-001', 'Pintura vinílica interior 19 L', 'Pintura', 'cubeta', 1069, 1800, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'sala', 'recamara', 'general']),
  item('pin-002', 'Pintura acrílica premium 19 L', 'Pintura', 'cubeta', 1800, 2539, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'sala', 'recamara']),
  item('pin-003', 'Pintura vinílica exterior 19 L', 'Pintura', 'cubeta', 1200, 2200, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'fachada', 'exterior', 'patio']),
  item('pin-004', 'Impermeabilizante acrílico 19 L', 'Pintura', 'cubeta', 1515, 1960, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'impermeabilizacion', 'techo', 'fachada']),
  item('pin-005', 'Sellador acrílico 19 L', 'Pintura', 'cubeta', 680, 1100, 'Sodimac México', 'https://www.sodimac.com.mx', ['pintura', 'fachada', 'impermeabilizacion']),
  item('pin-006', 'Rodillo 9" con felpa', 'Pintura', 'pieza', 45, 95, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'impermeabilizacion', 'techo']),
  item('pin-007', 'Brocha 4"', 'Pintura', 'pieza', 35, 75, 'Construrama', 'https://www.construrama.com', ['pintura', 'impermeabilizacion']),
  item('pin-008', 'Cinta masking 48 mm x 50 m', 'Pintura', 'rollo', 55, 95, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura']),
  item('pin-009', 'Lija agua grano 220 paq 5', 'Pintura', 'paquete', 35, 65, 'Construrama', 'https://www.construrama.com', ['pintura', 'mantenimiento']),
  item('pin-010', 'Thinner estándar 4 L', 'Pintura', 'cubeta', 85, 140, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura']),
  item('pin-011', 'Esmalte alquidal 4 L', 'Pintura', 'cubeta', 280, 480, 'Sodimac México', 'https://www.sodimac.com.mx', ['pintura', 'mantenimiento']),
  item('pin-012', 'Texturizado decorativo 25 kg', 'Pintura', 'saco', 320, 580, 'Home Depot México', 'https://www.homedepot.com.mx', ['pintura', 'fachada', 'sala']),

  // ── Impermeabilización ──
  item('imp-001', 'Impermeabilizante prefabricado rollo 10 m²', 'Impermeabilización', 'rollo', 450, 780, 'Home Depot México', 'https://www.homedepot.com.mx', ['impermeabilizacion', 'techo']),
  item('imp-002', 'Malla de refuerzo poliéster 1 m x 50 m', 'Impermeabilización', 'rollo', 380, 620, 'Sodimac México', 'https://www.sodimac.com.mx', ['impermeabilizacion', 'techo']),
  item('imp-003', 'Impermeabilizante cementoso 25 kg', 'Impermeabilización', 'saco', 280, 420, 'Home Depot México', 'https://www.homedepot.com.mx', ['impermeabilizacion', 'techo']),
  item('imp-004', 'Impermeabilizante asfáltico 19 L', 'Impermeabilización', 'cubeta', 1200, 1800, 'Sodimac México', 'https://www.sodimac.com.mx', ['impermeabilizacion', 'techo']),
  item('imp-005', 'Cepillo alambre para limpieza', 'Impermeabilización', 'pieza', 45, 85, 'Construrama', 'https://www.construrama.com', ['impermeabilizacion', 'techo', 'mantenimiento']),
  item('imp-006', 'Removedor de humedad 4 L', 'Impermeabilización', 'cubeta', 220, 380, 'Home Depot México', 'https://www.homedepot.com.mx', ['impermeabilizacion', 'techo', 'fachada']),
  item('imp-007', 'Geotextil 2 m x 50 m', 'Impermeabilización', 'rollo', 850, 1400, 'Sodimac México', 'https://www.sodimac.com.mx', ['impermeabilizacion', 'techo', 'patio']),
  item('imp-008', 'Primario para impermeabilizante 4 L', 'Impermeabilización', 'cubeta', 180, 320, 'Home Depot México', 'https://www.homedepot.com.mx', ['impermeabilizacion', 'techo']),

  // ── Eléctrico ──
  item('ele-001', 'Cable THW-LS calibre 14 rollo 25 m', 'Eléctrico', 'rollo', 320, 390, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'general', 'sala', 'recamara', 'cocina']),
  item('ele-002', 'Cable THW-LS calibre 12 rollo 100 m', 'Eléctrico', 'rollo', 1400, 1550, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'general']),
  item('ele-003', 'Cable THW-LS calibre 10 rollo 50 m', 'Eléctrico', 'rollo', 1200, 1800, 'Sodimac México', 'https://www.sodimac.com.mx', ['electrico']),
  item('ele-004', 'Contacto polarizado blanco', 'Eléctrico', 'pieza', 28, 55, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'sala', 'recamara', 'cocina']),
  item('ele-005', 'Apagador sencillo', 'Eléctrico', 'pieza', 25, 50, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'sala', 'recamara']),
  item('ele-006', 'Apagador doble', 'Eléctrico', 'pieza', 45, 85, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'sala']),
  item('ele-007', 'Centro de carga 8 circuitos', 'Eléctrico', 'pieza', 380, 650, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico']),
  item('ele-008', 'Centro de carga 12 circuitos', 'Eléctrico', 'pieza', 550, 950, 'Sodimac México', 'https://www.sodimac.com.mx', ['electrico']),
  item('ele-009', 'Pastilla termomagnética 20 A', 'Eléctrico', 'pieza', 85, 150, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico']),
  item('ele-010', 'Tubo conduit PVC 1/2" 3 m', 'Eléctrico', 'pieza', 28, 55, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico']),
  item('ele-011', 'Chalupa metálica 1/2"', 'Eléctrico', 'pieza', 8, 18, 'Construrama', 'https://www.construrama.com', ['electrico']),
  item('ele-012', 'Lámpara LED plafón 18 W', 'Eléctrico', 'pieza', 85, 180, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'sala', 'recamara', 'cocina', 'lavanderia']),
  item('ele-013', 'Luminaria exterior LED', 'Eléctrico', 'pieza', 180, 450, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico', 'patio', 'exterior', 'fachada']),
  item('ele-014', 'Caja de registro octagonal', 'Eléctrico', 'pieza', 18, 35, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico']),

  // ── Plomería ──
  item('plo-001', 'Tubería PVC 1/2" 6 m', 'Plomería', 'pieza', 45, 75, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina', 'lavanderia']),
  item('plo-002', 'Tubería PVC 3/4" 6 m', 'Plomería', 'pieza', 65, 110, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina']),
  item('plo-003', 'Tubería CPVC 1/2" 3 m', 'Plomería', 'pieza', 85, 140, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano']),
  item('plo-004', 'Codo PVC 90° 1/2"', 'Plomería', 'pieza', 8, 18, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina']),
  item('plo-005', 'Tee PVC 1/2"', 'Plomería', 'pieza', 10, 22, 'Plomerama', 'https://www.plomerama.com', ['plomeria']),
  item('plo-006', 'Llave de paso 1/2"', 'Plomería', 'pieza', 55, 120, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina', 'lavanderia']),
  item('plo-007', 'Válvula check 1/2"', 'Plomería', 'pieza', 85, 180, 'Plomerama', 'https://www.plomerama.com', ['plomeria']),
  item('plo-008', 'Cemento PVC 250 ml', 'Plomería', 'bote', 35, 65, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina']),
  item('plo-009', 'Cinta teflón comercial', 'Plomería', 'rollo', 12, 28, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'cocina']),
  item('plo-010', 'Manguera flexible lavabo 40 cm', 'Plomería', 'pieza', 35, 75, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'lavanderia']),
  item('plo-011', 'Coladera con tapa 4"', 'Plomería', 'pieza', 45, 95, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'bano', 'patio']),
  item('plo-012', 'Bomba de agua 1/2 HP', 'Plomería', 'pieza', 1800, 3500, 'Home Depot México', 'https://www.homedepot.com.mx', ['plomeria', 'patio', 'lavanderia']),
  item('plo-013', 'Calentador de paso LP', 'Plomería', 'pieza', 2800, 5500, 'Home Depot México', 'https://www.homedepot.com.mx', ['plomeria', 'bano']),
  item('plo-014', 'Fregadero flexible desagüe 1 1/2"', 'Plomería', 'pieza', 55, 110, 'Plomerama', 'https://www.plomerama.com', ['plomeria', 'cocina', 'lavanderia']),

  // ── Herramienta menor ──
  item('her-001', 'Nivel de burbuja 60 cm', 'Herramienta menor', 'pieza', 120, 250, 'Home Depot México', 'https://www.homedepot.com.mx', ['general', 'pisos', 'construccion']),
  item('her-002', 'Cinta métrica 5 m', 'Herramienta menor', 'pieza', 45, 95, 'Home Depot México', 'https://www.homedepot.com.mx', ['general']),
  item('her-003', 'Mezcladora taladro para pegazulejo', 'Herramienta menor', 'pieza', 85, 180, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'azulejo']),
  item('her-004', 'Cortador de azulejo manual', 'Herramienta menor', 'pieza', 180, 380, 'Sodimac México', 'https://www.sodimac.com.mx', ['pisos', 'azulejo']),
  item('her-005', 'Espátula dentada 1/4"', 'Herramienta menor', 'pieza', 35, 75, 'Home Depot México', 'https://www.homedepot.com.mx', ['pisos', 'azulejo']),
  item('her-006', 'Llave stillson 14"', 'Herramienta menor', 'pieza', 95, 180, 'Home Depot México', 'https://www.homedepot.com.mx', ['plomeria']),
  item('her-007', 'Multímetro digital', 'Herramienta menor', 'pieza', 180, 450, 'Home Depot México', 'https://www.homedepot.com.mx', ['electrico']),
  item('her-008', 'Extensiones andamio (renta/día)', 'Herramienta menor', 'día', 350, 650, 'Construrama', 'https://www.construrama.com', ['fachada', 'pintura', 'exterior']),

  // ── Flete / acarreo ──
  item('fle-001', 'Flete de materiales local', 'Flete / acarreo', 'servicio', 450, 900, 'Ferretería local', '', ['flete', 'general', 'ampliacion']),
  item('fle-002', 'Acarreo de materiales a obra (piso)', 'Flete / acarreo', 'servicio', 350, 750, 'Ferretería local', '', ['flete', 'general']),
  item('fle-003', 'Renta de camioneta 1 ton', 'Flete / acarreo', 'día', 800, 1400, 'Ferretería local', '', ['flete', 'ampliacion']),
  item('fle-004', 'Acarreo de escombro a sitio autorizado', 'Flete / acarreo', 'viaje', 600, 1200, 'Ferretería local', '', ['flete', 'escombro']),
  item('fle-005', 'Maniobras de carga y descarga', 'Flete / acarreo', 'servicio', 400, 800, 'Ferretería local', '', ['flete', 'general']),

  // ── Retiro de escombro ──
  item('esc-001', 'Retiro de escombro ligero m³', 'Retiro de escombro', 'm³', 350, 650, 'Ferretería local', '', ['escombro', 'general', 'bano', 'cocina', 'ampliacion']),
  item('esc-002', 'Retiro de escombro con contenedor', 'Retiro de escombro', 'servicio', 1200, 2500, 'Ferretería local', '', ['escombro', 'general', 'ampliacion']),
  item('esc-003', 'Limpieza final de obra', 'Retiro de escombro', 'servicio', 800, 1800, 'Ferretería local', '', ['escombro', 'general', 'mantenimiento']),
  item('esc-004', 'Demolición de muro no estructural m²', 'Retiro de escombro', 'm²', 180, 380, 'Ferretería local', '', ['escombro', 'ampliacion', 'general']),

  // ── Mano de obra ──
  item('mo-001', 'Mano de obra albañilería jornal', 'Mano de obra', 'jornal', 450, 750, 'Referencia mercado MX', '', ['mano_obra', 'construccion', 'general', 'ampliacion']),
  item('mo-002', 'Mano de obra colocación de piso m²', 'Mano de obra', 'm²', 120, 220, 'Referencia mercado MX', '', ['mano_obra', 'pisos', 'azulejo', 'bano', 'cocina']),
  item('mo-003', 'Mano de obra pintura m²', 'Mano de obra', 'm²', 45, 95, 'Referencia mercado MX', '', ['mano_obra', 'pintura', 'sala', 'recamara', 'fachada']),
  item('mo-004', 'Mano de obra plomería (servicio)', 'Mano de obra', 'servicio', 800, 2500, 'Referencia mercado MX', '', ['mano_obra', 'plomeria', 'bano', 'cocina', 'lavanderia']),
  item('mo-005', 'Mano de obra instalación eléctrica', 'Mano de obra', 'servicio', 800, 2800, 'Referencia mercado MX', '', ['mano_obra', 'electrico']),
  item('mo-006', 'Mano de obra impermeabilización m²', 'Mano de obra', 'm²', 85, 180, 'Referencia mercado MX', '', ['mano_obra', 'impermeabilizacion', 'techo']),
  item('mo-007', 'Mano de obra especializada', 'Mano de obra', 'servicio', 1500, 8000, 'Referencia mercado MX', '', ['mano_obra', 'general', 'bano', 'cocina', 'sala', 'recamara', 'patio', 'fachada', 'ampliacion', 'mantenimiento']),
  item('mo-008', 'Servicio de instalación general', 'Servicios', 'servicio', 600, 3500, 'Referencia mercado MX', '', ['mano_obra', 'general', 'bano', 'cocina', 'electrico', 'plomeria']),
  item('mo-009', 'Material complementario (ajuste)', 'Servicios', 'servicio', 200, 5000, 'Referencia mercado MX', '', ['general', 'mano_obra']),
  item('mo-010', 'Supervisión de obra', 'Servicios', 'servicio', 800, 3000, 'Referencia mercado MX', '', ['mano_obra', 'general', 'ampliacion']),

  // ── Sala / Recámara ──
  item('sal-001', 'Zoclo MDF 10 cm x 2.44 m', 'Construcción básica', 'pieza', 55, 110, 'Home Depot México', 'https://www.homedepot.com.mx', ['sala', 'recamara', 'pisos']),
  item('sal-002', 'Plafón falso de yeso m²', 'Construcción básica', 'm²', 180, 350, 'Sodimac México', 'https://www.sodimac.com.mx', ['sala', 'recamara', 'yeso']),
  item('sal-003', 'Canaleta para LED 2 m', 'Eléctrico', 'pieza', 85, 180, 'Home Depot México', 'https://www.homedepot.com.mx', ['sala', 'recamara', 'electrico']),
  item('sal-004', 'Piso laminado AC4 m²', 'Pisos y azulejos', 'm²', 220, 420, 'Home Depot México', 'https://www.homedepot.com.mx', ['sala', 'recamara', 'pisos']),
  item('sal-005', 'Resane de muros m²', 'Pintura', 'm²', 35, 75, 'Referencia mercado MX', '', ['sala', 'recamara', 'pintura', 'yeso']),

  // ── Patio / Exterior / Fachada ──
  item('pat-001', 'Pintura exterior elastomérica 19 L', 'Pintura', 'cubeta', 1400, 2400, 'Home Depot México', 'https://www.homedepot.com.mx', ['patio', 'exterior', 'fachada', 'pintura']),
  item('pat-002', 'Luminaria empotrable piso exterior', 'Eléctrico', 'pieza', 280, 650, 'Home Depot México', 'https://www.homedepot.com.mx', ['patio', 'exterior', 'electrico']),
  item('pat-003', 'Drenaje francés lineal m', 'Plomería', 'm', 180, 380, 'Plomerama', 'https://www.plomerama.com', ['patio', 'exterior', 'plomeria']),
  item('pat-004', 'Renta de andamio tubular (día)', 'Herramienta menor', 'día', 450, 850, 'Construrama', 'https://www.construrama.com', ['fachada', 'exterior', 'pintura']),
  item('pat-005', 'Impermeabilizante muro exterior 19 L', 'Impermeabilización', 'cubeta', 1300, 2100, 'Home Depot México', 'https://www.homedepot.com.mx', ['fachada', 'exterior', 'impermeabilizacion']),

  // ── Lavandería ──
  item('lav-001', 'Centro de lavado con tarja', 'Cocina', 'pieza', 1200, 2800, 'Home Depot México', 'https://www.homedepot.com.mx', ['lavanderia', 'plomeria']),
  item('lav-002', 'Conexión para lavadora', 'Plomería', 'juego', 85, 180, 'Plomerama', 'https://www.plomerama.com', ['lavanderia', 'plomeria']),
  item('lav-003', 'Mueble organizador lavandería', 'Cocina', 'pieza', 1500, 3200, 'Sodimac México', 'https://www.sodimac.com.mx', ['lavanderia']),

  // ── Mantenimiento ──
  item('man-001', 'Servicio de mantenimiento general', 'Servicios', 'servicio', 500, 3000, 'Referencia mercado MX', '', ['mantenimiento', 'mano_obra', 'general']),
  item('man-002', 'Reparación de filtración puntual', 'Servicios', 'servicio', 600, 2500, 'Referencia mercado MX', '', ['mantenimiento', 'impermeabilizacion', 'plomeria']),
  item('man-003', 'Ajuste de puertas y herrajes', 'Servicios', 'servicio', 350, 1200, 'Referencia mercado MX', '', ['mantenimiento']),
  item('man-004', 'Sellado de juntas y grietas', 'Servicios', 'servicio', 280, 900, 'Referencia mercado MX', '', ['mantenimiento', 'pintura']),
];

export function getCatalogoByTipo(tags: string[]): CatalogoMaterial[] {
  return CATALOGO_MATERIALES.filter((m) => m.tags.some((t) => tags.includes(t)));
}
