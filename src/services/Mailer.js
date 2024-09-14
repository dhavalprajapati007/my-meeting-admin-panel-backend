var nodemailer = require("nodemailer");
const { EMAIL_FROM, EMAIL_SERVICE, EMAIL_PASSWORD } = require("../../config/key");
// var key = {
//     "type": "service_account",
//     "project_id": "mymeeting-1578047064123",
//     "private_key_id": "4ed8a2778764c3ee3bf5fb64a25880d9a4b4968e",
//     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCxgIHTdkgW/i5d\ndZK9BjlLHeBY/MXeXn4uMQ2EKkxDaI/fx4uqj7K50mGWJacHnWwOCxsRLFuq3Ddj\nwAV+N9x2wNMwy69nZxSCrgQSVAIDq2NKQCfWm6oaDcPWvFqIwXXYo6NWeFT+ntcd\nhF1RjhWQM6It/I52BIlLSNnJvTVoA2K2PjU3O5W/wD1LOJqI6cT1fQT0vmCn1g2w\nEVTkUqhUo6IcLw1HhlMdMRtdvinCHtR4lS6HT3dFDta3kZ8dYy403tr01gsOr1PF\nsPe0Vqo7FOUg1dmFmpLApB2RL7pMEJi92OB4QLcSvG/6lZct2VUMASd3MejDHMSA\nQqRqkd97AgMBAAECggEACrzP3bdniACLVHsCy+1+9MTTZ/6uh5OmxWuROkAGygMe\nxPZAxCoaMTSBU8BmWMcUnMreMc1BpFXbAe1BR8/gRczHWcnQjAxHyNn3BBbR4l/x\nSzITVt+mzBmuEaTmQySU2OyZOmdgGOEJ+U6jCIZ0VntRIcAH7Cq9FXFMP3BzNR35\nUF/+IfhdkyLiL8hO7FPlWNopQSL5fOjeyQXLVO37ZthEeuQBlqSgepKeg/kJWMnm\nkB82VN7i6REY4sDW4WaWGS1KfH+1/Kb1feQmqoKpbUl7qI2axX3PofBXajjSbV/a\no1UqXaVWFU+ey+jOHNCTVgsKq6s9ONIIU66ddSZ/LQKBgQDyE5eZaNzk4P2KFIEp\nLZFPbNSOoPKu9IrTYECR/1Cz0naAs9Mm5CngWV5Hk00ptwFGlgoA3PJH+xKOHIQy\nQXnSMaEF+OFozb8lWg2ii6jwaryAfd01q85PumJ6Y/+XVYWQYI/nF1zzgCHA7f8H\ngXfPJuYTEvc7+B81UDO2vyehzwKBgQC7thmMV+DeCfZvPWZ0cpI9oTpC6G2aZZ8g\nv2zHf0CiWbXX0QAkmDuKWn+egxW0md7dBI5QLKiOPytDe1UgAGXCcNyKxWDsfUDC\nXfi6E4J/ijmH2+AdFJ5f554+odLyrpcr7p6V0adPCoDY/MsfTva930USFehqePdZ\nzeDxfpqulQKBgQCgOhuTrPbYf5sRc/Txvnl5qr0eEqXO64mf0wuqFuXhwCIzmdLe\n4RJerohas8LVI44ynEjOvW+X+TUU3wcZBIGPgM3l2A/KgLROEscHmY0eZGeUXLq4\nNZl+6A0amWmpTy/ymhdli+84NM0il+S/oRAeCs8qPNlr1hVCAm3YPboLvQKBgAbs\n9xBYhbFriK4eA9O0DnU7p5ykWrbhnPdmWKsbpNTYnn7x9SFkhH3cTO0aRQi+zJw2\n+NE4dJea+QuqVz+xBBAifeCY27SeAm+pa+3hnmT6QpkioagxBI7hStNgwRm3G1jB\nmxRIAfZGmu5mlU/4Z94liLTcHhEfmXC0yeHfG/HpAoGATQ0h09AX4R913dD6Nc2A\nm5KulIH9dlEVkVtUMnra2y7SU1lwHujPviyO7kXDnJ2qHj6i4hcuWFYBAW+r1MNq\nteXHm5+VCIGAxEstFICSm1dkQshwKpDwBm1Gstq9FEE7y3PhZ8VsUyYL/DsWo4vB\nePx9/O3FXtAtOPFfZte/C3k=\n-----END PRIVATE KEY-----\n",
//     "client_email": "mymeeting@mymeeting-1578047064123.iam.gserviceaccount.com",
//     "client_id": "110906309810860647456",
//     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//     "token_uri": "https://oauth2.googleapis.com/token",
//     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/mymeeting%40mymeeting-1578047064123.iam.gserviceaccount.com"
// };

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