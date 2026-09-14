import { renderBaseEmailLayout } from './base-layout.template';

export interface OngRechazadaTemplateOptions {
  nombreOrganizacion?: string;
  motivo?: string;
}

export function renderOngRechazadaEmail(options: OngRechazadaTemplateOptions = {}): string {
  const { nombreOrganizacion, motivo } = options;
  const nombreTexto = nombreOrganizacion ? ` para <span style="color: #6c2f00;">${nombreOrganizacion}</span>` : '';

  const contentHtml = `
    <!-- Encabezado del contenido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <span style="display: inline-block; background-color: #fff1ec; color: #a33b1e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #f7cfc0;">
            ℹ Solicitud No Aprobada
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 class="h1-title" style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; line-height: 34px; color: #2d1810; font-weight: 700;">
            Actualización sobre tu solicitud${nombreTexto}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-size: 16px; line-height: 26px; color: #5a463e; padding-bottom: 24px;">
          Agradecemos sinceramente el tiempo dedicado al registro de tu organización y tu compromiso con los animales. Tras la revisión de la solicitud, lamentamos informarte que en esta oportunidad <strong>no ha sido posible aprobar tu registro</strong> en Hearts &amp; Paws.
        </td>
      </tr>
    </table>

    ${
      motivo
        ? `
    <!-- Motivo específico si fue provisto -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff6f3; border-left: 4px solid #c85a32; border-radius: 0 10px 10px 0; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <div style="font-size: 13px; font-weight: 700; color: #a33b1e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            Observación del equipo evaluador:
          </div>
          <div style="font-size: 14px; line-height: 22px; color: #5a3828;">
            ${motivo}
          </div>
        </td>
      </tr>
    </table>
    `
        : ''
    }

    <!-- Tarjeta de motivos frecuentes y orientación -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff9f6; border: 1px solid #f4ded3; border-radius: 14px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #6c2f00; padding-bottom: 14px;">
                🔍 Motivos habituales de no validación
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px;">📄</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Documentación observada o ilegible:</strong> Comprobantes, avales o archivos adjuntos que no pudieron ser verificados con claridad.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px;">⚖️</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Inconsistencia en datos provistos:</strong> Datos de contacto, ubicación o representación que difieren de la información registrada.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px;">🛡️</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Políticas de la plataforma:</strong> Requisitos de seguridad orientados a garantizar el bienestar y la transparencia hacia la comunidad adoptante.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Caja de rectificación y soporte -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fbf6f2; border: 1px dashed #d9c4b8; border-radius: 12px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 18px 22px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" style="font-size: 20px; line-height: 24px; padding-right: 12px;">💬</td>
              <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                <strong>¿Considerás que hubo un error o querés aportar nueva documentación?</strong><br>
                Podés responder directamente a este correo electrónico o ponerte en contacto con nuestro equipo para revisar tu caso puntual.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Cierre cálido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #5a463e; padding-bottom: 8px;">
          Te agradecemos nuevamente tu labor desinteresada en favor del bienestar animal.
        </td>
      </tr>
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #6c2f00; font-weight: 600;">
          Atentamente,<br>
          El equipo de Hearts &amp; Paws 🐾
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    title: 'Actualización del estado de tu organización - Hearts & Paws',
    preheader: 'Información importante sobre la revisión de tu solicitud en Hearts & Paws.',
    contentHtml,
  });
}
