import { renderBaseEmailLayout } from './base-layout.template';

export interface RegistroOngTemplateOptions {
  nombreOrganizacion: string;
}

export function renderRegistroOngEmail(options: RegistroOngTemplateOptions): string {
  const { nombreOrganizacion } = options;

  const contentHtml = `
    <!-- Encabezado del contenido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <span style="display: inline-block; background-color: #fceddf; color: #c85a32; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px;">
            Solicitud Recibida
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 class="h1-title" style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; color: #2d1810; font-weight: 700;">
            ¡Gracias por sumarte, <span style="color: #c85a32;">${nombreOrganizacion}</span>!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-size: 16px; line-height: 26px; color: #5a463e; padding-bottom: 24px;">
          Hemos recibido exitosamente la información y documentación de tu organización. Valoramos inmensamente la dedicación, el amor y el compromiso que brindan al rescate, cuidado y protección de animales en situación vulnerable.
        </td>
      </tr>
    </table>

    <!-- Tarjeta informativa de estado y próximos pasos -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff9f6; border: 1px solid #f4ded3; border-radius: 14px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 22px 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #6c2f00; padding-bottom: 12px;">
                📋 ¿Cuáles son los siguientes pasos?
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 15px; line-height: 22px; color: #c85a32; padding-right: 10px; font-weight: bold;">1.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Revisión del equipo:</strong> Verificaremos la documentación y los datos aportados en un plazo estimado de <strong>24 horas</strong>.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 15px; line-height: 22px; color: #c85a32; padding-right: 10px; font-weight: bold;">2.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Notificación de estado:</strong> Te enviaremos un correo informándote si tu cuenta fue <strong>APROBADA</strong> o <strong>RECHAZADA</strong> (en caso de inconsistencias o falta de datos).
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 15px; line-height: 22px; color: #c85a32; padding-right: 10px; font-weight: bold;">3.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Activación del panel:</strong> Con la aprobación, podrás gestionar fichas de adopción y conectar directamente con postulantes.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Recordatorio Spam / Correo no deseado -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef7ee; border-left: 4px solid #d97736; border-radius: 0 10px 10px 0; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #6d4217;">
          💡 <strong>Recordatorio importante:</strong> Si no recibís nuestro correo dentro del plazo previsto, te sugerimos revisar tu carpeta de <em>correo no deseado (spam)</em> o promociones.
        </td>
      </tr>
    </table>

    <!-- Cierre cálido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #5a463e; padding-bottom: 8px;">
          Gracias por confiar en nosotros y por ser parte de este movimiento por el bienestar animal.
        </td>
      </tr>
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #6c2f00; font-weight: 600;">
          Con cariño,<br>
          El equipo de Hearts &amp; Paws 🐾
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    title: '¡Gracias por registrar tu Organización! - Hearts & Paws',
    preheader: `Hemos recibido la solicitud de registro de ${nombreOrganizacion} en Hearts & Paws.`,
    contentHtml,
  });
}
