import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Producto } from '../models/producto.model';

const MOCK_PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: 'PET Cristal',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 450,
    stockUnidad: 'kg',
    precioPorKg: 900,
    estado: 'ACTIVO',
    imagenUrl:
      'https://www.alpla.com/sites/default/files/styles/image_text/public/2025-02/substances-in-pet-bottles-alpla_0.jpg?itok=8flNiT-d',
  },
  {
    id: 2,
    nombre: 'Aluminio',
    clasificacion: 'METALES',
    categoria: 'METALES',
    stock: 2400,
    stockUnidad: 'kg',
    precioPorKg: 4580,
    estado: 'ACTIVO',
    imagenUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReRm_XLFquZKLMT971ZCj_FcMdevEFXBjRkQ&s',
  },
  {
    id: 3,
    nombre: 'Cobre #1',
    clasificacion: 'METALES',
    categoria: 'METALES',
    stock: 1200,
    stockUnidad: 'kg',
    precioPorKg: 24700,
    estado: 'ACTIVO',
    imagenUrl:
      'https://cdn.shopify.com/s/files/1/0593/4235/6578/files/copper-recycling.jpg?v=1749972098',
  },
  {
    id: 4,
    nombre: 'Carton',
    clasificacion: 'PAPEL/CARTÓN',
    categoria: 'PAPEL',
    stock: 890,
    stockUnidad: 'kg',
    precioPorKg: 470,
    estado: 'ACTIVO',
    imagenUrl:
      'https://http2.mlstatic.com/D_NQ_NP_873656-MCO43345387867_092020-O.webp',
  },
  {
    id: 6,
    nombre: 'Bateria',
    clasificacion: 'CHATARRA',
    categoria: 'CHATARRA',
    stock: 3,
    stockUnidad: 'U',
    precioPorKg: 1300,
    estado: 'ACTIVO',
    imagenUrl:
      'https://sistemaverde.com.co/wp-content/uploads/2024/11/22_1_gestion-de-baterias-1024x768.jpg',
  },
  {
    id: 7,
    nombre: 'Chatarra',
    clasificacion: 'CHATARRA',
    categoria: 'CHATARRA',
    stock: 3100,
    stockUnidad: 'kg',
    precioPorKg: 6500,
    estado: 'ACTIVO',
    imagenUrl:
      'https://chatarreriacaparros.es/wp-content/uploads/2020/11/C%C3%B3mo-se-puede-reciclar-la-chatarra.jpg',
  },
  {
    id: 8,
    nombre: 'Archivo',
    clasificacion: 'PAPEL/CARTÓN',
    categoria: 'PAPEL',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://thumbs.dreamstime.com/b/mont%C3%B3n-de-documentos-en-papel-la-oficina-paquetes-pilas-apiladas-sobre-el-escritorio-209856571.jpg',
  },
  {
    id: 9,
    nombre: 'Bronce',
    clasificacion: 'METALES',
    categoria: 'METALES',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZxRIVYadxmZhvgCjA2mK6fG1bEB2mi7WpzA&s',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  },
  {
    id: 9,
    nombre: 'PVC',
    clasificacion: 'PLÁSTICOS',
    categoria: 'PLASTICOS',
    stock: 520,
    stockUnidad: 'kg',
    precioPorKg: 730,
    estado: 'ACTIVO',
    imagenUrl:
      'https://gester.es/img/cms/pvc-reciclaje-y-proceso.jpg',
  }

];

@Injectable({ providedIn: 'root' })
export class ProductosService {
  getActivos(): Observable<Producto[]> {
    return of(MOCK_PRODUCTOS.filter((p) => p.estado === 'ACTIVO'));
  }
}
