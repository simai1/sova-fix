import templates from '../config/email-templates';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function (to: string, type: string, ...arg: any[]) {
    if (!to) return;
    if (!type) throw new Error('type not specified');

    // @ts-expect-error templates always will have a type
    const replacement = templates[type];
    if (!replacement) throw new Error('not exists');

    const mail = {
        from: process.env.RESEND_FROM_EMAIL,
        to,
        subject: replacement.subject,
        generateTextFromHTML: true,
        html: replacement.template(...arg),
    };

    if (process.env.NODE_ENV !== 'production') return console.log(mail);
    // @ts-expect-error mail object has all required fields
    const response = await resend.emails.send(mail);
    if (response.error) {
        console.log(response.error);
    }
}
