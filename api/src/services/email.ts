import { createTransport } from 'nodemailer';
import templates from '../config/email-templates';

const address = process.env.MAIL_USER;
const smtp = createTransport({
    host: process.env.MAIL_HOST,
    port: 587,
    secure: false,
    auth: { user: address, pass: process.env.MAIL_PASS },
});

export default function (to: string, type: string, ...arg: any[]) {
    if (!to) return;
    if (!type) throw new Error('type not specified');

    // @ts-expect-error templates always will have a type
    const replacement = templates[type];
    if (!replacement) throw new Error('not exists');

    const mail = {
        from: { name: 'Messanger Service', address },
        to,
        subject: replacement.subject,
        generateTextFromHTML: true,
        html: replacement.template(...arg),
    };

    if (process.env.NODE_ENV !== 'production') console.log(mail);
    if (address) {
        // @ts-expect-error mail object has all required fields
        smtp.sendMail(mail);
    }
}
