import { Injectable } from '@angular/core';

export interface VentaFacturaItem {
  nombre: string;
  detalle: string;
  total: number;
}

export interface VentaFacturaData {
  factura: string;
  fecha: Date;
  comercioNombre: string;
  usuarioNombre: string;
  clienteNombre: string;
  clienteDocumento: string;
  items: VentaFacturaItem[];
  subtotal: number;
  valorIva: number;
  porcentajeIva: number;
  total: number;
  anticipoAplicado: number;
  montoCobrado: number;
  pagoCredito: boolean;
  saldoPendiente: number;
}

@Injectable({ providedIn: 'root' })
export class VentaFacturaPrintService {
  imprimir(data: VentaFacturaData): void {
    const html = this.buildDocument(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  }

  private buildDocument(data: VentaFacturaData): string {
    const fecha = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(data.fecha);
    const filas = data.items
      .map(
        (item) =>
          `<tr><td>${this.escape(item.nombre)}<div class="muted">${this.escape(item.detalle)}</div></td><td class="num">${this.money(item.total)}</td></tr>`
      )
      .join('');
    const iva =
      data.valorIva > 0
        ? `<div class="row"><span>IVA ${data.porcentajeIva}%</span><strong>${this.money(data.valorIva)}</strong></div>`
        : '';
    const anticipo =
      data.anticipoAplicado > 0
        ? `<div class="row"><span>(-) Anticipos</span><strong>${this.money(data.anticipoAplicado)}</strong></div>`
        : '';
    const cobro = data.pagoCredito
      ? `<div class="row total"><span>SALDO EN CARTERA</span><strong>${this.money(data.saldoPendiente)}</strong></div>`
      : `<div class="row total"><span>TOTAL COBRADO</span><strong>${this.money(data.montoCobrado)}</strong></div>`;

    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" />
<title>Factura ${this.escape(data.factura)}</title>
<style>
  body { font-family: sans-serif; margin: 0; }
  .ticket { width: 72mm; margin: 0 auto; padding: 4mm 2mm; font-size: 12px; color: #000; }
  .center { text-align: center; }
  .title { font-size: 14px; font-weight: 700; letter-spacing: 0.04em; }
  .divider { border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
  .total { margin-top: 4px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 2px 0; }
  .num { text-align: right; white-space: nowrap; }
  .muted { font-size: 10px; }
  .section { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px; }
</style>
<script>window.addEventListener('load', () => { window.print(); });</script>
</head><body>
<div class="ticket">
  <div class="center title">FACTURA DE VENTA</div>
  <div class="center"><strong>${this.escape(data.comercioNombre)}</strong></div>
  <div class="divider"></div>
  <div class="row"><span>Factura N°</span><strong>${this.escape(data.factura)}</strong></div>
  <div class="row"><span>Fecha</span><span>${fecha}</span></div>
  <div class="row"><span>Usuario</span><span>${this.escape(data.usuarioNombre)}</span></div>
  <div class="divider"></div>
  <div class="section">CLIENTE</div>
  <div>${this.escape(data.clienteNombre)}</div>
  <div class="muted">Doc: ${this.escape(data.clienteDocumento)}</div>
  <div class="divider"></div>
  <div class="section">DETALLE</div>
  <table>${filas}</table>
  <div class="divider"></div>
  <div class="row"><span>Subtotal</span><strong>${this.money(data.subtotal)}</strong></div>
  ${iva}
  <div class="row"><span>Total venta</span><strong>${this.money(data.total)}</strong></div>
  ${anticipo}
  ${cobro}
  <div class="divider"></div>
  <div class="center"><strong>Gracias por su preferencia</strong></div>
</div>
</body></html>`;
  }

  private money(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
