//send success response
module.exports.successapi = async (res, message, statusCode = 200, data = null, extras = null) => {
	const response = {
		message,
		data,
		statusCode,
	};
	if (extras) {
		Object.keys(extras).forEach((key) => {			
			if ({}.hasOwnProperty.call(extras, key)) 
			{
				response[key] = extras[key];
			}
		});
	}
	return res.send(response);
};

// send error response
module.exports.error = async (res, message, statusCode = 500) => {
	const response = {
		statusCode,
		message,
	};
	return res.status(statusCode).send(response);
};
