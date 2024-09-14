var http = require("https");

const {
    TEMPLATE_ID, AUTH_KEY, COUNTRY_CODE, FLOW_ID, SENDER_ID,
} = require("../../../config/key");

var otpService = () => {

    var sendOtp = (mobileNumber) => {
        try {
            return new Promise(resolve => {

                //generate otp with country code
                const generateMobileNumber = COUNTRY_CODE + mobileNumber

                var options = {
                    "method": "POST",
                    "hostname": "api.msg91.com",
                    "port": null,
                    "path": "/api/v5/otp?template_id=" + TEMPLATE_ID + "&mobile=" + generateMobileNumber + "&authkey=" + AUTH_KEY,
                    "headers": {
                        "content-type": "application/json"
                    }
                };

                const sentOtp = http.request(options, function (res) {
                    const chunks = [];

                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on("end", function () {
                        const body = Buffer.concat(chunks);
                        resolve(body.toString());
                    });
                });

                sentOtp.end();
            })
        } catch (err) {
            console.log(err);
            return err;
        }
    }

    var verifyOtp = (otp, mobileNumber) => {
        try {
            return new Promise(resolve => {
                var options = {
                    "method": "POST",
                    "hostname": "api.msg91.com",
                    "port": null,
                    "path": "/api/v5/otp/verify?otp=" + otp + "&authkey=" + AUTH_KEY + "&mobile=" + COUNTRY_CODE + mobileNumber,
                    "headers": {
                        "content-type": "application/json"
                    }
                };
                const verifiedOtp = http.request(options, function (res) {
                    const chunks = [];

                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on("end", function () {
                        const body = Buffer.concat(chunks);
                        resolve(body.toString());
                    });
                });

                verifiedOtp.end();
            })
        } catch (err) {
            console.log(err);
            return err;
        }
    }

    var resendOtp = (mobileNumber) => {
        try {
            return new Promise(resolve => {
                var options = {
                    "method": "POST",
                    "hostname": "api.msg91.com",
                    "port": null,
                    "path": "/api/v5/otp/retry?authkey=" + AUTH_KEY + "&mobile=+91" + mobileNumber + "&retrytype=text",
                    "headers": {}
                };

                const sendOtp = http.request(options, function (res) {
                    const chunks = [];

                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on("end", function () {
                        const body = Buffer.concat(chunks);
                        resolve(body.toString());
                    });
                });

                sendOtp.end();
            });
        } catch (err) {
            console.log(err);
            return err;
        }
    }

    var sendSMS = (mobileNumber, message) => {
        try {
            return new Promise(resolve => {

                //generate otp with country code
                const generateMobileNumber = COUNTRY_CODE + mobileNumber

                var options = {
                    "method": "POST",
                    "hostname": "api.msg91.com",
                    "port": null,
                    "path": "/api/v5/flow/",
                    "headers": {
                        "authkey" : AUTH_KEY,
                        "content-type": "application/JSON"
                    }
                };

                var req = http.request(options, function (res) {
                    const chunks = [];

                    res.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    res.on("end", function () {
                        const body = Buffer.concat(chunks);
                        resolve(body.toString());
                    });
                });

                req.write(JSON.stringify({
                    flow_id: FLOW_ID,
                    sender: SENDER_ID,
                    recipients: [{
                        mobiles: generateMobileNumber,
                        var: message
                    }],
                }));

                req.end();
            })
        } catch (err) {
            console.log(err);
            return err;
        }
    }


    return {
        sendOtp,
        verifyOtp,
        resendOtp,
        sendSMS
    }
}

module.exports = otpService;