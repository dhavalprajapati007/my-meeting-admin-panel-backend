var nodemailer = require("nodemailer");
const { EMAIL_FROM, EMAIL_SERVICE, EMAIL_PASSWORD } = require("../../config/key");


var transport = nodemailer.createTransport({
    name: 'mymeeting.co.in',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        type: 'OAuth2',
        user: 'info@brightandsharley.com',
        serviceClient: key.client_id,
        privateKey: key.private_key,
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
});

const sendEmail = (email, emailBody, subject) => {
    var mailOptions = {
        to: email,
        from: `MyMeeting<${EMAIL_FROM}>`,
        subject: subject,
        html: emailBody
    };
    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions).then((result) => {
            resolve(true);
        }).catch(err => {
            console.log(err);
        })
    })
}

const sendMailToSpecificVendor = (data, emailBody) => {
    var mailOptions = {
        to: data.emailCollection,
        from: `MyMeeting<${EMAIL_FROM}>`,
        subject: data.subject,
        html: emailBody
    };
    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions).then((result) => {
            resolve(true);
        }).catch(err => {
            reject(err);
            console.log(err);
        })
    })
}

module.exports = { sendEmail, sendMailToSpecificVendor }