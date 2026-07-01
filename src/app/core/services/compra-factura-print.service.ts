import { Injectable } from '@angular/core';
import {
  compraProveedorTipoLabel,
  CompraProveedorSeleccion,
} from '../models/compra-proveedor.model';
import { CompraFacturaData } from '../models/compra-factura.model';

@Injectable({ providedIn: 'root' })
export class CompraFacturaPrintService {
  imprimir(data: CompraFacturaData): void {
    const html = this.buildDocument(data);
    if (!this.printWithBlob(html)) {
      this.printWithIframe(html);
    }
  }

  /** Abre el ticket en una pestaña visible y dispara impresión desde el propio HTML. */
  private printWithBlob(html: string): boolean {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      URL.revokeObjectURL(url);
      return false;
    }

    printWindow.addEventListener(
      'load',
      () => {
        URL.revokeObjectURL(url);
      },
      { once: true }
    );

    return true;
  }

  /** Respaldo sin ventana emergente: iframe oculto en la misma página. */
  private printWithIframe(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    );
    iframe.setAttribute('title', 'Impresión ticket compra');
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = (): void => {
      iframe.remove();
    };

    win.addEventListener('afterprint', cleanup, { once: true });

    setTimeout(() => {
      if (!document.body.contains(iframe)) {
        return;
      }
      win.focus();
      win.print();
      setTimeout(cleanup, 2000);
    }, 300);
  }

  private buildDocument(data: CompraFacturaData): string {
    const fecha = this.formatFecha(data.fecha);
    const hora = this.formatHora(data.fecha);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${this.escapeHtml(data.factura)}</title>
  <style>${this.styles()}</style>
</head>
<body>
  <div class="ticket">
    <div class="ticket__center ticket__title">COMPROBANTE DE COMPRA</div>
    <div class="ticket__center ticket__subtitle">${this.escapeHtml(data.comercioNombre)}</div>

    <div class="ticket__divider"></div>

    <div class="ticket__row"><span>Factura N°</span><strong>${this.escapeHtml(data.factura)}</strong></div>
    <div class="ticket__row"><span>Fecha</span><span>${fecha}</span></div>
    <div class="ticket__row"><span>Hora</span><span>${hora}</span></div>

    <div class="ticket__divider"></div>
    <div class="ticket__section-title">USUARIO</div>
    <div class="ticket__line">${this.escapeHtml(data.usuarioNombre)}</div>
    <div class="ticket__muted">${this.escapeHtml(data.usuarioUsername)}</div>

    <div class="ticket__divider"></div>
    <div class="ticket__section-title">PROVEEDOR</div>
    ${this.buildProveedorHtml(data.proveedor)}

    <div class="ticket__divider"></div>
    <div class="ticket__section-title">DETALLE</div>
    <table class="ticket__table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Empaque</th>
          <th class="num">Kg</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `<tr>
          <td>
            <div class="item-name">${this.escapeHtml(item.nombre)}</div>
            <div class="item-precio">${this.formatMoney(item.precioKg)} /kg</div>
          </td>
          <td class="item-empaque">${this.escapeHtml(item.empaque)}</td>
          <td class="num">${this.formatPeso(item.pesoKg)}</td>
          <td class="num">${this.formatMoney(item.total)}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <div class="ticket__divider"></div>
    <div class="ticket__row"><span>Peso bruto total</span><strong>${this.formatPeso(data.pesoTotal)} KG</strong></div>
    <div class="ticket__row ticket__total"><span>TOTAL A PAGAR</span><strong>${this.formatMoney(data.total)}</strong></div>

    <div class="ticket__divider"></div>
    <div class="ticket__center ticket__footer">Gracias por su preferencia</div>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });
  </script>
</body>
</html>`;
  }

  private buildProveedorHtml(proveedor: CompraProveedorSeleccion): string {
    const tipo = compraProveedorTipoLabel(proveedor.tipo);
    const lines = [
      `<div class="ticket__row"><span>Tipo</span><span>${tipo}</span></div>`,
      `<div class="ticket__line">${this.escapeHtml(proveedor.nombre)}</div>`,
    ];

    if (proveedor.documento) {
      lines.push(`<div class="ticket__muted">Doc: ${this.escapeHtml(proveedor.documento)}</div>`);
    }

    if (proveedor.tipo === 'INTERNO' && proveedor.sucursalNombre) {
      lines.push('<div class="ticket__divider ticket__divider--thin"></div>');
      lines.push('<div class="ticket__section-title">CONJUNTO / SUCURSAL</div>');
      lines.push(`<div class="ticket__line">${this.escapeHtml(proveedor.sucursalNombre)}</div>`);
      if (proveedor.sucursalNit) {
        lines.push(`<div class="ticket__muted">NIT: ${this.escapeHtml(proveedor.sucursalNit)}</div>`);
      }
      if (proveedor.sucursalMunicipio) {
        lines.push(`<div class="ticket__muted">${this.escapeHtml(proveedor.sucursalMunicipio)}</div>`);
      }
    }

    if (proveedor.tipo === 'EMPRESA') {
      lines.push('<div class="ticket__muted">Empresa proveedora asociada</div>');
    }

    return lines.join('');
  }

  private styles(): string {
    return `
      @page {
        size: 80mm auto;
        margin: 2mm;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
      }

      body {
        width: 76mm;
        max-width: 76mm;
        margin: 0 auto;
        color: #000;
        font-family: "Courier New", Courier, monospace;
        font-size: 11px;
        line-height: 1.35;
      }

      .ticket {
        padding: 2mm 1mm 4mm;
      }

      .ticket__center {
        text-align: center;
      }

      .ticket__title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .ticket__subtitle {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 700;
      }

      .ticket__section-title {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }

      .ticket__line {
        word-break: break-word;
      }

      .ticket__muted {
        color: #222;
        font-size: 10px;
        word-break: break-word;
      }

      .ticket__row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 2px;
      }

      .ticket__row strong {
        text-align: right;
      }

      .ticket__total {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 700;
      }

      .ticket__divider {
        border-top: 1px dashed #000;
        margin: 8px 0;
      }

      .ticket__divider--thin {
        margin: 6px 0;
      }

      .ticket__table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 10px;
      }

      .ticket__table th,
      .ticket__table td {
        vertical-align: top;
        padding: 2px 0;
      }

      .ticket__table th {
        text-align: left;
        font-size: 9px;
        border-bottom: 1px solid #000;
        padding-bottom: 3px;
      }

      .ticket__table th.num,
      .ticket__table td.num {
        text-align: right;
        white-space: nowrap;
      }

      .ticket__table th:nth-child(1),
      .ticket__table td:nth-child(1) {
        width: 34%;
      }

      .ticket__table th:nth-child(2),
      .ticket__table td:nth-child(2) {
        width: 28%;
      }

      .item-name {
        word-break: break-word;
        font-weight: 700;
      }

      .item-precio {
        font-size: 9px;
        color: #000;
        margin-top: 2px;
      }

      .item-empaque {
        word-break: break-word;
        font-size: 10px;
        font-weight: 700;
        color: #000;
      }

      .ticket__footer {
        margin-top: 4px;
        font-weight: 700;
      }
    `;
  }

  private formatFecha(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatHora(date: Date): string {
    return date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatPeso(value: number): string {
    return value.toLocaleString('es-CO', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
  }

  private escapeHtml(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
