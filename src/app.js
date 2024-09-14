//require("./connections/db");
require("./connections/mongodb");
require("dotenv").config();
const { verifyBookingStatus } = require("./services/cronJobs/verifyBookingStatus.cron");

const express = require("express");
const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");
var bodyparser = require("body-parser");
const i18n = require("./i18n/i18n");
const http = require("http");
const https = require("https");
var fs = require('fs');
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const { PORT } = require("../config/key");
const path = require("path");
// let io = require('socket.io')(server, { cors: { origin: "*" } });

// const server = https.createServer({
// 	key: fs.readFileSync('./certs/mymeeting.key', 'utf8'), 
// 	cert: fs.readFileSync('./certs/mymeeting.crt', 'utf8'),
// 	ca: fs.readFileSync('./certs/mymeeting.ca.cert', 'utf8')
// },app);

// Sentry tracing 

Sentry.init({
	dsn: "https://9bda14612ace427097e1d5f56ef57c46@o1095106.ingest.sentry.io/6236645",
	integrations: [
	  // enable HTTP calls tracing
	  new Sentry.Integrations.Http({ tracing: true }),
	  // enable Express.js middleware tracing
	  new Tracing.Integrations.Express({ app }),
	],
  
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


// TODO: Only till alfa remove in beta and change mobile side to json.
app.use(bodyparser.urlencoded({ extended: false }));

app.use(bodyparser.json({ limit: "500mb" }));

// cors
app.use(cors());
app.options("*", cors());

// public path
const publicDirectory = path.join(__dirname, "../public");
app.use(express.static(publicDirectory));

// language file
app.use(i18n);
// app.use((req, res, next) => {
// 	req.io = io;
// 	return next();
// });

// Cron Jobs
// verifyBookingStatus();

// routing
app.get("/", (req, res) => {
	res.send("Testing from the node.");
});

const otp = require("./routes/otp.route");
app.use("/api/v1/otp", otp);

const user = require("./routes/user.route");
app.use("/api/v1/user", user);

const service = require("./routes/service.route");
app.use("/api/v1/service", service);

const office = require("./routes/office.route");
app.use("/api/v1/office", office);

const notification = require("./routes/notification.route");
app.use("/api/v1/notification", notification);

const serviceBooking = require("./routes/serviceBooking.route");
app.use("/api/v1/service-booking", serviceBooking);

const contactus = require("./routes/contactus.route");
app.use("/api/v1/contactus", contactus);

const amenitie = require("./routes/amenitie.route");
app.use("/api/v1/aminitie", amenitie);

const language = require("./routes/language.route");
app.use("/api/v1/language", language);

const physicalPlaceParticipant = require("./routes/physicalPlaceParticipant.route");
app.use("/api/v1/place-participant", physicalPlaceParticipant);

const vendorService = require("./routes/vendorService.route");
app.use("/api/v1/vendor-service", vendorService);

const review = require("./routes/review.route");
app.use("/api/v1/review", review);

const vendorTimeslot = require("./routes/vendorTimeslot.route");
app.use("/api/v1/vendor-timeslot", vendorTimeslot);

const payment = require("./routes/payment.route");
app.use("/api/v1/payment", payment);

const videoRoom = require("./routes/videoRoom.route");
app.use("/api/v1/video-room", videoRoom);

const chat = require("./routes/chat.route");
app.use("/api/v1/chat", chat);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
	// The error id is attached to `res.sentry` to be returned
	// and optionally displayed to the user for support.
	res.statusCode = 500;
	res.end(res.sentry + "\n");
});

//Server Connection
server.listen(PORT, () => {
	console.log("server listening on port : -> ", PORT);
});
