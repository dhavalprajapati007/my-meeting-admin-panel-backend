const {
	SERVERERROR,
	SUCCESS,
	FAILURE,
	ACTIVE_STATUS,
	DELETED_STATUS,
} = require("../../../config/key");
const ServiceBookingModel = require("../../models/serviceBooking.model");
const VendorTimeslotModel = require("../../models/vendorTimeslot.model");
const { facetHelper } = require("../../helpers/pagination.helper");
var moment = require('moment');
var ObjectId = require("mongodb").ObjectID;
const BookingPaymentHistoryModel = require("../../models/bookingPaymentHistory.model");

//Get Booked Service
exports.getBookedService = async (data) => {
	try {
		let pipeline = [];

		//adding query into the pipeline array
		pipeline.push({
			$match: {
				_id: ObjectId(data._id),
				// status: ACTIVE_STATUS,
			},
		});

		pipeline.push({
			$lookup: {
				from: "services",
				localField: "serviceId",
				foreignField: "_id",
				as: "service"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "bookingUser"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "serviceProviderId",
				foreignField: "_id",
				as: "serviceProvider"
			}
		});

		pipeline.push({
			$lookup: {
				from: "virtualServiceDetails",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "virtualService"
			}
		})

		pipeline.push({
			$lookup: {
				from: "physicalPlaceParticipants",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "placeParticipants"
			}
		});

		pipeline.push({
			$lookup: {
				from: "offices",
				localField: "placeBookingDetails.officeId",
				foreignField: "_id",
				as: "office"
			}
		})

		pipeline.push({
			$lookup: {
				from: "officeCabins",
				localField: "placeBookingDetails.cabinId",
				foreignField: "_id",
				as: "cabin"
			}
		});

		pipeline.push({
			$lookup: {
				from: "reviews",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "reviews"
			}
		})

		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};

//Booked service List
exports.listBookedService = async (data) => {
	try {
		let pipeline = [];

		//adding query into the pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and: [
						{
							$in: ["$isCompleted", data.isCompleted]
						},
						{
							$in: ["$serviceType", data.serviceType]
						} 
					]
				}
			},
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'userId': '$userId' },
				pipeline: [
					{
						$match: { $expr: { $eq: [ '$_id', '$$userId' ] } }
					},
					{
						$project: {
							"firstName": 1,
							"lastName" : 1,
						} 
						// only include the SPECIFIED field
					}
				],
				as: 'bookingUserInfo'
			}
		},{
			$unwind: {
				path: '$bookingUserInfo',
				preserveNullAndEmptyArrays: true
			},
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'serviceProviderId': '$serviceProviderId' },
				pipeline: [
					{
						$match: { $expr: { $eq: [ '$_id', '$$serviceProviderId' ] } }
					},
					{
						$project: {
							"firstName": 1,
							"lastName" : 1,
						} 
						// only include the SPECIFIED field
					}
				],
				as: 'serviceProviderInfo'
			}
		},{
			$unwind: {
				path: '$serviceProviderInfo',
				preserveNullAndEmptyArrays: true
			},
		});

		pipeline.push({
			$lookup: {
				from: 'users',
				let: { 'vendorId': '$placeBookingDetails.vendorId' },
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
		},{
			$unwind: {
				path: '$vendorInfo',
				preserveNullAndEmptyArrays: true
			},
		});

		pipeline.push({ $sort: { date: -1,  'duration.startTime': -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};

// Booked service by user - with filter of serviceType and isCompleted status
exports.listBookedServicesByUser = async (data) => {
	try {
		let pipeline = [];

		// adding query into pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and: [
						{
							$eq: ["$userId", ObjectId(data.userId)]
						},
						{
							$in: ["$serviceType", data.serviceType]
						}
					]
				}
			},
		});

		// check for service booking by status
		if(data.isCompleted){
			pipeline.push({
				$match: {
					$expr: {
						$and : [
							{ $in: ["$isCompleted", data.isCompleted] }
						]
					}
				}
			})
		}

		pipeline.push({
			$lookup: {
				from: "virtualServiceDetails",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "virtualService"
			}
		});

		pipeline.push({
			$lookup: {
				from: "physicalPlaceParticipants",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "placeParticipants"
			}
		})

		pipeline.push({
			$lookup: {
				from: "offices",
				localField: "placeBookingDetails.officeId",
				foreignField: "_id",
				as: "office"
			}
		})

		pipeline.push({
			$lookup: {
				from: "officeCabins",
				localField: "placeBookingDetails.cabinId",
				foreignField: "_id",
				as: "cabin"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "serviceProviderId",
				foreignField: "_id",
				as: "serviceProvider"
			}
		})

		pipeline.push({ $sort: { date: -1, 'duration.startTime': -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	} catch (error) {
		console.log(error);
		return false;
	}
}


// Booked services by vendor - list with filter 
exports.listBookedServicesByVendor = async (data) => {
	try{
		let pipeline = [];

		// adding query into pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and: [
						{
							$or: [
								{ $eq: ["$serviceProviderId", ObjectId(data.userId)] },
								{ $eq: ["$placeBookingDetails.vendorId", ObjectId(data.userId)] }
							]
						},
						{
							$in: ["$serviceType", data.serviceType]
						}
					]
				}
			},
		});

		// check for service booking status
		if(data.isCompleted){
			pipeline.push({
				$match: {
					$expr: {
						$and : [
							{ $in: ["$isCompleted", data.isCompleted] }
						]
					}
				}
			})
		}

		pipeline.push({
			$lookup: {
				from: "virtualServiceDetails",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "virtualService"
			}
		});

		pipeline.push({
			$lookup: {
				from: "physicalPlaceParticipants",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "placeParticipants"
			}
		})

		pipeline.push({
			$lookup: {
				from: "offices",
				localField: "placeBookingDetails.officeId",
				foreignField: "_id",
				as: "office"
			}
		})

		pipeline.push({
			$lookup: {
				from: "officeCabins",
				localField: "placeBookingDetails.cabinId",
				foreignField: "_id",
				as: "cabin"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "serviceProviderId",
				foreignField: "_id",
				as: "serviceProvider"
			}
		})

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user"
			}
		})

		// pipeline.push({
		// 	$set: {
		// 		user: { $arrayElemAt: ["$user.firstName", 0] }
		// 	}
		// })

		pipeline.push({ $sort: { date: -1, 'duration.startTime': -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : list booked services by vendor : ', error);
		return false;
	}
}

//Get Dashboard count
exports.getDashboardCounts = async (data) => {
	try {
		let pipeline = [];

		// TODO: 
		if (data.serviceType == 3) {
			// virtual service
			pipeline.push({
				$match: {
					$expr: {
						$and: [
							{
								$eq: ["$serviceProviderId", ObjectId(data.userId)],
							}, {
								$eq: ["$serviceType", data.serviceType]
							}
						]
					}
				},
			});
		}
		
		if (data.serviceType == 1){
			// physical
			pipeline.push({
				$match: {
					$expr: {
						$and: [
							{
								$eq: ["$placeBookingDetails.vendorId", ObjectId(data.userId)],
							},{
								$eq: ["$serviceType", data.serviceType]
							}
						]
					}
				},
			});
		}

		if(data.serviceType == 2){
			// physical with service
			pipeline.push({
				$match: {
					$expr: {
						$and: [
							{
								$or: [
									{
										$eq: ["$placeBookingDetails.vendorId", ObjectId(data.userId)]
									},
									{
										$eq: ["$serviceProviderId", ObjectId(data.userId)]
									}
								]
							},{
								$eq: ["$serviceType", data.serviceType]
							}
						]
					}
				},
			});
		}

		pipeline.push({
			$group: {
				_id: "$id",
				totalCount: {
					$sum: 1
				},
				cancelledCount: {
					$sum: {
						$cond: [{ $in: ["$isCompleted", ['Cancelled','Unattended']] } , 1, 0]
					}
				},
				completedCount: {
					$sum: {
						$cond: [ { $eq: ["$isCompleted", 'Completed'] }, 1, 0]
					}
				},
				upcomingCount: {
					$sum: {
						$cond: [{ $in: ["$isCompleted", ['Upcoming','In-Progress']] }, 1, 0]
					}
				},
			}
		});

		let projection = {
			_id: 0
		}
		pipeline.push({ $project: projection });
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	} catch (e) {
		console.log(e);
		return false;
	}
};

// validate new booking is not overbooking.
exports.validatePlaceAndServiceAvailablity = async (data) => {
	try{
		let pipeline = [];

		console.log('officeId', data.officeId);
		console.log('cabinId', data.cabinId);
		console.log('service type ', data.serviceType);
		console.log('requested start Time ', new Date(data.startTime), moment(data.startTime).utc().format("DD-MM-YYYY HH:MM:SS") )
		console.log('requested end Time ', new Date(data.endTime), moment(data.endTime).utc().format("DD-MM-YYYY HH:MM:SS") )

		// physical Place Booking 
		if(data.serviceType == 1 && data.cabinId && data.officeId){
			pipeline.push({
				$match: {
					$expr:{
						$and: [
							{ $eq: ["$placeBookingDetails.cabinId", ObjectId(data.cabinId)] },
							{ $eq: ["$placeBookingDetails.officeId", ObjectId(data.officeId)] },
							{ $eq: ["$serviceType", data.serviceType] },
							{ $in: ["$isCompleted", ["Upcoming","In-Progress"]] },
							{
								$or: [
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.startTime) ] },
											{ $gte: ["$duration.endTime", new Date(data.startTime) ] }
										]
									},
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.endTime)] },
											{ $gte: ["$duration.endTime", new Date(data.endTime)] }
										]
									},
									{
										$and: [
											{ $gte: ["$duration.startTime", new Date(data.startTime)] },
											{ $lte: ["$duration.endTime", new Date(data.endTime)] }
										]
									}
								]
							}
						]
					}
				}
			})
		}

		// virtual Service Booking
		if(data.serviceType == 3 && data.serviceProviderId){
			pipeline.push({
				$match: {
					$expr:{
						$and: [
							{ $eq: ["$serviceProviderId", ObjectId(data.serviceProviderId)] },
							{ $eq: ["$serviceType", data.serviceType] },
							{ $in: ["$isCompleted", ["Upcoming", "In-Progress"] ] },
							{
								$or: [
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.startTime) ] },
											{ $gte: ["$duration.endTime", new Date(data.startTime) ] }
										]
									},
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.endTime)] },
											{ $gte: ["$duration.endTime", new Date(data.endTime)] }
										]
									},
									{
										$and: [
											{ $gte: ["$duration.startTime", new Date(data.startTime)] },
											{ $lte: ["$duration.endTime", new Date(data.endTime)] }
										]
									}
								]
							}
						]
					}
				}
			})
		}
		
		// Physical Place Booking With Service
		if(data.serviceType == 2 && (data.serviceProviderId || (data.cabinId && data.officeId))){
			pipeline.push({
				$match: {
					$expr:{
						$and: [
							{ $eq: ["$serviceType", data.serviceType] },
							{ $eq: ["$isCompleted", ["Upcoming","In-Progress"]] },
							{
								$or: [
									{
										$and: [
											{ $eq: ["$placeBookingDetails.cabinId", data.cabinId && data.cabinId !== undefined ?  ObjectId(data.cabinId) : ObjectId('61f030329260a44c33064b55') ] },
											{ $eq: ["$placeBookingDetails.officeId", data.officeId && data.officeId !== undefined ?  ObjectId(data.officeId) : ObjectId('61f030329260a44c33064b55') ] }
										]
									},
									{ $eq: ["$serviceProviderId", data.serviceProviderId && data.serviceProviderId !== undefined ?  ObjectId(data.serviceProviderId) : ObjectId('61f030329260a44c33064b55') ] }
								]
							},
							{
								$or: [
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.startTime) ] },
											{ $gte: ["$duration.endTime", new Date(data.startTime) ] }
										]
									},
									{
										$and: [
											{ $lte: ["$duration.startTime", new Date(data.endTime)] },
											{ $gte: ["$duration.endTime", new Date(data.endTime)] }
										]
									},
									{
										$and: [
											{ $gte: ["$duration.startTime", new Date(data.startTime)] },
											{ $lte: ["$duration.endTime", new Date(data.endTime)] }
										]
									}
								]
							}
						]
					}
				}
			})
		}
		
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;

	}catch(error){
		console.log('error : ', error);
		return false;
	}
}

exports.getVendorBookedTimeslots = async (data) => {
	try{
		let pipeline = [];

		pipeline.push({
			$match: {
				$expr:{
					$and: [
						{ $eq: ["$serviceProviderId", ObjectId(data.vendorId)] },
						{ $eq: ["$serviceType", 3] },
						{ $in: ["$isCompleted", ["Upcoming", "In-Progress"]] },
						{ $eq: ["$date", new Date(data.date)] }
					]
				}
			}
		});

		let result = await ServiceBookingModel.aggregate(pipeline);

		let slots = await VendorTimeslotModel.findOne({ userId: data.vendorId }).select('availableSlots');
		console.log('result total :: ', result.length);
		console.log('slots :: ', slots.availableSlots);

		if(slots && result && slots.availableSlots.length == 7){
			var day = moment(data.date).utc().format('d');
			let timeslots = slots.availableSlots[day];
			console.log('day : ', day);
			console.log('timeslots of the day : ', timeslots);
			result.forEach(i => {
				console.log(moment(i.duration.startTime).utc().format("YYYY-MM-DD HH:mm dd"));
				console.log(moment(i.duration.endTime).utc().format("YYYY-MM-DD HH:mm dd"));
				var index = timeslots.findIndex(slot => {
					if(moment(slot.s_time, "HH:mm").format('HH:mm') == moment(i.duration.startTime).utc().format("HH:mm") && moment(slot.e_time, "HH:mm").format('HH:mm') == moment(i.duration.endTime).utc().format("HH:mm")) return true;
					return false;
				});
				if(index != -1 ) timeslots[index].status = false;
			})
			return timeslots;
		}else{
			return false;
		}
	}catch(error){
		console.log('error in get vendor booked times', error);
		return false;
	}
}

exports.getTodaysBookingByBookingType = async (data) => {
	try{
		let pipeline = [];

		// adding query into pipeline array
		if(data.isPlace) {
			pipeline.push({
				$match: {
					$expr: {
						$and: [
							{
								$or: [
									{ $eq: ["$placeBookingDetails.vendorId", ObjectId(data.userId)] }
								]
							},
							{
								$in: ["$serviceType", data.serviceType]
							}
						]
					}
				},
			});
		}
		else{
			pipeline.push({
				$match: {
					$expr: {
						$and: [
							{
								$or: [
									{ $eq: ["$serviceProviderId", ObjectId(data.userId)] },
								]
							},
							{
								$in: ["$serviceType", data.serviceType]
							}
						]
					}
				},
			});
		}

		// check for service booking status
		if(data.isCompleted){
			pipeline.push({
				$match: {
					$expr: {
						$and : [
							{ $in: ["$isCompleted", data.isCompleted] }
						]
					}
				}
			})
		}

		pipeline.push({
			$match: {
				date : data.currentDate 
			}
		})

		pipeline.push({
			$lookup: {
				from: "virtualServiceDetails",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "virtualService"
			}
		});

		pipeline.push({
			$lookup: {
				from: "physicalPlaceParticipants",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "placeParticipants"
			}
		})

		pipeline.push({
			$lookup: {
				from: "offices",
				localField: "placeBookingDetails.officeId",
				foreignField: "_id",
				as: "office"
			}
		})

		pipeline.push({
			$lookup: {
				from: "officeCabins",
				localField: "placeBookingDetails.cabinId",
				foreignField: "_id",
				as: "cabin"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "serviceProviderId",
				foreignField: "_id",
				as: "serviceProvider"
			}
		})

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user"
			}
		})

		// pipeline.push({
		// 	$set: {
		// 		user: { $arrayElemAt: ["$user.firstName", 0] }
		// 	}
		// })

		pipeline.push({ $sort: { date: -1, 'duration.startTime': -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : list booked services by vendor : ', error);
		return false;
	}
}

exports.getTodaysBookingsForUser = async (data) => {
	try{
		let pipeline = [];

		// adding query into pipeline array
		pipeline.push({
			$match: {
				$expr: {
					$and : [
						{
							$eq: ["$userId", ObjectId(data.userId)]
						},{
							$in: ["$serviceType", data.serviceType]
						}
					]
				}
			}
		});

		// check for service booking status
		if(data.isCompleted){
			pipeline.push({
				$match: {
					$expr: {
						$and : [
							{ $in: ["$isCompleted", data.isCompleted] }
						]
					}
				}
			})
		}

		pipeline.push({
			$match: {
				date : data.currentDate 
			}
		})

		pipeline.push({
			$lookup: {
				from: "virtualServiceDetails",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "virtualService"
			}
		});

		pipeline.push({
			$lookup: {
				from: "physicalPlaceParticipants",
				localField: "_id",
				foreignField: "serviceBookingId",
				as: "placeParticipants"
			}
		})

		pipeline.push({
			$lookup: {
				from: "offices",
				localField: "placeBookingDetails.officeId",
				foreignField: "_id",
				as: "office"
			}
		})

		pipeline.push({
			$lookup: {
				from: "officeCabins",
				localField: "placeBookingDetails.cabinId",
				foreignField: "_id",
				as: "cabin"
			}
		});

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "serviceProviderId",
				foreignField: "_id",
				as: "serviceProvider"
			}
		})

		pipeline.push({
			$lookup: {
				from: "users",
				localField: "userId",
				foreignField: "_id",
				as: "user"
			}
		})

		// pipeline.push({
		// 	$set: {
		// 		user: { $arrayElemAt: ["$user.firstName", 0] }
		// 	}
		// })

		pipeline.push({ $sort: { date: -1, 'duration.startTime': -1 } }, facetHelper(Number(data.skip), Number(data.limit)));
		const result = await ServiceBookingModel.aggregate(pipeline);
		return result;
	}catch(error){
		console.log('error : list booked services by vendor : ', error);
		return false;
	}
}

exports.storeBookingPaymentHistory = async (userId, vendorId, bookingId, stripePaymentRef, amount, status="payment", remark = "") => {
	let bookingPaymentHistory = BookingPaymentHistoryModel({
		userId: userId,
		vendorId: vendorId,
		bookingId: bookingId,
		stripePaymentRef: stripePaymentRef,
		amount: amount,
		status: status,
		remark: remark
	})
	let savedRecords = await bookingPaymentHistory.save();
	if(!savedRecords) return false
	return savedRecords
}