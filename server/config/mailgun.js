const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'KOLEGA <onboarding@resend.dev>' // Besplatni Resend sender za testiranje

const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#E2DDD6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E2DDD6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="
                    background:linear-gradient(135deg,#FF6B35,#FFB800);
                    border-radius:16px;
                    text-align:center;
                    vertical-align:middle;
                    font-size:24px;
                    font-weight:900;
                    color:white;
                    padding:8px 18px;
                  ">K</td>
                  <td style="padding-left:12px;">
                    <div style="font-size:22px;font-weight:900;color:#1C1C1E;letter-spacing:-0.02em;">KOLEGA</div>
                    <div style="font-size:12px;color:#FF6B35;font-weight:600;">Student Hub · Sarajevo</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background:#EEEBE5;
              border-radius:24px;
              padding:40px;
              box-shadow:0 4px 24px rgba(0,0,0,0.08);
              border:1px solid rgba(0,0,0,0.06);
            ">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;text-align:center;">
              <p style="color:#9A9690;font-size:12px;margin:0;">
                © 2025 KOLEGA Student Hub · Sarajevo, Bosna i Hercegovina
              </p>
              <p style="color:#9A9690;font-size:12px;margin:6px 0 0 0;">
                Ovaj email je poslan automatski, ne odgovaraj na njega.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const sendEmail = async (to, subject, html) => {
  try {
    const OWNER_EMAIL = process.env.RESEND_TEST_EMAIL
    const isDev = process.env.NODE_ENV !== 'production'
    const actualTo = isDev ? OWNER_EMAIL : to

    const finalSubject = isDev && to !== OWNER_EMAIL
      ? `[TEST → ${to}] ${subject}`
      : subject

    const result = await resend.emails.send({
      from: FROM,
      to: [actualTo],
      subject: finalSubject,
      html,
    })

    if (result.error) {
      console.error('Resend greška:', result.error)
      throw new Error(result.error.message)
    }

    console.log(`✉️  Email poslan: ${actualTo} | Subject: ${finalSubject}`)
    return result
  } catch (err) {
    console.error('Resend greška:', err)
    throw err
  }
}

// ─── EMAIL FUNKCIJE ───────────────────────────────────────────────

const sendVerificationEmail = async (to, firstName, code) => {
  const html = emailTemplate(`
    <h1 style="font-size:28px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;letter-spacing:-0.02em;">
      Verifikuj svoj nalog 🎓
    </h1>
    <p style="color:#7A7570;font-size:16px;margin:0 0 32px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! Hvala što si se registrovao/la na KOLEGA platformu. 
      Unesi kod ispod da aktiviraš nalog.
    </p>

    <div style="
      background:linear-gradient(135deg,#FF6B35,#FFB800);
      border-radius:18px;padding:32px;text-align:center;margin:0 0 32px 0;
    ">
      <p style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;margin:0 0 12px 0;letter-spacing:0.1em;text-transform:uppercase;">
        Tvoj verifikacijski kod
      </p>
      <div style="font-size:48px;font-weight:900;color:white;letter-spacing:0.18em;font-family:monospace;">
        ${code}
      </div>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0 0;">
        ⏰ Kod vrijedi <strong>15 minuta</strong>
      </p>
    </div>

    <div style="background:#F0EDE8;border-radius:12px;padding:16px;margin:0 0 24px 0;">
      <p style="color:#7A7570;font-size:13px;margin:0;line-height:1.6;">
        🔒 <strong style="color:#1C1C1E;">Sigurnost:</strong> Niko iz KOLEGA tima te neće nikad pitati za ovaj kod. 
        Ako nisi ti inicirao/la registraciju, ignoriši ovaj email.
      </p>
    </div>
  `)

  return sendEmail(to, `${code} – Verifikacijski kod za KOLEGA`, html)
}

const sendWelcomeEmail = async (to, firstName) => {
  const html = emailTemplate(`
    <h1 style="font-size:28px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;letter-spacing:-0.02em;">
      Dobrodošao/la na KOLEGA! 🎉
    </h1>
    <p style="color:#7A7570;font-size:16px;margin:0 0 28px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! Tvoj nalog je uspješno verifikovan. 
      Sada imaš pristup svim funkcijama platforme.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
      ${[
        { emoji: '🛍️', title: 'Student Shop', desc: 'Kupi i prodaj knjige i opremu' },
        { emoji: '🏠', title: 'Stanovi', desc: 'Pronađi smještaj ili cimera' },
        { emoji: '📚', title: 'Instrukcije', desc: 'Zakaži ili ponudi instrukcije' },
        { emoji: '🏢', title: 'Firme & Prakse', desc: 'Pronađi praksu i ocijeni firmu' },
        { emoji: '📄', title: 'Materijali', desc: 'Dijeli i preuzimaj skripte' },
        { emoji: '💼', title: 'Studentski poslovi', desc: 'Tražim i nudim poslove' },
      ].map(f => `
        <tr>
          <td style="padding:5px 0;">
            <table cellpadding="0" cellspacing="0" style="background:#F0EDE8;border-radius:12px;padding:12px 16px;width:100%;">
              <tr>
                <td style="font-size:20px;width:32px;">${f.emoji}</td>
                <td style="padding-left:12px;">
                  <div style="font-weight:700;color:#1C1C1E;font-size:14px;">${f.title}</div>
                  <div style="color:#9A9690;font-size:12px;margin-top:2px;">${f.desc}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')}
    </table>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="
        display:inline-block;
        background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;
        padding:14px 36px;border-radius:14px;text-decoration:none;
      ">
        Idi na platformu →
      </a>
    </div>
  `)

  return sendEmail(to, 'Dobrodošao/la na KOLEGA! 🎓', html)
}

const sendNewInternshipEmail = async (to, firstName, company, internshipTitle) => {
  const html = emailTemplate(`
    <h1 style="font-size:26px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Nova praksa dostupna 🏢
    </h1>
    <p style="color:#7A7570;font-size:15px;margin:0 0 24px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! 
      Upravo je objavljena nova mogućnost prakse.
    </p>

    <div style="
      background:linear-gradient(135deg,rgba(255,107,53,0.1),rgba(255,184,0,0.1));
      border:1px solid rgba(255,107,53,0.2);border-radius:18px;padding:24px;margin:0 0 24px 0;
    ">
      <div style="font-size:18px;font-weight:800;color:#1C1C1E;margin-bottom:6px;">${company}</div>
      <div style="font-size:14px;color:#FF6B35;font-weight:600;">${internshipTitle}</div>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/companies" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Pogledaj praksu →</a>
    </div>
  `)

  return sendEmail(to, `Nova praksa: ${internshipTitle} @ ${company}`, html)
}

const sendNewJobEmail = async (to, firstName, jobTitle, jobType) => {
  const html = emailTemplate(`
    <h1 style="font-size:26px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Novi studentski posao 💼
    </h1>
    <p style="color:#7A7570;font-size:15px;margin:0 0 24px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! 
      Objavljen je novi oglas za studentski posao.
    </p>

    <div style="background:#F0EDE8;border-radius:18px;padding:24px;margin:0 0 24px 0;">
      <div style="font-size:18px;font-weight:800;color:#1C1C1E;margin-bottom:8px;">${jobTitle}</div>
      <span style="font-size:13px;font-weight:600;padding:3px 10px;border-radius:100px;
        background:${jobType === 'NUDIM' ? 'rgba(22,163,74,0.15)' : 'rgba(37,99,235,0.15)'};
        color:${jobType === 'NUDIM' ? '#16A34A' : '#2563EB'};">
        ${jobType === 'NUDIM' ? '💼 Nudim posao' : '🙋 Tražim posao'}
      </span>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Pogledaj oglas →</a>
    </div>
  `)

  return sendEmail(to, `Novi oglas: ${jobTitle}`, html)
}

const sendBookingConfirmationEmail = async (to, firstName, subject, date, tutorName) => {
  const html = emailTemplate(`
    <h1 style="font-size:26px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Termin potvrđen! ✅
    </h1>
    <p style="color:#7A7570;font-size:15px;margin:0 0 24px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! 
      Tvoj termin za instrukcije je potvrđen.
    </p>

    <div style="background:#F0EDE8;border-radius:18px;padding:24px;margin:0 0 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;width:80px;">📚 Predmet</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">${subject}</td></tr>
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;">👨‍🏫 Tutor</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">${tutorName}</td></tr>
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;">📅 Datum</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">
              ${new Date(date).toLocaleString('bs-BA', { dateStyle: 'full', timeStyle: 'short' })}
            </td></tr>
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tutoring/my-bookings" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Moji termini →</a>
    </div>
  `)

  return sendEmail(to, `Termin potvrđen: ${subject} sa ${tutorName}`, html)
}

const sendBookingCancelledEmail = async (to, firstName, subject, date, tutorName) => {
  const html = emailTemplate(`
    <h1 style="font-size:26px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Termin otkazan ❌
    </h1>
    <p style="color:#7A7570;font-size:15px;margin:0 0 24px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>, 
      nažalost tvoj termin je otkazan.
    </p>

    <div style="background:#FFF0ED;border:1px solid rgba(255,59,48,0.2);border-radius:18px;padding:24px;margin:0 0 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;width:80px;">📚 Predmet</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">${subject}</td></tr>
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;">👨‍🏫 Tutor</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">${tutorName}</td></tr>
        <tr><td style="padding:6px 0;color:#9A9690;font-size:13px;">📅 Datum</td>
            <td style="padding:6px 0;color:#1C1C1E;font-size:13px;font-weight:700;">
              ${new Date(date).toLocaleString('bs-BA', { dateStyle: 'full', timeStyle: 'short' })}
            </td></tr>
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tutoring" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Pronađi tutora →</a>
    </div>
  `)

  return sendEmail(to, `Termin otkazan: ${subject} sa ${tutorName}`, html)
}


const sendVerificationResultEmail = async (to, firstName, approved, note) => {
  const html = emailTemplate(approved ? `
    <h1 style="font-size:28px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Čestitamo, verifikovani ste! 🎓✅
    </h1>
    <p style="color:#7A7570;font-size:16px;margin:0 0 28px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>! 
      Tvoj student status je uspješno verifikovan. Na profilu ti se sada prikazuje verifikacijski badge.
    </p>

    <div style="
      background:linear-gradient(135deg,rgba(22,163,74,0.1),rgba(74,222,128,0.1));
      border:1px solid rgba(22,163,74,0.3);
      border-radius:18px;padding:24px;margin:0 0 28px 0;text-align:center;
    ">
      <div style="font-size:48px;margin-bottom:8px;">🎓</div>
      <div style="font-size:18px;font-weight:800;color:#16A34A;">Verifikovani Student</div>
      <div style="font-size:13px;color:#7A7570;margin-top:4px;">KOLEGA · Student Hub</div>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/dashboard" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Idi na platformu →</a>
    </div>
  ` : `
    <h1 style="font-size:28px;font-weight:900;color:#1C1C1E;margin:0 0 8px 0;">
      Zahtjev odbijen ❌
    </h1>
    <p style="color:#7A7570;font-size:16px;margin:0 0 24px 0;line-height:1.5;">
      Zdravo <strong style="color:#1C1C1E;">${firstName}</strong>, 
      nažalost tvoj zahtjev za verifikaciju studenta nije odobren.
    </p>

    ${note ? `
    <div style="background:#FFF0ED;border:1px solid rgba(255,59,48,0.2);border-radius:14px;padding:18px;margin:0 0 24px 0;">
      <p style="color:#FF3B30;font-weight:700;font-size:13px;margin:0 0 6px 0;">Razlog odbijanja:</p>
      <p style="color:#3A3A3C;font-size:14px;margin:0;">${note}</p>
    </div>` : ''}

    <p style="color:#7A7570;font-size:14px;margin:0 0 24px 0;line-height:1.5;">
      Možeš ponovo podnijeti zahtjev sa ispravnom slikom indeksa.
    </p>

    <div style="text-align:center;">
      <a href="${process.env.FRONTEND_URL}/profile" style="
        display:inline-block;background:linear-gradient(135deg,#FF6B35,#FFB800);
        color:white;font-weight:800;font-size:15px;padding:14px 36px;border-radius:14px;text-decoration:none;
      ">Pokušaj ponovo →</a>
    </div>
  `)

  return sendEmail(to, approved
    ? '🎓 Čestitamo! Tvoj student status je verifikovan'
    : '❌ Zahtjev za verifikaciju odbijen',
    html
  )
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendNewInternshipEmail,
  sendNewJobEmail,
  sendBookingConfirmationEmail,
  sendBookingCancelledEmail,
  sendVerificationResultEmail,
}