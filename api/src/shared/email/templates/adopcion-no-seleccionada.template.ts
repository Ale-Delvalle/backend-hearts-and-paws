import { renderBaseEmailLayout } from './base-layout.template';

export interface AdopcionNoSeleccionadaTemplateOptions {
  nombreMascota: string;
}

export function renderAdopcionNoSeleccionadaEmail(
  options: AdopcionNoSeleccionadaTemplateOptions,
): string {
  const { nombreMascota } = options;

  const contentHtml = `
    <!-- Encabezado del contenido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <span style="display: inline-block; background-color: #fceddf; color: #c85a32; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #f7cfc0;">
            🐾 Novedades de Adopción
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 class="h1-title" style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; line-height: 34px; color: #2d1810; font-weight: 700;">
            Actualización sobre la adopción de <span style="color: #c85a32;">${nombreMascota}</span>
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-size: 16px; line-height: 26px; color: #5a463e; padding-bottom: 24px;">
          Queremos agradecerte de todo corazón por haberte postulado para adoptar a <strong>${nombreMascota}</strong>. La organización ha concluido el proceso de selección y, tras una decisión muy difícil debido a las excelentes postulaciones recibidas, en esta oportunidad se ha optado por otro hogar que cumplía con características particulares requeridas para su caso.
        </td>
      </tr>
    </table>

    <!-- Tarjeta de agradecimiento y motivación -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff9f6; border: 1px solid #f4ded3; border-radius: 14px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #6c2f00; padding-bottom: 14px;">
                💛 ¡Tu intención de adoptar transforma vidas!
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 18px; line-height: 22px; padding-right: 12px;">🌱</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Gracias por elegir salvar una vida:</strong> Tu compromiso y cariño hacia los animales en situación de vulnerabilidad son indispensables para nuestra comunidad.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 18px; line-height: 22px; padding-right: 12px;">🐾</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Muchas huellitas te esperan:</strong> Hay muchos otros perros y gatos que continúan buscando un hogar definitivo y seguro como el que vos podés ofrecer.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Mensaje de invitación a seguir postulando -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff8f5; border-left: 4px solid #c85a32; border-radius: 0 10px 10px 0; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #6c2f00;">
          ✨ <strong>¡No bajes los brazos!</strong> Te animamos a seguir explorando los casos de adopción activos en <strong>Hearts &amp; Paws</strong>. Tu próximo gran amigo puede estar esperándote hoy mismo.
        </td>
      </tr>
    </table>

    <!-- Cierre cálido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #5a463e; padding-bottom: 8px;">
          Gracias por ser parte activa del cambio y por tu infinito amor hacia los animales.
        </td>
      </tr>
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #6c2f00; font-weight: 600;">
          Con enorme gratitud,<br>
          El equipo de Hearts &amp; Paws 🐾
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    title: `Actualización sobre tu solicitud para ${nombreMascota} - Hearts & Paws`,
    preheader: `Información sobre el proceso de adopción de ${nombreMascota} en Hearts & Paws.`,
    contentHtml,
  });
}
