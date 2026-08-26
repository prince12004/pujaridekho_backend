function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

const HEADING_FONT = "'Poppins','Segoe UI',Helvetica,Arial,sans-serif";
const BODY_FONT = "'Inter','Segoe UI',Helvetica,Arial,sans-serif";

export interface HomeLeadEmailInput {
  name: string;
  mobile: string;
  city: string;
  address: string;
  pooja: string;
  date: string;
}

export function renderHomeLeadEmail(input: HomeLeadEmailInput): string {
  const name = escapeHtml(input.name);
  const mobile = escapeHtml(input.mobile);
  const city = escapeHtml(input.city);
  const address = escapeHtml(input.address);
  const pooja = escapeHtml(input.pooja);
  const date = escapeHtml(input.date);
  const phoneHref = digitsOnly(input.mobile);

  const rows: [string, string][] = [
    ["Name", name],
    ["Mobile", mobile],
    ["City", city],
    ["Address", address],
    ["Puja", pooja],
    ["Preferred Date", date],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], i) => `
        <tr>
          <td style="padding:14px 24px;${i > 0 ? "border-top:1px solid #f0e6d2;" : ""}font-family:${BODY_FONT};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#8a7a63;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="padding:14px 24px;${i > 0 ? "border-top:1px solid #f0e6d2;" : ""}font-family:${BODY_FONT};font-size:15px;font-weight:600;color:#2d1b4e;">${value}</td>
        </tr>`,
    )
    .join("");

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!--[if !mso]><!-->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
    <!--<![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#f0e6d2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0e6d2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(29,16,51,0.08);">

            <tr>
              <td style="background-color:#2d1b4e;background-image:linear-gradient(135deg,#2d1b4e,#1d1033);padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:${HEADING_FONT};font-size:22px;font-weight:700;color:#efd6a0;">
                      🪔 Pujari Dekho
                    </td>
                    <td align="right">
                      <table role="presentation" cellpadding="0" cellspacing="0" align="right">
                        <tr>
                          <td style="font-family:${HEADING_FONT};font-size:12px;font-weight:700;color:#ffffff;background-color:#e65a1e;padding:6px 14px;border-radius:999px;letter-spacing:0.04em;white-space:nowrap;">
                            NEW ENQUIRY
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-family:${HEADING_FONT};font-size:20px;font-weight:700;color:#2d1b4e;">
                  New Puja Booking Enquiry
                </p>
                <p style="margin:6px 0 0 0;font-family:${BODY_FONT};font-size:14px;color:#6b6455;">
                  Submitted just now via the homepage "Book Your Puja" form.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e6d2;border-radius:12px;overflow:hidden;">
                  ${rowsHtml}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background-color:#e65a1e;">
                      <a href="tel:${phoneHref}" style="display:inline-block;padding:12px 22px;font-family:${HEADING_FONT};font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                        📞 Call ${name}
                      </a>
                    </td>
                    <td style="width:12px;">&nbsp;</td>
                    <td style="border-radius:8px;border:1px solid #2d1b4e;">
                      <a href="https://wa.me/91${phoneHref}" style="display:inline-block;padding:12px 22px;font-family:${HEADING_FONT};font-size:14px;font-weight:700;color:#2d1b4e;text-decoration:none;">
                        💬 WhatsApp
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 32px 32px;">
                <p style="margin:0;font-family:${BODY_FONT};font-size:12px;color:#8a7a63;border-top:1px solid #f0e6d2;padding-top:16px;">
                  This is an automated notification from the PujariDekho website. The enquiry is also saved under
                  <strong style="color:#2d1b4e;">Admin Panel → People → Homepage Enquiries</strong>.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
