import { renderBaseEmailLayout } from './base-layout.template';

export interface AdopcionAprobadaTemplateOptions {
  nombreMascota: string;
}

export function renderAdopcionAprobadaEmail(options: AdopcionAprobadaTemplateOptions): string {
  const { nombreMascota } = options;

  const contentHtml = `
    <!-- Encabezado del contenido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <span style="display: inline-block; background-color: #eaf7ed; color: #1e6b35; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #c7ebd0;">
            🎉 Solicitud Aceptada
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 class="h1-title" style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; color: #2d1810; font-weight: 700;">
            ¡Vas a darle un hogar a <span style="color: #c85a32;">${nombreMascota}</span>!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-size: 16px; line-height: 26px; color: #5a463e; padding-bottom: 24px;">
          ¡Tenemos una noticia maravillosa! Tu solicitud de adopción para <strong>${nombreMascota}</strong> ha sido <strong>ACEPTADA</strong>. La organización evaluó tu postulación y considera que sos la persona indicada para brindarle una vida llena de amor, cuidados y contención.
        </td>
      </tr>
    </table>

    <!-- Tarjeta de hoja de ruta de adopción -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff9f6; border: 1px solid #f4ded3; border-radius: 14px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #6c2f00; padding-bottom: 14px;">
                🐾 ¿Cómo continúa el proceso de adopción?
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px; color: #c85a32; font-weight: bold;">1.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Contacto directo de la organización:</strong> El refugio a cargo de ${nombreMascota} se comunicará con vos para coordinar los detalles de entrega o encuentro.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px; color: #c85a32; font-weight: bold;">2.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Preparación del espacio:</strong> Asegurate de tener listos sus platitos de comida y agua, una cama confortable y un entorno seguro para recibirlo.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 16px; line-height: 22px; padding-right: 10px; color: #c85a32; font-weight: bold;">3.</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Firma del acuerdo:</strong> Se formalizará el compromiso de tenencia responsable para garantizar el cuidado y seguimiento de ${nombreMascota}.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Consejo de adaptación -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6faf6; border-left: 4px solid #2e8540; border-radius: 0 10px 10px 0; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #1e5628;">
          💡 <strong>Tip de bienestar:</strong> Los primeros días suelen ser de adaptación. Brindale paciencia, cariño y respetá sus tiempos mientras conoce su nuevo hogar.
        </td>
      </tr>
    </table>

    <!-- Cierre cálido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #5a463e; padding-bottom: 8px;">
          ¡Gracias por elegir adoptar y cambiarle el destino a un animal rescatado!
        </td>
      </tr>
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #6c2f00; font-weight: 600;">
          Con mucha emoción y cariño,<br>
          El equipo de Hearts &amp; Paws 🐾
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    title: `¡Solicitud Aceptada! Vas a adoptar a ${nombreMascota} - Hearts & Paws`,
    preheader: `¡Buenas noticias! Tu solicitud de adopción para ${nombreMascota} ha sido aprobada.`,
    contentHtml,
  });
}
