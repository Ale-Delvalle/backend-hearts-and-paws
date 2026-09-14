export interface BaseEmailLayoutOptions {
  title: string;
  preheader?: string;
  contentHtml: string;
}

export function renderBaseEmailLayout(options: BaseEmailLayoutOptions): string {
  const { title, preheader = '', contentHtml } = options;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #fff8f5; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; color: #2d1810; }
    @media screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; }
      .content-padding { padding: 24px 18px !important; }
      .header-padding { padding: 24px 18px !important; }
      .footer-padding { padding: 20px 18px !important; }
      .h1-title { font-size: 24px !important; line-height: 30px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #fff8f5; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${
    preheader
      ? `<div style="display: none; font-size: 1px; color: #fff8f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
          ${preheader}
        </div>`
      : ''
  }
  
  <!-- Contenedor Principal Centrado -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff8f5; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 30px 12px 40px 12px;">
        
        <!-- Tarjeta del Correo -->
        <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; border: 1px solid #f0ded5; box-shadow: 0 4px 16px rgba(108, 47, 0, 0.04); overflow: hidden;">
          
          <!-- Encabezado con Identidad Hearts & Paws -->
          <tr>
            <td align="center" class="header-padding" style="background-color: #fff1ea; padding: 32px 30px; border-bottom: 1px solid #f0ded5;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #c85a32; color: #ffffff; font-size: 24px; text-align: center; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(200, 90, 50, 0.3);">
                      🐾
                    </div>
                    <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #6c2f00; letter-spacing: -0.5px; line-height: 32px;">
                      Hearts &amp; Paws
                    </div>
                    <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #a84320; margin-top: 4px;">
                      Red Solidaria de Rescate Animal
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Específico del Mensaje -->
          <tr>
            <td class="content-padding" style="padding: 36px 32px; background-color: #ffffff;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td class="footer-padding" style="background-color: #fffbf9; padding: 28px 30px; border-top: 1px solid #f0ded5; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 13px; font-weight: 600; color: #6c2f00; font-family: 'Playfair Display', Georgia, serif; padding-bottom: 8px;">
                    Cada huella cuenta una historia.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 18px; color: #8c7368; padding-bottom: 16px;">
                    Este es un correo automático generado por la plataforma Hearts &amp; Paws para mantenerte informado sobre tu actividad y solicitudes.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="border-top: 1px dashed #e8d7ce; padding-top: 14px; font-size: 11px; color: #a8948b;">
                    &copy; ${currentYear} Hearts &amp; Paws. Plataforma comunitaria de bienestar animal.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- Fin Tarjeta del Correo -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}
