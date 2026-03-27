// scripts/utils/mailer.js

import nodemailer from "nodemailer";

export async function sendEmail(issues, user, pass) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  const html = issues.map(i => `
    <p>
      <a href="${i.url}">${i.title}</a><br/>
      Repo: ${i.repo}<br/>
      Comments: ${i.comments}
    </p>
  `).join("");

  await transporter.sendMail({
    from: user,
    to: user,
    subject: `Top ${issues.length} Issues`,
    html
  });
}