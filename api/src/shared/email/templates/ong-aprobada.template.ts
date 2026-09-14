import { renderBaseEmailLayout } from './base-layout.template';

export interface OngAprobadaTemplateOptions {
  nombreOrganizacion?: string;
}

export function renderOngAprobadaEmail(options: OngAprobadaTemplateOptions = {}): string {
  const { nombreOrganizacion } = options;
  const nombreTexto = nombreOrganizacion ? `, <span style="color: #c85a32;">${nombreOrganizacion}</span>` : '';

  const contentHtml = `
    <!-- Encabezado del contenido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding-bottom: 20px;">
          <span style="display: inline-block; background-color: #eaf7ed; color: #1e6b35; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #c7ebd0;">
            ✓ Cuenta Verificada y Aprobada
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom: 16px;">
          <h1 class="h1-title" style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; line-height: 36px; color: #2d1810; font-weight: 700;">
            ¡Felicitaciones${nombreTexto}!
          </h1>
        </td>
      </tr>
      <tr>
        <td style="font-size: 16px; line-height: 26px; color: #5a463e; padding-bottom: 24px;">
          Nos alegra enormemente informarte que la documentación y los datos de tu organización han sido revisados y <strong>aprobados exitosamente</strong>. A partir de este momento, tu cuenta forma parte oficial de la red solidaria de <strong>Hearts &amp; Paws</strong>.
        </td>
      </tr>
    </table>

    <!-- Tarjeta de funcionalidades habilitadas -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff9f6; border: 1px solid #f4ded3; border-radius: 14px; margin-bottom: 28px;">
      <tr>
        <td style="padding: 24px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 700; color: #6c2f00; padding-bottom: 14px;">
                🚀 ¿Qué podés hacer ahora desde tu panel?
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 18px; line-height: 22px; padding-right: 12px;">🐶</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Publicar animales en adopción:</strong> Crea perfiles atractivos con fotos, historias y detalles de salud para encontrarles el hogar ideal.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 18px; line-height: 22px; padding-right: 12px;">📋</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Gestionar postulaciones:</strong> Recibe solicitudes de adoptantes interesados y coordina todo el proceso de adopción de forma centralizada.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" style="font-size: 18px; line-height: 22px; padding-right: 12px;">✨</td>
                    <td style="font-size: 14px; line-height: 22px; color: #4a3830;">
                      <strong>Visibilidad comunitaria:</strong> Tu organización cuenta con sello verificado, generando confianza y cercanía con la comunidad.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Mensaje informativo de acceso -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6faf6; border-left: 4px solid #2e8540; border-radius: 0 10px 10px 0; margin-bottom: 28px;">
      <tr>
        <td style="padding: 14px 18px; font-size: 13px; line-height: 20px; color: #1e5628;">
          🔐 <strong>Acceso al panel:</strong> Ya podés iniciar sesión en la plataforma con el correo electrónico y contraseña que registraste para comenzar a operar.
        </td>
      </tr>
    </table>

    <!-- Cierre cálido -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #5a463e; padding-bottom: 8px;">
          Gracias por el inmenso compromiso diario con los animales rescatados. Estamos muy felices de caminar juntos en esta misión.
        </td>
      </tr>
      <tr>
        <td style="font-size: 15px; line-height: 24px; color: #6c2f00; font-weight: 600;">
          Con entusiasmo y gratitud,<br>
          El equipo de Hearts &amp; Paws 🐾
        </td>
      </tr>
    </table>
  `;

  return renderBaseEmailLayout({
    title: '¡Tu organización ha sido aprobada! - Hearts & Paws',
    preheader: 'Tu organización ha sido aceptada exitosamente en la plataforma Hearts & Paws.',
    contentHtml,
  });
}
