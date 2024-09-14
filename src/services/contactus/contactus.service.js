const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
	DELETED_STATUS,
} = require("../../../config/key");
const ContactusModel = require("../../models/contactus.model");
const { facetHelper } = require("../../helpers/pagination.helper");

//Users List
exports.listContactus = async (data) => {
	try {
		let pipeline = [];
		
        // adding query into the pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and : [
						{
							$eq: [ "$userId", data.userId ]
						},
						{
							$eq : [ "$status", ACTIVE_STATUS ]
						}
					]
				}
			},
		});

		pipeline.push({ $sort: { createdAt: -1 } },  facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ContactusModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};