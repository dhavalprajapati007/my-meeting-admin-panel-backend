const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
	DELETED_STATUS,
} = require("../../../config/key");
const VendorService = require("../../models/vendorService.model");

var ObjectId = require("mongodb").ObjectID;

//List Vednor Service By service id
exports.getVendorByService = async (data) => {
	try {
		let pipeline = [];
		
        //adding query into the pipeline array
		pipeline.push({
			$match: {
                $expr: {
                    $and: [
                        { $eq: [ "$serviceId", ObjectId(data.serviceId) ] },
                        { $eq: [ "$status", ACTIVE_STATUS ] },
                        { $eq: [ "$available", true ] },
                        { $in: [ "$prefrence",[ data.prefrence, 3 ] ] },
                    ]
                }
			},
		});

        // user lookup
        pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user"
			}
		});

        // service lookup
        pipeline.push({
            $lookup: {
                from: "services",
                localField: "serviceId",
                foreignField: "_id",
                as: "service"
            }
        });

        // reviews lookup
		pipeline.push({
			$lookup: {
				from: 'reviews',
				localField: 'userId',
				foreignField: 'vendorId',
				as: 'reviews'
			}
		})

		// Add avgRatting fields
		pipeline.push({
			$addFields: {
				avgRatting : {
					$avg : { "$ifNull": ["$reviews.review",0 ] } 
				}
			}
		})

		const result = await VendorService.aggregate(pipeline);
		
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};


exports.getById = async (data) => {
	try{
		let pipeline = [];

		// adding query into the pipeline array
		pipeline.push({
			$match: {
                $expr: {
                    $and: [
                        { $eq: [ "$userId", ObjectId(data.userId) ] },
                        { $eq: [ "$status", ACTIVE_STATUS ] }
                    ]
                }
			},
		});
		
		pipeline.push({
			$lookup: {
				from: "languages",
				localField: "languages",
				foreignField: "_id",
				as: "languages"
			}
		})

		const result = await VendorService.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error In GETBYID ', error);
		return false;
	}
}