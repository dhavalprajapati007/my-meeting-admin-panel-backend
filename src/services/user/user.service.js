const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
	DELETED_STATUS,
} = require("../../../config/key");
const UserModel = require("../../models/user.model");
const WithdrawalRequestModel = require("../../models/withdrawalRequests.model");
const BookingPaymentHistoryModel = require("../../models/bookingPaymentHistory.model");
const { facetHelper } = require("../../helpers/pagination.helper");
const serviceBookingModel = require("../../models/serviceBooking.model");

var ObjectId = require("mongodb").ObjectID;

//Get User
exports.getUser = async (data) => {
	try {
		let pipeline = [];
		
        //adding query into the pipeline array
		pipeline.push({
			$match: {
				_id: ObjectId(data.userId),
				status: ACTIVE_STATUS,
			},
		});

		// serviceVendor lookup
		if(data.role == 2){
			pipeline.push({
				$lookup: {
					from: "vendorService",
					localField: "_id",
					foreignField: "userId",
					as: "vendorService"
				}
			});

			pipeline.push({
				$lookup: {
					from: "vendorTimeslots",
					localField: "_id",
					foreignField: "userId",
					as: "vendorTimeslot"
				}
			});

			pipeline.push({
				$unwind: {
					path: '$vendorService',
					preserveNullAndEmptyArrays: true
				}
			});
	
			pipeline.push({
				$lookup: {
					from: "languages",
					localField: "vendorService.languages",
					foreignField: "_id",
					as: "vendorService.languages"
				}
			});

			pipeline.push({
				$lookup: {
					from: "services",
					localField: "vendorService.serviceId",
					foreignField: "_id",
					as: "vendorService.service"
				}
			});

			pipeline.push({
				$lookup: {
					from: "reviews",
					localField: "_id",
					foreignField: "vendorId",
					as: "reviews"
				}
			});

			// Add avgRatting fields
			pipeline.push({
				$addFields: {
					avgRatting : {
						$avg : { "$ifNull": ["$reviews.review",0 ] } 
					}
				}
			});

			pipeline.push({
				$lookup: {
					from: "serviceBooking",
					let: { vendorId: "$_id" },
					pipeline: [
						{
							$match:
							{
								$expr:
								{
									$or: [
										{ $eq: ["$serviceProviderId","$$vendorId"] },
										{ $eq: ["$placeBookingDetails.vendorId","$$vendorId"] }
									]
								}
							}
						},
					],
					as: "bookings"
				}
			})

			// Add totalBookings fields
			pipeline.push({
				$addFields: {
					totalBookings : {
						$sum : "$bookings.status"
					}
				}
			});
		}

		


		const result = await UserModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};


//Users List
exports.listUsers = async (data) => {
	try {
		let pipeline = [];
		
        //adding query into the pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and : [
						{
							$in: ["$role", data.roles]
						},
						{
							$eq : ["$status", ACTIVE_STATUS]
						}
					]
				}
			},
		});

		// add vendor service if available
		pipeline.push({
			$lookup: {
				from: "vendorService",
				localField: "_id",
				foreignField: "userId",
				as: "vendorService"
			}
		});

		pipeline.push({ $sort: { createdAt: -1 } },  facetHelper(Number(data.skip), Number(data.limit)));
		const result = await UserModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};

// Vendors List
exports.listVendors = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$expr: {
					$and: [
						{ $eq: ["$role", 2] },
						{ $in: ["$vendorDetails.providerType", data.serviceProvider] }
					]
				}
			}
		});

		pipeline.push({
			$match: {
				$expr: {
					$and: [
						{ $eq: ["$vendorDetails.isVerified", data.verified] }
					]
				}
			}
		});

		if(data?.hasOwnProperty("skip") && data.hasOwnProperty("limit")) {
			pipeline.push({ $sort: { createdAt: -1 } },  facetHelper(Number(data.skip),Number(data.limit)));
		} else {
			pipeline.push({ $sort: { createdAt: -1 } } );
		}
		const result = await UserModel.aggregate(pipeline);

		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getAllWithdrawalRequests = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				"status" : { $in : data.status}
			},
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'paymentId': '$paymentMethodId' },
				pipeline: [
					{
						$unwind:
						{
							path: '$vendorDetails.paymentMethods',
							preserveNullAndEmptyArrays: true
						}
						// $expr cannot digest arrays so we need to unwind which hurts performance...
					},
					{
						$match: { $expr: { $eq: [ '$vendorDetails.paymentMethods._id', '$$paymentId' ] } }
					},
					{
						$project: {
							"vendorDetails.paymentMethods" : 1,
						}
						// only include the SPECIFIED field
					}
				],
				as: 'paymentMethodInfo'
			}
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'vendorId': '$vendorId' },
				pipeline: [
					{
						$match: { $expr: { $eq: [ '$_id', '$$vendorId' ] } }
					},
					{
						$project: {
							"lastName" : 1,
							"firstName": 1,
						} 
						// only include the SPECIFIED field
					}
				],
				as: 'vendorInfo'
			}
		});

		pipeline.push({ $sort: { createdAt: -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await WithdrawalRequestModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getWithdrawalRequestByVendor = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$and : [
					{
						"vendorId" : ObjectId(data.userId)
					},
					{
						"status" : { $in : data.status}
					}
				]
			},
		});

		// Fetch data from user's table to show Vendor Details and Payment Details Value 
		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'paymentId': '$paymentMethodId' },
				pipeline: [
					{
						$unwind:
						{
							path: '$vendorDetails.paymentMethods',
							preserveNullAndEmptyArrays: true
						}
						// $expr cannot digest arrays so we need to unwind which hurts performance...
					},
					{
						$match: { $expr: { $eq: [ '$vendorDetails.paymentMethods._id', '$$paymentId' ] } }
					},
					{
						$project: {
							"vendorDetails.paymentMethods" : 1
						} // only include the SPECIFIED field
					}
				],
				as: 'paymentMethodInfo'
			}
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'vendorId': '$vendorId' },
				pipeline: [
					{
						$match: { $expr: { $eq: [ '$_id', '$$vendorId' ] } }
					},
					{
						$project: {
							"firstName": 1,
							"lastName" : 1,
						} 
						// only include the SPECIFIED field
					}
				],
				as: 'vendorInfo'
			}
		});

		pipeline.push({ $sort: { createdAt: -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await WithdrawalRequestModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getBookingPaymentHistory = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$and : [
					{
						"vendorId" : ObjectId(data.userId)
					},
					{
						"status" : { $in : data.status}
					}
				]
			},
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "vendorId",
				foreignField: "_id",
				as: "vendorInfo"
			},
		}, 
		{
			$unwind: {
				path: '$vendorInfo',
				preserveNullAndEmptyArrays: true
			},
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "userInfo"
			}
		},
		{
			$unwind: {
				path: '$userInfo',
				preserveNullAndEmptyArrays: true
			},
		},
		{
			$project : {
				bookingId : 1,
				stripePaymentRef : 1,
				amount : 1,
				status : 1,
				remark : 1,
				createdAt : 1,
				userInfo : {
					firstName : 1,
					lastName : 1,
				},
				vendorInfo : {
					firstName : 1,
					lastName : 1,
				}
			}
		}
		);

		pipeline.push({ $sort: { createdAt: -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await BookingPaymentHistoryModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getAllVerifiedVendors = async () => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$and : [
					{
						"role" : 2
					},
					{
						"vendorDetails.isVerified" : true
					}
				]
			},
		});

		pipeline.push({
			$project : {
				_id : 1,
				firstName : 1,
				lastName : 1,
				email : 1
			}
		})

		const result = await UserModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.fetchUpcomingEventForDeleteVendor = async (id,type) => {
	try{
		let pipeline = [];

		if(type === 1) {
			pipeline.push({
				$match: {
					$and : [
						{
							"placeBookingDetails.vendorId" : ObjectId(id)
						},
					]
				},
			});
		}

		if(type === 2) {
			pipeline.push({
				$match: {
					$and : [
						{
							"serviceProviderId" : ObjectId(id)
						},
					]
				},
			});
		}

		if(type === 3) {
			pipeline.push({
				$match: {
					$and : [ 
						{
							$or : [ 
								{"placeBookingDetails.vendorId" : ObjectId(id)},
								{ "serviceProviderId" : ObjectId(id) } 
							], 
						}
					]
				},
			});
		}

		pipeline.push({
			$match: {
				"isCompleted" : "Upcoming"
			}
		});

		const result = await serviceBookingModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getDeviceIdOfUsers = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$expr : {
					$and : [
						{
							$in : ["$_id", data ]
						},
					]
				}
			},
		});

		pipeline.push({
			$project : {
				deviceId : 1,
				_id : 0
			}
		})

		const result = await UserModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : ', error);
		return false;
	}
}