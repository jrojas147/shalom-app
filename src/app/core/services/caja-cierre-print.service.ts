import { Injectable } from '@angular/core';
import { CajaCierreComprobanteData } from '../models/caja-cierre.model';

@Injectable({ providedIn: 'root' })
export class CajaCierrePrintService {
  imprimir(data: CajaCierreComprobanteData): void {
    const html = this.buildDocument(data);
    if (!this.printWithBlob(html)) {
      this.printWithIframe(html);
    }
  }

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

  private printWithIframe(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    );
    iframe.setAttribute('title', 'Impresión cierre de caja');
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

  private buildDocument(data: CajaCierreComprobanteData): string {
    const diferenciaLabel =
      data.diferencia === 0
        ? 'Cuadra'
        : data.diferencia > 0
          ? 'Sobrante'
          : 'Faltante';

    const observacionHtml = data.observacion
      ? [
          '<div class="ticket__divider"></div>',
          '<div class="ticket__section-title">OBSERVACIÓN</div>',
          `<div class="ticket__line">${this.escapeHtml(data.observacion)}</div>`,
        ].join('\n    ')
      : '';

    return [
      '<!DOCTYPE html>',
      '<html lang="es">',
      '<head>',
      '  <meta charset="utf-8" />',
      `  <title>Cierre de caja #${data.cajaId}</title>`,
      `  <style>${this.styles()}</style>`,
      '</head>',
      '<body>',
      '  <div class="ticket">',
      '    <div class="ticket__center ticket__title">CIERRE DE CAJA</div>',
      `    <div class="ticket__center ticket__subtitle">${this.escapeHtml(data.comercioNombre)}</div>`,
      '    <div class="ticket__divider"></div>',
      `    <div class="ticket__row"><span>Caja N°</span><strong>${data.cajaId}</strong></div>`,
      `    <div class="ticket__row"><span>Apertura</span><span>${this.formatFechaHora(data.openedAt)}</span></div>`,
      `    <div class="ticket__row"><span>Cierre</span><span>${this.formatFechaHora(data.closedAt)}</span></div>`,
      `    <div class="ticket__row"><span>Abrió</span><span>${this.escapeHtml(data.usuarioApertura)}</span></div>`,
      `    <div class="ticket__row"><span>Cerró</span><span>${this.escapeHtml(data.usuarioCierre)}</span></div>`,
      '    <div class="ticket__divider"></div>',
      '    <div class="ticket__section-title">RESUMEN</div>',
      `    <div class="ticket__row"><span>Saldo inicial</span><span>${this.formatMoney(data.saldoInicial)}</span></div>`,
      `    <div class="ticket__row"><span>Ventas</span><span>${this.formatMoney(data.totalVentas)}</span></div>`,
      `    <div class="ticket__row"><span>Pagos proveedor</span><span>${this.formatMoney(data.totalPagosProveedor)}</span></div>`,
      `    <div class="ticket__row"><span>Total ingresos</span><span>${this.formatMoney(data.totalIngresos)}</span></div>`,
      `    <div class="ticket__row"><span>Total egresos</span><span>${this.formatMoney(data.totalEgresos)}</span></div>`,
      '    <div class="ticket__divider"></div>',
      '    <div class="ticket__section-title">MEDIOS DE PAGO</div>',
      `    ${this.buildMediosHtml(data)}`,
      '    <div class="ticket__divider"></div>',
      `    <div class="ticket__row"><span>Saldo teórico</span><strong>${this.formatMoney(data.saldoTeorico)}</strong></div>`,
      `    <div class="ticket__row"><span>Saldo contado</span><strong>${this.formatMoney(data.saldoCierre)}</strong></div>`,
      '    <div class="ticket__row ticket__total">',
      `      <span>Diferencia (${diferenciaLabel})</span>`,
      `      <strong>${this.formatMoney(Math.abs(data.diferencia))}</strong>`,
      '    </div>',
      observacionHtml ? `    ${observacionHtml}` : '',
      '    <div class="ticket__divider"></div>',
      '    <div class="ticket__center ticket__footer">Comprobante de cierre</div>',
      '  </div>',
      '  <script>',
      "    window.addEventListener('load', function () {",
      '      setTimeout(function () {',
      '        window.focus();',
      '        window.print();',
      '      }, 150);',
      '    });',
      '  </script>',
      '</body>',
      '</html>',
    ]
      .filter((line) => line !== '')
      .join('\n');
  }

  private buildMediosHtml(data: CajaCierreComprobanteData): string {
    if (!data.medios?.length) {
      return '<div class="ticket__row"><span>Sin desglose</span><span>—</span></div>';
    }
    return data.medios
      .map((medio) => {
        const detalle = medio.detalle ? ` (${this.escapeHtml(medio.detalle)})` : '';
        const diff =
          Math.abs(medio.diferencia) < 0.009
            ? 'Cuadra'
            : medio.diferencia > 0
              ? `Sobr. ${this.formatMoney(medio.diferencia)}`
              : `Falt. ${this.formatMoney(Math.abs(medio.diferencia))}`;
        return [
          '<div class="ticket__medio">',
          `    <div class="ticket__row"><span>${this.escapeHtml(medio.nombre)}${detalle}</span><strong>${this.formatMoney(medio.saldoCierre)}</strong></div>`,
          `    <div class="ticket__row ticket__muted"><span>Teórico ${this.formatMoney(medio.saldoTeorico)}</span><span>${diff}</span></div>`,
          '  </div>',
        ].join('\n');
      })
      .join('\n');
  }

  private styles(): string {
    return `
      @page { size: 80mm auto; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      body {
        width: 76mm; max-width: 76mm; margin: 0 auto; color: #000;
        font-family: "Courier New", Courier, monospace; font-size: 11px; line-height: 1.35;
      }
      .ticket { padding: 2mm 1mm 4mm; }
      .ticket__center { text-align: center; }
      .ticket__title { font-size: 13px; font-weight: 700; letter-spacing: 0.04em; }
      .ticket__subtitle { margin-top: 4px; font-size: 12px; font-weight: 700; }
      .ticket__section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px; }
      .ticket__line { word-break: break-word; }
      .ticket__row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 2px; }
      .ticket__row strong { text-align: right; }
      .ticket__total { margin-top: 4px; font-size: 12px; font-weight: 700; }
      .ticket__divider { border-top: 1px dashed #000; margin: 8px 0; }
      .ticket__footer { margin-top: 4px; font-weight: 700; }
      .ticket__muted { font-size: 10px; color: #333; }
      .ticket__medio { margin-bottom: 4px; }
    `;
  }

  private formatFechaHora(date: Date): string {
    const fecha = date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const hora = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${fecha} ${hora}`;
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
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
